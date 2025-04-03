"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIHandler = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
class AIHandler {
    // 暴露 chat 接口供优化器使用
    get chat() {
        if (!this.openai) {
            throw new Error('AI 服务未初始化');
        }
        return this.openai.chat;
    }
    constructor(config) {
        this.openai = null;
        this.fixAttempts = new Map();
        this.maxRetries = 3;
        this.config = config;
        this.logger = new logger_1.Logger();
        if (config.enabled) {
            this.openai = new openai_1.default({
                apiKey: config.apiKey,
                baseURL: 'https://api.deepseek.com/v1' // 使用 Deepseek API
            });
        }
    }
    async handleError(error, step) {
        if (!this.config.enabled || !this.openai)
            return;
        try {
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专门处理网页自动化错误的AI助手。请分析错误并提供解决方案。'
                    },
                    {
                        role: 'user',
                        content: `
              发生错误：${error.message}
              执行步骤：${JSON.stringify(step, null, 2)}
              请分析可能的原因并提供解决方案。
            `
                    }
                ]
            });
            const suggestion = response.choices[0]?.message?.content;
            if (suggestion) {
                this.logger.info('AI 建议的解决方案', { suggestion, step, error: error.message });
            }
        }
        catch (aiError) {
            this.logger.error('AI 处理错误失败', aiError);
        }
    }
    async optimizeScript(script, page) {
        if (!this.config.enabled || !this.openai)
            return script;
        try {
            const pageContent = await page.content();
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专门优化网页自动化脚本的AI助手。请分析并优化脚本代码。'
                    },
                    {
                        role: 'user',
                        content: `
              当前页面内容：${pageContent}
              当前脚本：${script}
              请分析并优化脚本，重点关注：
              1. 选择器的稳定性和唯一性
              2. 等待时机的合理性
              3. 错误处理的完整性
              请直接返回优化后的脚本代码，不需要解释。
            `
                    }
                ]
            });
            const optimizedScript = response.choices[0]?.message?.content;
            return optimizedScript || script;
        }
        catch (error) {
            this.logger.error('AI 优化脚本失败', error);
            return script;
        }
    }
    async analyzeSelectorAndSuggest(selector, page) {
        if (!this.config.enabled || !this.openai) {
            return { exists: false, similar: [], html: '' };
        }
        try {
            const pageContent = await page.content();
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专门分析网页选择器的AI助手。请分析选择器并提供替代方案。'
                    },
                    {
                        role: 'user',
                        content: `
              页面内容：${pageContent}
              当前选择器：${selector}
              请分析并提供：
              1. 该选择器是否存在
              2. 3个替代选择器建议
              请以JSON格式返回：{"exists": boolean, "similar": string[], "html": string}
            `
                    }
                ]
            });
            const analysis = response.choices[0]?.message?.content;
            if (analysis) {
                try {
                    return JSON.parse(analysis);
                }
                catch (parseError) {
                    this.logger.error('解析AI响应失败', parseError);
                }
            }
        }
        catch (error) {
            this.logger.error('AI 分析选择器失败', error);
        }
        return { exists: false, similar: [], html: '' };
    }
    async optimizeStep(step) {
        if (!this.config.enabled || !this.openai)
            return step;
        try {
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专门优化网页自动化步骤的AI助手。请分析并优化操作步骤。'
                    },
                    {
                        role: 'user',
                        content: `
              当前步骤：${JSON.stringify(step, null, 2)}
              请分析并提供优化建议，包括：
              1. 是否需要添加等待时间
              2. 是否需要调整选择器
              3. 是否需要添加额外的验证步骤
              请直接返回优化后的步骤JSON。
            `
                    }
                ]
            });
            const optimization = response.choices[0]?.message?.content;
            if (optimization) {
                try {
                    const optimizedStep = JSON.parse(optimization);
                    return { ...step, ...optimizedStep };
                }
                catch (parseError) {
                    this.logger.error('解析AI优化步骤失败', parseError);
                }
            }
        }
        catch (error) {
            this.logger.error('AI 优化步骤失败', error);
        }
        return step;
    }
    async handleErrorWithContext(context, page) {
        if (!this.config.enabled || !this.openai)
            return null;
        try {
            // 获取当前页面状态
            const currentHtml = await page.content();
            const currentUrl = page.url();
            const previousAttempts = this.fixAttempts.get(context.selector || '') || [];
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专门处理网页自动化错误的AI助手。请分析错误并提供具体的修复方案。'
                    },
                    {
                        role: 'user',
                        content: `
              错误信息：${context.error.message}
              当前URL：${currentUrl}
              当前选择器：${context.selector || '无'}
              当前操作：${context.action || '无'}
              之前的尝试：${JSON.stringify(previousAttempts)}
              页面HTML：${currentHtml}

              请分析错误原因并提供修复方案。需要：
              1. 新的选择器（如果是选择器问题）
              2. 等待条件（如果是时机问题）
              3. 替代方案（如果当前方法不可行）
              
              请以JSON格式返回：
              {
                "fixType": "selector|timing|alternative",
                "selector": "新的选择器",
                "waitCondition": "等待条件",
                "alternativeAction": "替代操作"
              }
            `
                    }
                ]
            });
            const fix = JSON.parse(response.choices[0]?.message?.content || '{}');
            // 记录尝试
            if (context.selector) {
                this.fixAttempts.set(context.selector, [
                    ...previousAttempts,
                    {
                        selector: fix.selector,
                        success: false,
                        error: context.error.message
                    }
                ]);
            }
            // 实施修复
            switch (fix.fixType) {
                case 'selector':
                    if (fix.selector) {
                        // 验证新选择器
                        try {
                            await page.waitForSelector(fix.selector, { timeout: 5000 });
                            return fix.selector;
                        }
                        catch (error) {
                            this.logger.error('新选择器验证失败', error);
                        }
                    }
                    break;
                case 'timing':
                    if (fix.waitCondition) {
                        try {
                            // 等待指定条件
                            await page.waitForFunction(fix.waitCondition, { timeout: 5000 });
                            return context.selector || null;
                        }
                        catch (error) {
                            this.logger.error('等待条件执行失败', error);
                        }
                    }
                    break;
                case 'alternative':
                    if (fix.alternativeAction) {
                        try {
                            // 执行替代操作
                            await page.evaluate(fix.alternativeAction);
                            return 'success';
                        }
                        catch (error) {
                            this.logger.error('替代操作执行失败', error);
                        }
                    }
                    break;
            }
            this.logger.error('无法修复错误，尝试下一个方案', { context });
            return null;
        }
        catch (error) {
            this.logger.error('AI 修复失败', error);
            return null;
        }
    }
    async monitorAndFix(action, page, context) {
        let retryCount = 0;
        while (retryCount < this.maxRetries) {
            try {
                await action();
                // 如果成功，更新之前的尝试记录
                if (context.selector) {
                    const attempts = this.fixAttempts.get(context.selector) || [];
                    const lastAttempt = attempts[attempts.length - 1];
                    if (lastAttempt) {
                        lastAttempt.success = true;
                    }
                }
                return true;
            }
            catch (error) {
                retryCount++;
                this.logger.warn(`执行失败，第 ${retryCount} 次重试`, { error, context });
                if (error instanceof Error) {
                    const fix = await this.handleErrorWithContext({ ...context, error }, page);
                    if (fix === null) {
                        this.logger.error('无法修复错误，尝试下一个方案', { context });
                        continue;
                    }
                    if (fix === 'success') {
                        return true;
                    }
                    // 更新选择器并继续尝试
                    if (context.selector) {
                        context.selector = fix;
                    }
                }
            }
        }
        return false;
    }
}
exports.AIHandler = AIHandler;
