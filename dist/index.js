"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const automator_1 = require("./core/automator");
const logger_1 = require("./utils/logger");
const connectors_1 = require("./core/browser/connectors");
const optimizers_1 = require("./core/browser/optimizers");
const executors_1 = require("./core/browser/executors");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const AIHandler_1 = require("./ai/AIHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const logger = new logger_1.Logger();
app.use((0, cors_1.default)());
app.use((0, body_parser_1.json)());
// 配置信息
const config = {
    recordingPath: process.env.RECORDING_PATH || path_1.default.join(__dirname, '../recordings'),
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
const aiHandler = new AIHandler_1.AIHandler(config.aiConfig);
const connector = new connectors_1.AdsConnector(logger);
const optimizer = new optimizers_1.AIScriptOptimizer(logger, aiHandler);
const executor = new executors_1.PlaywrightScriptExecutor(logger);
// 创建自动化实例
const automator = new automator_1.Automator(config, connector, optimizer, executor, logger);
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
    }
    catch (error) {
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
