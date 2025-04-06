import OpenAI from 'openai';
import { RecordedStep, SelectorAnalysis } from '../types';
import { Logger } from '../utils/logger';
import { Page } from 'playwright';

interface AIConfig {
  enabled: boolean;
  model: string;
  apiKey: string;
}

interface AIHandlerOptions {
  onMessage?: (type: string, content: string) => void;
}

interface ErrorContext {
  error: Error;
  selector?: string;
  action?: string;
  html?: string;
  previousActions?: string[];
}

interface FixAttempt {
  selector: string;
  success: boolean;
  error?: string;
}

export class AIHandler {
  private openai: OpenAI | null = null;
  private logger: Logger;
  private config: AIConfig;
  private fixAttempts: Map<string, FixAttempt[]> = new Map();
  private maxRetries = 3;
  private onMessage?: (type: string, content: string) => void;

  // 暴露 chat 接口供优化器使用
  public get chat() {
    if (!this.openai) {
      throw new Error('AI 服务未初始化');
    }
    return this.openai.chat;
  }

  constructor(config: AIConfig, options?: AIHandlerOptions) {
    this.config = config;
    this.logger = new Logger();
    this.onMessage = options?.onMessage;
    
    if (config.enabled) {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: 'https://api.deepseek.com/v1'  // 使用 Deepseek API
      });
    }
  }

  private sendMessage(type: string, content: string): void {
    if (this.onMessage) {
      this.onMessage(type, content);
    }
  }

  async handleError(error: Error, step: RecordedStep): Promise<void> {
    if (!this.config.enabled || !this.openai) return;

    try {
      this.sendMessage('system', `分析错误: ${error.message}`);

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专门处理网页自动化错误的AI助手。请分析错误并提供解决方案。'
          },
          {
            role: 'user',
            content: `
              发生错误：${error.message}
              执行步骤：${JSON.stringify(step, null, 2)}
              请分析可能的原因并提供解决方案。
            `
          }
        ]
      });

      const suggestion = response.choices[0]?.message?.content;
      if (suggestion) {
        this.logger.info('AI 建议的解决方案', { suggestion, step, error: error.message });
        this.sendMessage('ai', suggestion);
      }
    } catch (aiError) {
      this.logger.error('AI 处理错误失败', aiError);
      this.sendMessage('system', `AI处理失败: ${aiError instanceof Error ? aiError.message : '未知错误'}`);
    }
  }

  async optimizeScript(script: string, page: Page): Promise<string> {
    if (!this.config.enabled || !this.openai) return script;

    try {
      this.sendMessage('system', '正在优化脚本...');
      
      const pageContent = await page.content();
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专门优化网页自动化脚本的AI助手。请分析并优化脚本代码。'
          },
          {
            role: 'user',
            content: `
              当前页面内容：${pageContent}
              当前脚本：${script}
              请分析并优化脚本，重点关注：
              1. 选择器的稳定性和唯一性
              2. 等待时机的合理性
              3. 错误处理的完整性
              请直接返回优化后的脚本代码，不需要解释。
            `
          }
        ]
      });

      const optimizedScript = response.choices[0]?.message?.content;
      
      if (optimizedScript && optimizedScript !== script) {
        this.sendMessage('ai', `优化后的脚本:\n\`\`\`\n${optimizedScript}\n\`\`\``);
      } else {
        this.sendMessage('ai', '脚本无需优化');
      }
      
      return optimizedScript || script;
    } catch (error) {
      this.logger.error('AI 优化脚本失败', error);
      this.sendMessage('system', `优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return script;
    }
  }

  async analyzeSelectorAndSuggest(selector: string, page: Page): Promise<SelectorAnalysis> {
    if (!this.config.enabled || !this.openai) {
      return { exists: false, similar: [], html: '' };
    }

    try {
      this.sendMessage('system', `分析选择器: ${selector}`);
      
      const pageContent = await page.content();
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专门分析网页选择器的AI助手。请分析选择器并提供替代方案。'
          },
          {
            role: 'user',
            content: `
              页面内容：${pageContent}
              当前选择器：${selector}
              请分析并提供：
              1. 该选择器是否存在
              2. 3个替代选择器建议
              请以JSON格式返回：{"exists": boolean, "similar": string[], "html": string}
            `
          }
        ]
      });

      const analysis = response.choices[0]?.message?.content;
      if (analysis) {
        try {
          const result = JSON.parse(analysis);
          this.sendMessage('ai', `选择器分析:\n存在: ${result.exists ? '是' : '否'}\n替代选择器: ${result.similar.join(', ')}`);
          return result;
        } catch (parseError) {
          this.logger.error('解析AI响应失败', parseError);
          this.sendMessage('system', `解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
        }
      }
    } catch (error) {
      this.logger.error('AI 分析选择器失败', error);
      this.sendMessage('system', `分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return { exists: false, similar: [], html: '' };
  }

  async optimizeStep(step: RecordedStep): Promise<RecordedStep> {
    if (!this.config.enabled || !this.openai) return step;

    try {
      this.sendMessage('system', `优化步骤: ${step.action} ${step.selector}`);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专门优化网页自动化步骤的AI助手。请分析并优化操作步骤。'
          },
          {
            role: 'user',
            content: `
              当前步骤：${JSON.stringify(step, null, 2)}
              请分析并提供优化建议，包括：
              1. 是否需要添加等待时间
              2. 是否需要调整选择器
              3. 是否需要添加额外的验证步骤
              请直接返回优化后的步骤JSON。
            `
          }
        ]
      });

      const optimization = response.choices[0]?.message?.content;
      if (optimization) {
        try {
          const optimizedStep = JSON.parse(optimization);
          this.sendMessage('ai', `优化后的步骤:\n\`\`\`\n${JSON.stringify(optimizedStep, null, 2)}\n\`\`\``);
          return { ...step, ...optimizedStep };
        } catch (parseError) {
          this.logger.error('解析AI优化步骤失败', parseError);
          this.sendMessage('system', `解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
        }
      }
    } catch (error) {
      this.logger.error('AI 优化步骤失败', error);
      this.sendMessage('system', `优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return step;
  }

  async handleErrorWithContext(context: ErrorContext, page: Page): Promise<string | null> {
    if (!this.config.enabled || !this.openai) return null;

    try {
      // 获取当前页面状态
      const currentHtml = await page.content();
      const currentUrl = page.url();
      const previousAttempts = this.fixAttempts.get(context.selector || '') || [];

      this.sendMessage('system', `修复错误: ${context.error.message}, 选择器: ${context.selector || '未知'}`);

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专门处理网页自动化错误的AI助手。请分析错误并提供具体的修复方案。'
          },
          {
            role: 'user',
            content: `
              错误信息：${context.error.message}
              当前URL：${currentUrl}
              当前选择器：${context.selector || '无'}
              当前操作：${context.action || '无'}
              之前的尝试：${JSON.stringify(previousAttempts)}
              页面HTML：${currentHtml}

              请分析错误原因并提供修复方案。需要：
              1. 新的选择器（如果是选择器问题）
              2. 等待条件（如果是时机问题）
              3. 替代方案（如果当前方法不可行）
              
              请以JSON格式返回：
              {
                "fixType": "selector|timing|alternative",
                "selector": "新的选择器",
                "waitCondition": "等待条件",
                "alternativeAction": "替代操作"
              }
            `
          }
        ]
      });

      const fixResponse = response.choices[0]?.message?.content || '{}';
      this.sendMessage('ai', fixResponse);
      
      const fix = JSON.parse(fixResponse);
      
      // 记录尝试
      if (context.selector) {
        this.fixAttempts.set(context.selector, [
          ...previousAttempts,
          {
            selector: fix.selector,
            success: false,
            error: context.error.message
          }
        ]);
      }

      // 实施修复
      switch (fix.fixType) {
        case 'selector':
          if (fix.selector) {
            // 验证新选择器
            try {
              this.sendMessage('system', `尝试新选择器: ${fix.selector}`);
              await page.waitForSelector(fix.selector, { timeout: 5000 });
              this.sendMessage('system', `新选择器验证成功`);
              return fix.selector;
            } catch (error) {
              this.logger.error('新选择器验证失败', error);
              this.sendMessage('system', `新选择器验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
          }
          break;

        case 'timing':
          if (fix.waitCondition) {
            try {
              // 等待指定条件
              this.sendMessage('system', `执行等待条件: ${fix.waitCondition}`);
              await page.waitForFunction(fix.waitCondition, { timeout: 5000 });
              this.sendMessage('system', `等待条件执行成功`);
              return context.selector || null;
            } catch (error) {
              this.logger.error('等待条件执行失败', error);
              this.sendMessage('system', `等待条件执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
          }
          break;

        case 'alternative':
          if (fix.alternativeAction) {
            try {
              // 执行替代操作
              this.sendMessage('system', `执行替代操作: ${fix.alternativeAction}`);
              await page.evaluate(fix.alternativeAction);
              this.sendMessage('system', `替代操作执行成功`);
              return 'success';
            } catch (error) {
              this.logger.error('替代操作执行失败', error);
              this.sendMessage('system', `替代操作执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
          }
          break;
      }

      this.logger.error('无法修复错误，尝试下一个方案', { context });
      this.sendMessage('system', `无法修复错误，尝试下一个方案`);
      return null;
    } catch (error) {
      this.logger.error('AI 修复失败', error);
      this.sendMessage('system', `AI修复失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  }

  async monitorAndFix(
    action: () => Promise<void>,
    page: Page,
    context: Omit<ErrorContext, 'error'>
  ): Promise<boolean> {
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      try {
        await action();
        // 如果成功，更新之前的尝试记录
        if (context.selector) {
          const attempts = this.fixAttempts.get(context.selector) || [];
          const lastAttempt = attempts[attempts.length - 1];
          if (lastAttempt) {
            lastAttempt.success = true;
          }
        }
        return true;
      } catch (error) {
        retryCount++;
        this.logger.warn(`执行失败，第 ${retryCount} 次重试`, { error, context });
        this.sendMessage('system', `执行失败，第 ${retryCount} 次重试: ${error instanceof Error ? error.message : '未知错误'}`);

        if (error instanceof Error) {
          const fix = await this.handleErrorWithContext(
            { ...context, error },
            page
          );
          if (fix === null) {
            this.logger.error('无法修复错误，尝试下一个方案', { context });
            this.sendMessage('system', `无法修复错误，尝试下一个方案`);
            continue;
          }

          if (fix === 'success') {
            this.sendMessage('system', `修复成功`);
            return true;
          }

          // 更新选择器并继续尝试
          if (context.selector) {
            context.selector = fix;
            this.sendMessage('system', `使用新选择器继续尝试: ${fix}`);
          }
        }
      }
    }

    this.sendMessage('system', `达到最大重试次数，修复失败`);
    return false;
  }

  async suggestSelectorFix(
    selector: string,
    action: string,
    errorMessage: string
  ): Promise<string | null> {
    if (!this.config.enabled || !this.openai) return null;

    try {
      this.sendMessage('system', `建议选择器修复方案: ${selector}, 错误: ${errorMessage}`);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专门优化网页选择器的AI助手。请分析错误并提供更好的选择器。'
          },
          {
            role: 'user',
            content: `
              当前选择器: ${selector}
              操作类型: ${action}
              错误信息: ${errorMessage}
              
              请分析错误原因并提供更稳定的选择器。注意：
              1. 避免使用索引或位置信息
              2. 优先使用 ID, name, 或稳定的 class 属性
              3. 考虑使用内容文本、aria 属性等更稳定的标识
              4. 选择器应该能够准确地定位到目标元素
              
              只返回建议的选择器字符串，不要其他解释。
            `
          }
        ]
      });

      const newSelector = response.choices[0]?.message?.content?.trim();
      
      if (newSelector && newSelector !== selector) {
        this.sendMessage('ai', `建议的选择器: ${newSelector}`);
        return newSelector;
      } else {
        this.sendMessage('system', `无法提供更好的选择器`);
        return null;
      }
    } catch (error) {
      this.logger.error('获取选择器建议失败', error);
      this.sendMessage('system', `获取选择器建议失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  }
} 