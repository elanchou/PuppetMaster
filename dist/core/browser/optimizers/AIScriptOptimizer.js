"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIScriptOptimizer = void 0;
class AIScriptOptimizer {
    constructor(logger, aiHandler) {
        this.logger = logger;
        this.aiHandler = aiHandler;
        this.maxRetries = 3;
        this.selectorHistory = new Map();
    }
    async optimize(script, page) {
        try {
            // 解析脚本为操作序列
            const actions = this.parseScript(script);
            let optimizedScript = '';
            // 逐个验证和优化每个操作
            for (const action of actions) {
                const optimizedAction = await this.optimizeAction(action, page);
                optimizedScript += this.actionToScript(optimizedAction) + '\n';
            }
            return optimizedScript.trim();
        }
        catch (error) {
            this.logger.error('脚本优化失败', error);
            return script;
        }
    }
    async optimizeAction(action, page) {
        let currentAction = { ...action };
        while (currentAction.retryCount < this.maxRetries) {
            try {
                // 验证选择器
                await this.validateSelector(currentAction.selector, page);
                return currentAction;
            }
            catch (error) {
                currentAction.retryCount++;
                this.logger.warn(`选择器验证失败: ${currentAction.selector}，第 ${currentAction.retryCount} 次重试`);
                // 获取新的选择器建议
                const newSelector = await this.findAlternativeSelector(currentAction, page);
                if (!newSelector) {
                    this.logger.error('无法找到替代选择器', { action: currentAction });
                    break;
                }
                // 更新选择器历史
                this.updateSelectorHistory(currentAction.selector, newSelector);
                currentAction.selector = newSelector;
            }
        }
        return currentAction;
    }
    async validateSelector(selector, page) {
        try {
            // 等待选择器出现
            await page.waitForSelector(selector, { timeout: 5000 });
            // 验证选择器的唯一性
            const elements = await page.$$(selector);
            if (elements.length > 1) {
                this.logger.warn('选择器不唯一', { selector, count: elements.length });
            }
            // 验证选择器的可见性
            const element = await page.$(selector);
            if (element) {
                const isVisible = await element.isVisible();
                if (!isVisible) {
                    throw new Error('元素不可见');
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            throw new Error(`选择器验证失败: ${errorMessage}`);
        }
    }
    async findAlternativeSelector(action, page) {
        try {
            const html = await page.content();
            const response = await this.aiHandler.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专门优化网页选择器的AI助手。请分析当前页面并提供更好的选择器。'
                    },
                    {
                        role: 'user',
                        content: `
              当前选择器: ${action.selector}
              操作类型: ${action.type}
              历史选择器: ${action.previousSelectors.join(', ')}
              页面HTML: ${html}

              请分析并提供一个新的选择器，要求：
              1. 必须唯一定位到目标元素
              2. 优先使用 id、name、可靠的 class
              3. 考虑元素的文本内容和属性
              4. 避免使用动态生成的属性
              5. 确保选择器的稳定性

              只返回选择器字符串，不要其他解释。
            `
                    }
                ]
            });
            const newSelector = response.choices[0]?.message?.content?.trim();
            if (newSelector && newSelector !== action.selector) {
                // 验证新选择器
                await this.validateSelector(newSelector, page);
                return newSelector;
            }
        }
        catch (error) {
            this.logger.error('查找替代选择器失败', error);
        }
        return null;
    }
    updateSelectorHistory(oldSelector, newSelector) {
        const history = this.selectorHistory.get(oldSelector) || [];
        history.push(newSelector);
        this.selectorHistory.set(oldSelector, history);
    }
    parseScript(script) {
        const actions = [];
        const lines = script.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//'))
                continue;
            let action = null;
            if (trimmed.startsWith('click')) {
                const selector = trimmed.match(/click\(['"](.+)['"]\)/)?.[1];
                if (selector) {
                    action = {
                        type: 'click',
                        selector,
                        retryCount: 0,
                        previousSelectors: []
                    };
                }
            }
            else if (trimmed.startsWith('type')) {
                const match = trimmed.match(/type\(['"](.+)['"],\s*['"](.+)['"]\)/);
                if (match) {
                    action = {
                        type: 'type',
                        selector: match[1],
                        value: match[2],
                        retryCount: 0,
                        previousSelectors: []
                    };
                }
            }
            else if (trimmed.startsWith('wait')) {
                const selector = trimmed.match(/wait\(['"](.+)['"]\)/)?.[1];
                if (selector) {
                    action = {
                        type: 'wait',
                        selector,
                        retryCount: 0,
                        previousSelectors: []
                    };
                }
            }
            if (action) {
                action.previousSelectors = this.selectorHistory.get(action.selector) || [];
                actions.push(action);
            }
        }
        return actions;
    }
    actionToScript(action) {
        switch (action.type) {
            case 'click':
                return `click('${action.selector}')`;
            case 'type':
                return `type('${action.selector}', '${action.value}')`;
            case 'wait':
                return `wait('${action.selector}')`;
            default:
                return '';
        }
    }
}
exports.AIScriptOptimizer = AIScriptOptimizer;
