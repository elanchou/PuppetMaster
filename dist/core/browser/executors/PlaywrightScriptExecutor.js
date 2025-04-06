"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightScriptExecutor = void 0;
class PlaywrightScriptExecutor {
    constructor(logger) {
        this.logger = logger;
    }
    async execute(script, page) {
        try {
            // 包装脚本以确保 page 对象可用
            const wrappedScript = `
        (async () => {
          try {
            const page = window;
            ${script}
            return { success: true, message: '执行成功' };
          } catch (error) {
            return { 
              success: false, 
              message: '执行失败',
              error: error instanceof Error ? error.message : '未知错误'
            };
          }
        })()
      `;
            const result = await page.evaluate(wrappedScript);
            if (!result.success) {
                this.logger.error('脚本执行失败', result.error);
                return {
                    success: false,
                    message: '执行失败',
                    error: result.error
                };
            }
            return {
                success: true,
                message: result.message || '执行成功'
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
