"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightScriptExecutor = void 0;
class PlaywrightScriptExecutor {
    constructor(logger) {
        this.logger = logger;
    }
    async execute(script, page) {
        try {
            // 包装脚本以捕获错误
            const wrappedScript = `
        (async () => {
          ${script}
        })()
      `;
            await page.evaluate(wrappedScript);
            return {
                success: true,
                message: '执行成功'
            };
        }
        catch (error) {
            this.logger.error('脚本执行失败', error);
            return {
                success: false,
                message: '执行失败',
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
}
exports.PlaywrightScriptExecutor = PlaywrightScriptExecutor;
