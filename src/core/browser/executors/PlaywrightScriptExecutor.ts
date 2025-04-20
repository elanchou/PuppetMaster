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
  private registeredFunctions = new Set<string>();

  constructor(private logger: Logger) {}

  async execute(script: string, page: Page): Promise<ExecutionResult> {
    try {
      // 检查并注册辅助函数
      await this.registerHelperFunctions(page);

      // 包装脚本以确保 page 对象可用
      const wrappedScript = `
        (async () => {
          try {
            const page = window.__playwright_page;
            if (!page) {
              throw new Error('页面对象未初始化');
            }
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

      // 注入 page 对象到页面上下文
      await page.evaluateOnNewDocument(() => {
        (window as any).__playwright_page = page;
      });

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

  private async registerHelperFunctions(page: Page): Promise<void> {
    const functions = [
      {
        name: 'waitForSelectorWithRetry',
        fn: async (selector: string, options = {}) => {
          try {
            return await page.waitForSelector(selector, options);
          } catch (error) {
            this.logger.warn(`等待选择器失败: ${selector}`, error);
            return null;
          }
        }
      },
      {
        name: 'fillWithRetry',
        fn: async (selector: string, value: string) => {
          try {
            const element = await page.waitForSelector(selector);
            if (element) {
              await element.fill(value);
              return true;
            }
            return false;
          } catch (error) {
            this.logger.warn(`填充输入框失败: ${selector}`, error);
            return false;
          }
        }
      }
    ];

    for (const { name, fn } of functions) {
      if (!this.registeredFunctions.has(name)) {
        try {
          await page.exposeFunction(name, fn);
          this.registeredFunctions.add(name);
        } catch (error) {
          if (!(error instanceof Error && error.message.includes('already registered'))) {
            throw error;
          }
        }
      }
    }
  }
} 