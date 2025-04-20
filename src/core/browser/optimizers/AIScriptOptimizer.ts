import { ScriptOptimizer, Logger } from '../../../types';
import { Page } from 'playwright';
import { AIHandler } from '../../../core/ai/AIHandler';

interface ActionContext {
  type: string;
  selector: string;
  value?: string;
  retryCount: number;
  previousSelectors: string[];
  options?: Record<string, any>;
}

export class AIScriptOptimizer implements ScriptOptimizer {
  private maxRetries = 3;
  private selectorHistory = new Map<string, string[]>();

  constructor(
    private readonly logger: Logger,
    private readonly aiHandler: AIHandler
  ) {}

  async optimize(script: string, page: Page): Promise<string> {
    try {
      // 解析脚本为操作序列
      const actions = this.parseScript(script);
      let optimizedScript = '';

      // 逐个验证和优化每个操作
      for (const action of actions) {
        const optimizedAction = await this.optimizeAction(action, page);
        optimizedScript += this.actionToScript(optimizedAction) + '\n';
      }

      return optimizedScript.trim();
    } catch (error) {
      this.logger.error('脚本优化失败', error);
      return script;
    }
  }

  private async optimizeAction(action: ActionContext, page: Page): Promise<ActionContext> {
    let currentAction = { ...action };

    // 对于goto操作，直接返回
    if (currentAction.type === 'goto') {
      return currentAction;
    }

    while (currentAction.retryCount < this.maxRetries) {
      try {
        // 验证选择器
        await this.validateSelector(currentAction.selector, page);
        return currentAction;
      } catch (error) {
        currentAction.retryCount++;
        this.logger.warn(`选择器验证失败: ${currentAction.selector}，第 ${currentAction.retryCount} 次重试`);

        // 获取新的选择器建议
        const newSelector = await this.findAlternativeSelector(currentAction, page);
        if (!newSelector) {
          this.logger.error('无法找到替代选择器', { action: currentAction });
          break;
        }

        // 更新选择器历史
        this.updateSelectorHistory(currentAction.selector, newSelector);
        currentAction.selector = newSelector;
      }
    }

    return currentAction;
  }

  private async validateSelector(selector: string, page: Page): Promise<void> {
    try {
      // 检查选择器语法
      if (!this.isValidSelector(selector)) {
        throw new Error('无效的选择器语法');
      }

      // 等待选择器出现
      await page.waitForSelector(selector, { timeout: 5000 });

      // 验证选择器的唯一性
      const elements = await page.$$(selector);
      if (elements.length > 1) {
        this.logger.warn('选择器不唯一', { selector, count: elements.length });
      }

      // 验证选择器的可见性和可交互性
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (!isVisible) {
          throw new Error('元素不可见');
        }
      }
    } catch (error) {
      throw new Error(`选择器验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private isValidSelector(selector: string): boolean {
    // 简单的选择器语法验证
    const validPatterns = [
      /^[a-zA-Z][a-zA-Z0-9_-]*$/,  // ID选择器
      /^\.[a-zA-Z][a-zA-Z0-9_-]*$/,  // 类选择器
      /^[a-zA-Z][a-zA-Z0-9_-]*$/,  // 标签选择器
      /^\[[a-zA-Z][a-zA-Z0-9_-]*\]$/,  // 属性选择器
      /^[a-zA-Z][a-zA-Z0-9_-]* > [a-zA-Z][a-zA-Z0-9_-]*$/,  // 子元素选择器
      /^[a-zA-Z][a-zA-Z0-9_-]* [a-zA-Z][a-zA-Z0-9_-]*$/,  // 后代选择器
    ];

    return validPatterns.some(pattern => pattern.test(selector));
  }

  private async findAlternativeSelector(action: ActionContext, page: Page): Promise<string | null> {
    try {
      // 获取页面HTML
      const html = await page.content();

      // 使用AI生成新的选择器
      const prompt = `
        当前选择器: ${action.selector}
        操作类型: ${action.type}
        页面HTML: ${html}
        
        请生成一个新的选择器，要求：
        1. 能够准确定位到目标元素
        2. 尽可能稳定，不依赖于动态生成的ID或类名
        3. 优先使用语义化的选择器（如role、aria-label等）
        4. 如果可能，使用多个选择器组合以提高稳定性
      `;

      const response = await this.aiHandler.generateResponse(prompt);
      const newSelector = response.trim();

      // 验证新选择器
      if (this.isValidSelector(newSelector)) {
        return newSelector;
      }

      return null;
    } catch (error) {
      this.logger.error('生成替代选择器失败', error);
      return null;
    }
  }

  private updateSelectorHistory(oldSelector: string, newSelector: string) {
    if (!this.selectorHistory.has(oldSelector)) {
      this.selectorHistory.set(oldSelector, []);
    }
    this.selectorHistory.get(oldSelector)?.push(newSelector);
  }

  private parseScript(script: string): ActionContext[] {
    const actions: ActionContext[] = [];
    const lines = script.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) continue;

      const action: ActionContext = {
        type: parts[0],
        selector: parts[1],
        retryCount: 0,
        previousSelectors: [],
      };

      // 处理不同类型的操作
      switch (action.type) {
        case 'click':
        case 'type':
          if (parts.length >= 3) {
            action.value = parts.slice(2).join(' ');
          }
          break;
        case 'wait':
          if (parts.length >= 3) {
            action.options = { timeout: parseInt(parts[2], 10) };
          }
          break;
        case 'goto':
          action.selector = parts.slice(1).join(' ');
          break;
      }

      actions.push(action);
    }

    return actions;
  }

  private actionToScript(action: ActionContext): string {
    switch (action.type) {
      case 'click':
        return `click ${action.selector}`;
      case 'type':
        return `type ${action.selector} ${action.value || ''}`;
      case 'wait':
        return `wait ${action.selector} ${action.options?.timeout || 5000}`;
      case 'goto':
        return `goto ${action.selector}`;
      default:
        return '';
    }
  }
} 