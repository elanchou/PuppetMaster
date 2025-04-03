"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIScriptOptimizer = void 0;
class AIScriptOptimizer {
    constructor(logger, openai) {
        this.logger = logger;
        this.openai = openai;
    }
    async optimize(script, page) {
        try {
            // 提取脚本中的所有选择器
            const selectorRegex = /'([^']*)'|"([^"]*)"/g;
            const matches = script.matchAll(selectorRegex);
            const optimizations = [];
            for (const match of matches) {
                const selector = match[1] || match[2];
                if (!selector.includes(' ') && !selector.startsWith('/')) {
                    const analysis = await this.analyzeSelector(page, selector);
                    if (!analysis.exists && analysis.similar.length > 0) {
                        // 使用AI选择最佳的替代选择器
                        const prompt = `
原始选择器: ${selector}
可能的替代选择器: ${JSON.stringify(analysis.similar)}
HTML上下文: ${analysis.html}

请分析这些选择器，并选择最稳定和通用的一个。考虑：
1. 选择器的唯一性
2. 选择器的稳定性（不易变化）
3. 选择器的可读性
4. 选择器的通用性

请只返回选择的选择器，不要有其他文本。
`;
                        const response = await this.openai.chat.completions.create({
                            model: 'gpt-4',
                            messages: [
                                { role: 'system', content: '你是一个专门优化CSS选择器的AI助手。' },
                                { role: 'user', content: prompt }
                            ]
                        });
                        const optimizedSelector = response.choices[0].message.content?.trim();
                        if (optimizedSelector) {
                            optimizations.push({
                                original: selector,
                                optimized: optimizedSelector
                            });
                        }
                    }
                }
            }
            // 应用优化
            let optimizedScript = script;
            for (const opt of optimizations) {
                optimizedScript = optimizedScript.replace(new RegExp(`(['"])${opt.original}\\1`, 'g'), `'${opt.optimized}'`);
            }
            return optimizedScript;
        }
        catch (error) {
            this.logger.error('优化脚本失败', error);
            return script;
        }
    }
    async analyzeSelector(page, selector) {
        try {
            // 检查选择器是否存在
            const exists = await page.$(selector) !== null;
            // 获取页面的当前状态
            const html = await page.evaluate(() => document.body.innerHTML);
            // 如果选择器不存在，获取相似的选择器
            const similar = exists ? [] : await this.findSimilarSelectors(selector, html);
            return { exists, similar, html };
        }
        catch (error) {
            this.logger.error('分析选择器失败', error);
            throw error;
        }
    }
    async findSimilarSelectors(originalSelector, html) {
        try {
            const prompt = `
分析以下HTML内容，找到最可能匹配选择器 "${originalSelector}" 的其他选择器。
考虑以下因素：
1. 相似的ID或class名称
2. 相似的DOM结构
3. 相似的文本内容
4. 相似的属性值

HTML内容:
${html}

请返回最多3个最可能的选择器，格式为JSON数组。
`;
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: '你是一个专门分析HTML和CSS选择器的AI助手。' },
                    { role: 'user', content: prompt }
                ]
            });
            return JSON.parse(response.choices[0].message.content || '[]');
        }
        catch (error) {
            this.logger.error('查找相似选择器失败', error);
            return [];
        }
    }
}
exports.AIScriptOptimizer = AIScriptOptimizer;
