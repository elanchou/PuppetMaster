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
const WebSocketServer_1 = require("../../websocket/WebSocketServer");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
exports.errorCorrectionRouter = router;
// 错误记录存储
let errorRecords = [];
// 启动纠错过程
router.post('/start', async (req, res) => {
    const { script, useAds, adsUserId } = req.body;
    try {
        if (!script) {
            return res.status(400).json({ success: false, error: '脚本内容不能为空' });
        }
        const correctionId = (0, uuid_1.v4)();
        const logger = new logger_1.Logger();
        // 添加日志处理函数
        const handleLog = (level, message, context) => {
            // 发送日志到WebSocket
            WebSocketServer_1.WebSocketServer.getInstance().broadcast('log', {
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
        logger.info = (message, meta) => {
            handleLog('info', message, meta);
            originalInfo(message, meta);
        };
        logger.error = (message, error) => {
            handleLog('error', message, error);
            originalError(message, error);
        };
        logger.warn = (message, meta) => {
            handleLog('warn', message, meta);
            originalWarn(message, meta);
        };
        const aiConfig = {
            enabled: true,
            model: 'gpt-4',
            apiKey: process.env.OPENAI_API_KEY || ''
        };
        const aiHandler = new AIHandler_1.AIHandler(aiConfig, {
            onMessage: (type, content) => {
                // 发送AI消息到WebSocket
                WebSocketServer_1.WebSocketServer.getInstance().broadcast('ai-message', {
                    correctionId,
                    type,
                    content,
                    timestamp: new Date().toISOString()
                });
            }
        });
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
        // 发送开始消息
        WebSocketServer_1.WebSocketServer.getInstance().broadcast('correction-start', {
            correctionId,
            timestamp: new Date().toISOString()
        });
        // 异步执行脚本
        automator.executeScript(script).then(results => {
            // 处理执行结果
            const errorInfos = results.filter(r => !r.success).map(r => ({
                id: (0, uuid_1.v4)(),
                timestamp: new Date().toISOString(),
                selector: r.selectorInfo?.selector || 'unknown',
                action: r.selectorInfo?.action || 'unknown',
                error: r.error || '未知错误',
                attempts: [],
                status: 'pending'
            }));
            // 添加错误记录
            errorRecords = [...errorRecords, ...errorInfos];
            // 发送完成消息
            WebSocketServer_1.WebSocketServer.getInstance().broadcast('correction-complete', {
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
            WebSocketServer_1.WebSocketServer.getInstance().broadcast('correction-error', {
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
    }
    catch (error) {
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
    const logger = new logger_1.Logger();
    const aiConfig = {
        enabled: true,
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY || ''
    };
    const aiHandler = new AIHandler_1.AIHandler(aiConfig);
    try {
        // 尝试AI自动修复
        const newSelector = await aiHandler.suggestSelectorFix(errorRecord.selector, errorRecord.action, errorRecord.error);
        if (newSelector) {
            errorRecord.attempts.push({
                selector: newSelector,
                success: true,
                timestamp: new Date().toISOString()
            });
            errorRecord.status = 'fixed';
        }
        else {
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
    }
    catch (error) {
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
exports.default = router;
