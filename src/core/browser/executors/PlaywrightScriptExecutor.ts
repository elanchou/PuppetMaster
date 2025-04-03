import { Page } from 'playwright';
import { Logger } from '../../../utils/logger';
import { ExecutionResult } from '../../../types';

interface ScriptExecutor {
  execute(script: string, page: Page): Promise<ExecutionResult>;
}

interface ScriptResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class PlaywrightScriptExecutor implements ScriptExecutor {
  constructor(private logger: Logger) {}

  async execute(script: string, page: Page): Promise<ExecutionResult> {
    try {
      // 直接执行脚本，不需要额外传递 page 对象，因为在 evaluate 上下文中已经可以访问
      const wrappedScript = `
        (async () => {
          try {
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

      const result = await page.evaluate(wrappedScript) as ScriptResult;
      
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
    } catch (error) {
      this.logger.error('脚本执行失败', error);
      return {
        success: false,
        message: '执行失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
} 