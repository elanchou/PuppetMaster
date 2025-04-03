"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightConnector = void 0;
const playwright_1 = require("playwright");
class PlaywrightConnector {
    constructor(logger) {
        this.logger = logger;
        this.browser = null;
        this.context = null;
    }
    async connect() {
        try {
            this.browser = await playwright_1.chromium.launch({
                headless: false
            });
            this.context = await this.browser.newContext();
            this.logger.info('Playwright 浏览器已连接');
            return { browser: this.browser, context: this.context };
        }
        catch (error) {
            this.logger.error('浏览器连接失败', error);
            throw error;
        }
    }
    async createPage() {
        if (!this.context) {
            throw new Error('浏览器上下文未初始化');
        }
        return await this.context.newPage();
    }
    async disconnect() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.logger.info('Playwright 浏览器已关闭');
        }
    }
}
exports.PlaywrightConnector = PlaywrightConnector;
