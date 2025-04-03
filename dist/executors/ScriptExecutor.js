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
        async (page) => {
          try {
            ${script}
          } catch (error) {
            console.error('脚本执行错误:', error);
            throw error;
          }
        }
      `;
            // 使用 eval 执行包装后的脚本
            const scriptFunction = eval(wrappedScript);
            await scriptFunction(page);
            return {
                success: true,
                message: '执行成功'
            };
        }
        catch (error) {
            this.logger.error('执行脚本失败', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
}
exports.PlaywrightScriptExecutor = PlaywrightScriptExecutor;
