import { Router } from 'express';
import { Automator } from '../../core/automator/Automator';
import { AIScriptOptimizer } from '../../core/browser/optimizers/AIScriptOptimizer';
import { PlaywrightScriptExecutor } from '../../core/browser/executors/PlaywrightScriptExecutor';
import { AdsConnector } from '../../core/browser/connectors/AdsConnector';
import { PlaywrightConnector } from '../../core/browser/connectors/PlaywrightConnector';
import { Logger } from '../../utils/logger';
import { AIHandler } from '../../ai/AIHandler';
import { AutomationConfig } from '../../types';

const router = Router();
export const errorCorrectionRouter = router;

// 启动纠错过程
router.post('/start', async (req, res) => {
  const { script, useAds, adsUserId } = req.body;

  try {
    if (!script) {
      return res.status(400).json({ success: false, error: '脚本内容不能为空' });
    }

    const logger = new Logger();
    const aiConfig = {
      enabled: true,
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY || ''
    };
    const aiHandler = new AIHandler(aiConfig);

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

    // 执行脚本
    const results = await automator.executeScript(script);
    
    res.json({ 
      success: true, 
      message: '脚本执行已启动',
      results
    });

  } catch (error) {
    console.error('启动执行失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
}); 