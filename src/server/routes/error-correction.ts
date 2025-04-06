import { Router } from 'express';
import { Automator } from '../../core/automator/Automator';
import { AIScriptOptimizer } from '../../core/browser/optimizers/AIScriptOptimizer';
import { PlaywrightScriptExecutor } from '../../core/browser/executors/PlaywrightScriptExecutor';
import { AdsConnector } from '../../core/browser/connectors/AdsConnector';
import { PlaywrightConnector } from '../../core/browser/connectors/PlaywrightConnector';
import { Logger } from '../../utils/logger';
import { AIHandler } from '../../ai/AIHandler';
import { AutomationConfig } from '../../types';
import { WebSocketServer } from '../../websocket/WebSocketServer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
export const errorCorrectionRouter = router;

// 错误记录存储
let errorRecords: Array<{
  id: string;
  timestamp: string;
  selector: string;
  action: string;
  error: string;
  attempts: Array<{
    selector: string;
    success: boolean;
    timestamp: string;
  }>;
  status: 'pending' | 'fixed' | 'failed';
}> = [];

// 启动纠错过程
router.post('/start', async (req, res) => {
  const { script, useAds, adsUserId } = req.body;

  try {
    if (!script) {
      return res.status(400).json({ success: false, error: '脚本内容不能为空' });
    }

    const correctionId = uuidv4();
    const logger = new Logger();
    
    // 添加日志处理函数
    const handleLog = (level: string, message: string, context: any) => {
      // 发送日志到WebSocket
      WebSocketServer.getInstance().broadcast('log', {
        correctionId,
        level,
        message,
        context,
        timestamp: new Date().toISOString()
      });
    };

    // 重写 logger 的方法
    const originalInfo = logger.info.bind(logger);
    const originalError = logger.error.bind(logger);
    const originalWarn = logger.warn.bind(logger);

    logger.info = (message: string, meta?: any) => {
      handleLog('info', message, meta);
      originalInfo(message, meta);
    };

    logger.error = (message: string, error: any) => {
      handleLog('error', message, error);
      originalError(message, error);
    };

    logger.warn = (message: string, meta?: any) => {
      handleLog('warn', message, meta);
      originalWarn(message, meta);
    };

    const aiConfig = {
      enabled: true,
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY || ''
    };
    const aiHandler = new AIHandler(aiConfig, {
      onMessage: (type, content) => {
        // 发送AI消息到WebSocket
        WebSocketServer.getInstance().broadcast('ai-message', {
          correctionId,
          type,
          content,
          timestamp: new Date().toISOString()
        });
      }
    });

    // 创建自动化配置
    const config: AutomationConfig = {
      recordingPath: '',
      browserInstances: 1,
      randomization: {
        mouseMovement: false,
        clickOffset: 0,
        waitTime: {
          min: 1000,
          max: 3000
        }
      },
      aiConfig
    };

    // 创建自动化实例
    const connector = useAds ? 
      new AdsConnector(logger) :
      new PlaywrightConnector(logger);
    
    const executor = new PlaywrightScriptExecutor(logger);
    const optimizer = new AIScriptOptimizer(logger, aiHandler);
    
    const automator = new Automator(
      config,
      connector,
      optimizer,
      executor,
      logger
    );

    // 初始化自动化实例
    await automator.initialize(useAds, adsUserId);

    // 发送开始消息
    WebSocketServer.getInstance().broadcast('correction-start', {
      correctionId,
      timestamp: new Date().toISOString()
    });

    // 异步执行脚本
    automator.executeScript(script).then(results => {
      // 处理执行结果
      const errorInfos = results.filter(r => !r.success).map(r => ({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        selector: r.selectorInfo?.selector || 'unknown',
        action: r.selectorInfo?.action || 'unknown',
        error: r.error || '未知错误',
        attempts: [],
        status: 'pending' as const
      }));

      // 添加错误记录
      errorRecords = [...errorRecords, ...errorInfos];

      // 发送完成消息
      WebSocketServer.getInstance().broadcast('correction-complete', {
        correctionId,
        success: results.every(r => r.success),
        errorCount: errorInfos.length,
        timestamp: new Date().toISOString()
      });

      // 清理资源
      automator.cleanup().catch(e => logger.error('清理失败', e));
    }).catch(error => {
      logger.error('执行失败', error);
      
      // 发送错误消息
      WebSocketServer.getInstance().broadcast('correction-error', {
        correctionId,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      });

      // 清理资源
      automator.cleanup().catch(e => logger.error('清理失败', e));
    });
    
    res.json({ 
      success: true, 
      correctionId,
      message: '脚本执行已启动'
    });

  } catch (error) {
    console.error('启动执行失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
});

// 获取所有错误记录
router.get('/errors', (_req, res) => {
  res.json(errorRecords);
});

// 重试修复错误
router.post('/errors/:id/retry', async (req, res) => {
  const { id } = req.params;
  const errorRecord = errorRecords.find(e => e.id === id);
  
  if (!errorRecord) {
    return res.status(404).json({ message: '错误记录不存在' });
  }

  const logger = new Logger();
  const aiConfig = {
    enabled: true,
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY || ''
  };
  const aiHandler = new AIHandler(aiConfig);

  try {
    // 尝试AI自动修复
    const newSelector = await aiHandler.suggestSelectorFix(
      errorRecord.selector, 
      errorRecord.action, 
      errorRecord.error
    );

    if (newSelector) {
      errorRecord.attempts.push({
        selector: newSelector,
        success: true,
        timestamp: new Date().toISOString()
      });
      errorRecord.status = 'fixed';
    } else {
      errorRecord.attempts.push({
        selector: errorRecord.selector,
        success: false,
        timestamp: new Date().toISOString()
      });
      
      if (errorRecord.attempts.length >= 3) {
        errorRecord.status = 'failed';
      }
    }

    res.json(errorRecord);
  } catch (error) {
    logger.error('重试修复失败', error);
    
    errorRecord.attempts.push({
      selector: errorRecord.selector,
      success: false,
      timestamp: new Date().toISOString()
    });
    
    if (errorRecord.attempts.length >= 3) {
      errorRecord.status = 'failed';
    }
    
    res.json(errorRecord);
  }
});

// 自定义修复错误
router.post('/errors/:id/fix', (req, res) => {
  const { id } = req.params;
  const { selector } = req.body;
  const errorRecord = errorRecords.find(e => e.id === id);
  
  if (!errorRecord) {
    return res.status(404).json({ message: '错误记录不存在' });
  }

  errorRecord.attempts.push({
    selector,
    success: true,
    timestamp: new Date().toISOString()
  });
  
  errorRecord.status = 'fixed';
  res.json(errorRecord);
});

export default router; 