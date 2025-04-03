"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Automator = void 0;
class Automator {
    constructor(config, connector, optimizer, executor, logger) {
        this.config = config;
        this.connector = connector;
        this.optimizer = optimizer;
        this.executor = executor;
        this.logger = logger;
        this.browser = null;
        this.context = null;
        this.pages = [];
    }
    async initialize(useAds, adsUserId) {
        try {
            if (useAds && !adsUserId) {
                throw new Error('使用 AdsPower 时需要提供用户ID');
            }
            const { browser, context } = useAds && adsUserId
                ? await this.connector.connect(adsUserId)
                : await this.connector.connect();
            this.browser = browser;
            this.context = context;
            // 创建多个页面
            for (let i = 0; i < this.config.browserInstances; i++) {
                const page = await this.context.newPage();
                this.pages.push(page);
            }
        }
        catch (error) {
            this.logger.error('初始化失败', error);
            throw error;
        }
    }
    async executeScript(scriptContent, instanceCount = 1) {
        if (!this.browser) {
            throw new Error('浏览器未初始化');
        }
        const results = [];
        try {
            // 首先用一个实例运行并优化脚本
            const page = this.pages[0];
            if (!page) {
                throw new Error('无法获取页面实例');
            }
            // 第一次执行，可能会失败
            let result = await this.executor.execute(scriptContent, page);
            // 如果执行失败，尝试优化脚本
            if (!result.success) {
                this.logger.info('首次执行失败，正在优化脚本...');
                const optimizedScript = await this.optimizer.optimize(scriptContent, page);
                if (optimizedScript !== scriptContent) {
                    this.logger.info('脚本已优化，正在重试...');
                    result = await this.executor.execute(optimizedScript, page);
                    if (result.success) {
                        result.optimizedScript = optimizedScript;
                        result.message = '脚本已优化并成功执行';
                    }
                }
            }
            results.push(result);
            // 使用最终版本的脚本执行剩余实例
            const finalScript = result.optimizedScript || scriptContent;
            for (let i = 1; i < instanceCount; i++) {
                const page = this.pages[i];
                if (!page) {
                    throw new Error('无法获取页面实例');
                }
                const instanceResult = await this.executor.execute(finalScript, page);
                instanceResult.instance = i + 1;
                results.push(instanceResult);
            }
        }
        catch (error) {
            this.logger.error('执行失败', error);
            throw error;
        }
        return results;
    }
    async cleanup() {
        for (const page of this.pages) {
            await page.close();
        }
        this.pages = [];
        await this.connector.disconnect();
        this.browser = null;
        this.context = null;
    }
}
exports.Automator = Automator;
