import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { Automator } from './core/automator';
import { AutomationConfig } from './types';
import { Logger } from './utils/logger';
import { AdsConnector } from './core/browser/connectors';
import { AIScriptOptimizer } from './core/browser/optimizers';
import { PlaywrightScriptExecutor } from './core/browser/executors';
import dotenv from 'dotenv';
import path from 'path';
import { AIHandler } from './core/ai/AIHandler';

dotenv.config();

const app = express();
const logger = new Logger();

app.use(cors());
app.use(json());

// 配置信息
const config: AutomationConfig = {
  recordingPath: process.env.RECORDING_PATH || path.join(__dirname, '../recordings'),
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

// API 路由
app.post('/api/execute', async (req, res) => {
  try {
    const { script, instances, useAds, adsUserId } = req.body;
    
    if (!script) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (useAds && !adsUserId) {
      return res.status(400).json({ error: '使用 AdsPower 时需要提供用户ID' });
    }
    await automator.initialize();
    const results = await automator.executeScript(script, instances);
    await automator.cleanup();

    res.json({ success: true, results });
  } catch (error) {
    logger.error('执行自动化失败', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
});

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`服务器启动在端口 ${PORT}`);
});