"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorCorrectionRouter = void 0;
const express_1 = require("express");
const Automator_1 = require("../../core/automator/Automator");
const AIScriptOptimizer_1 = require("../../core/browser/optimizers/AIScriptOptimizer");
const PlaywrightScriptExecutor_1 = require("../../core/browser/executors/PlaywrightScriptExecutor");
const AdsConnector_1 = require("../../core/browser/connectors/AdsConnector");
const PlaywrightConnector_1 = require("../../core/browser/connectors/PlaywrightConnector");
const logger_1 = require("../../utils/logger");
const AIHandler_1 = require("../../ai/AIHandler");
const router = (0, express_1.Router)();
exports.errorCorrectionRouter = router;
// 启动纠错过程
router.post('/start', async (req, res) => {
    const { script, useAds, adsUserId } = req.body;
    try {
        if (!script) {
            return res.status(400).json({ success: false, error: '脚本内容不能为空' });
        }
        const logger = new logger_1.Logger();
        const aiConfig = {
            enabled: true,
            model: 'gpt-4',
            apiKey: process.env.OPENAI_API_KEY || ''
        };
        const aiHandler = new AIHandler_1.AIHandler(aiConfig);
        // 创建自动化配置
        const config = {
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
            new AdsConnector_1.AdsConnector(logger) :
            new PlaywrightConnector_1.PlaywrightConnector(logger);
        const executor = new PlaywrightScriptExecutor_1.PlaywrightScriptExecutor(logger);
        const optimizer = new AIScriptOptimizer_1.AIScriptOptimizer(logger, aiHandler);
        const automator = new Automator_1.Automator(config, connector, optimizer, executor, logger);
        // 初始化自动化实例
        await automator.initialize(useAds, adsUserId);
        // 执行脚本
        const results = await automator.executeScript(script);
        res.json({
            success: true,
            message: '脚本执行已启动',
            results
        });
    }
    catch (error) {
        console.error('启动执行失败:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
