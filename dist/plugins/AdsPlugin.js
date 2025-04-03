"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdsPlugin = void 0;
const axios_1 = __importDefault(require("axios"));
const playwright_1 = require("playwright");
const logger_1 = require("../utils/logger");
class AdsPlugin {
    constructor(baseUrl = 'http://local.adspower.net:50325') {
        this.browser = null;
        this.context = null;
        this.userId = null;
        this.logger = new logger_1.Logger();
        this.baseUrl = baseUrl;
    }
    async connect(userId) {
        try {
            this.userId = userId;
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/browser/start?user_id=${userId}`);
            if (response.data.code !== 0 || !response.data.data.ws?.puppeteer) {
                throw new Error('AdsPower 启动失败或返回数据无效');
            }
            this.browser = await playwright_1.chromium.connectOverCDP(response.data.data.ws.puppeteer);
            this.context = this.browser.contexts()[0];
            if (!this.context) {
                throw new Error('无法获取浏览器上下文');
            }
            this.logger.info(`AdsPower 浏览器已连接: ${userId}`);
            return { browser: this.browser, context: this.context };
        }
        catch (error) {
            this.logger.error('AdsPower 连接失败', error);
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
            // 调用 AdsPower API 关闭浏览器
            if (this.userId) {
                try {
                    await axios_1.default.get(`${this.baseUrl}/api/v1/browser/stop?user_id=${this.userId}`);
                    this.logger.info(`AdsPower 浏览器已关闭: ${this.userId}`);
                }
                catch (error) {
                    this.logger.error('AdsPower 关闭失败', error);
                }
                this.userId = null;
            }
        }
    }
}
exports.AdsPlugin = AdsPlugin;
