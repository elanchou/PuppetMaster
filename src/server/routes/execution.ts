import { Router } from 'express';
import { Logger } from '../../utils/logger';
import { Automator } from '../../core/automator';
import { AutomationConfig } from '../../types';
import { AdsConnector } from '../../core/browser/connectors';
import { AIScriptOptimizer } from '../../core/browser/optimizers';
import { PlaywrightScriptExecutor } from '../../core/browser/executors';
import { AIHandler } from '../../ai/AIHandler';
import path from 'path';

const router = Router();
export const executionRouter = router;

const logger = new Logger();

// 配置信息
const config: AutomationConfig = {
  recordingPath: process.env.RECORDING_PATH || path.join(__dirname, '../../../recordings'),
  browserInstances: Number(process.env.BROWSER_INSTANCES) || 1,
  randomization: {
    mouseMovement: process.env.ENABLE_MOUSE_MOVEMENT === 'true',
    clickOffset: Number(process.env.CLICK_OFFSET) || 5,
    waitTime: {
      min: Number(process.env.MIN_WAIT_TIME) || 500,
      max: Number(process.env.MAX_WAIT_TIME) || 2000
    }
  },
  aiConfig: {
    enabled: process.env.ENABLE_AI === 'true',
    model: process.env.AI_MODEL || 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY || ''
  }
};

// 创建依赖实例
const aiHandler = new AIHandler(config.aiConfig);
const connector = new AdsConnector(logger);
const optimizer = new AIScriptOptimizer(logger, aiHandler);
const executor = new PlaywrightScriptExecutor(logger);

// 创建自动化实例
const automator = new Automator(config, connector, optimizer, executor, logger);

// 启动浏览器
router.get('/start', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: '缺少必要参数 user_id' 
      });
    }

    const result = await connector.start(user_id as string);
    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    logger.error('启动浏览器失败', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
});

// 停止浏览器
router.get('/stop', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: '缺少必要参数 user_id' 
      });
    }

    await connector.stop(user_id as string);
    res.json({ 
      success: true 
    });
  } catch (error) {
    logger.error('停止浏览器失败', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
});

// 执行脚本
router.post('/execute', async (req, res) => {
  try {
    const { script, instances, useAds, adsUserId } = req.body;
    
    logger.info('收到执行请求', { 
      scriptLength: script ? script.length : 0,
      instances, 
      useAds, 
      adsUserId 
    });
    
    if (!script) {
      logger.error('缺少必要参数: script', {});
      return res.status(400).json({ 
        success: false,
        error: '缺少必要参数: script' 
      });
    }

    if (useAds && !adsUserId) {
      logger.error('使用 AdsPower 时缺少用户ID', {});
      return res.status(400).json({ 
        success: false,
        error: '使用 AdsPower 时需要提供用户ID' 
      });
    }

    logger.info('初始化自动化实例...', {});
    try {
      await automator.initialize(useAds, adsUserId);
    } catch (initError) {
      logger.error('初始化失败', initError);
      return res.status(500).json({ 
        success: false, 
        error: `初始化失败: ${initError instanceof Error ? initError.message : '未知错误'}` 
      });
    }
    
    logger.info('开始执行脚本...', {});
    let results;
    try {
      results = await automator.executeScript(script, instances || 1);
    } catch (execError) {
      logger.error('脚本执行失败', execError);
      return res.status(500).json({ 
        success: false, 
        error: `脚本执行失败: ${execError instanceof Error ? execError.message : '未知错误'}` 
      });
    }
    
    logger.info('清理资源...', {});
    try {
      await automator.cleanup();
    } catch (cleanupError) {
      logger.error('清理资源失败', cleanupError);
      // 这里不返回错误，因为脚本已经执行完成
    }

    logger.info('执行完成', { results });
    res.json({ 
      success: true, 
      results 
    });
  } catch (error) {
    logger.error('执行自动化失败', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
}); 