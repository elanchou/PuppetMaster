import { ScriptOptimizer, Logger } from '../../../types';
import { Page } from 'playwright';
import { AIHandler } from '../../../ai/AIHandler';

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
  private supportedActions = new Set([
    'click', 'type', 'wait', 'goto', 'select', 
    'check', 'uncheck', 'hover', 'press'
  ]);

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

        const isEnabled = await element.isEnabled();
        if (!isEnabled) {
          throw new Error('元素不可交互');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`选择器验证失败: ${errorMessage}`);
    }
  }

  private isValidSelector(selector: string): boolean {
    try {
      // 检查CSS选择器语法
      if (selector.startsWith('//')) {
        // XPath选择器
        return true;
      }
      
      // 尝试解析CSS选择器
      document.querySelector(selector);
      return true;
    } catch {
      return false;
    }
  }

  private async findAlternativeSelector(action: ActionContext, page: Page): Promise<string | null> {
    try {
      const html = await page.content();
      const response = await this.aiHandler.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专门优化网页选择器的AI助手。请分析当前页面并提供更好的选择器。'
          },
          {
            role: 'user',
            content: `
              当前选择器: ${action.selector}
              操作类型: ${action.type}
              历史选择器: ${action.previousSelectors.join(', ')}
              页面HTML: ${html}

              请分析并提供一个新的选择器，要求：
              1. 必须唯一定位到目标元素
              2. 优先使用 id、name、可靠的 class
              3. 考虑元素的文本内容和属性
              4. 避免使用动态生成的属性
              5. 确保选择器的稳定性
              6. 支持CSS选择器和XPath
              7. 考虑元素的层级关系
              8. 注意元素的可见性和可交互性

              只返回选择器字符串，不要其他解释。
            `
          }
        ]
      });

      const newSelector = response.choices[0]?.message?.content?.trim();
      if (newSelector && newSelector !== action.selector) {
        // 验证新选择器
        await this.validateSelector(newSelector, page);
        return newSelector;
      }
    } catch (error) {
      this.logger.error('查找替代选择器失败', error);
    }

    return null;
  }

  private updateSelectorHistory(oldSelector: string, newSelector: string) {
    const history = this.selectorHistory.get(oldSelector) || [];
    history.push(newSelector);
    this.selectorHistory.set(oldSelector, history);
  }

  private parseScript(script: string): ActionContext[] {
    const actions: ActionContext[] = [];
    const lines = script.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      let action: ActionContext | null = null;

      // 解析各种操作类型
      if (trimmed.startsWith('goto')) {
        const url = trimmed.match(/goto\(['"](.+)['"]\)/)?.[1];
        if (url) {
          action = {
            type: 'goto',
            selector: url,
            retryCount: 0,
            previousSelectors: []
          };
        }
      } else if (trimmed.startsWith('click')) {
        const selector = trimmed.match(/click\(['"](.+)['"]\)/)?.[1];
        if (selector) {
          action = {
            type: 'click',
            selector,
            retryCount: 0,
            previousSelectors: []
          };
        }
      } else if (trimmed.startsWith('type')) {
        const match = trimmed.match(/type\(['"](.+)['"],\s*['"](.+)['"]\)/);
        if (match) {
          action = {
            type: 'type',
            selector: match[1],
            value: match[2],
            retryCount: 0,
            previousSelectors: []
          };
        }
      } else if (trimmed.startsWith('select')) {
        const match = trimmed.match(/select\(['"](.+)['"],\s*['"](.+)['"]\)/);
        if (match) {
          action = {
            type: 'select',
            selector: match[1],
            value: match[2],
            retryCount: 0,
            previousSelectors: []
          };
        }
      } else if (trimmed.startsWith('check')) {
        const selector = trimmed.match(/check\(['"](.+)['"]\)/)?.[1];
        if (selector) {
          action = {
            type: 'check',
            selector,
            retryCount: 0,
            previousSelectors: []
          };
        }
      } else if (trimmed.startsWith('uncheck')) {
        const selector = trimmed.match(/uncheck\(['"](.+)['"]\)/)?.[1];
        if (selector) {
          action = {
            type: 'uncheck',
            selector,
            retryCount: 0,
            previousSelectors: []
          };
        }
      } else if (trimmed.startsWith('hover')) {
        const selector = trimmed.match(/hover\(['"](.+)['"]\)/)?.[1];
        if (selector) {
          action = {
            type: 'hover',
            selector,
            retryCount: 0,
            previousSelectors: []
          };
        }
      } else if (trimmed.startsWith('press')) {
        const match = trimmed.match(/press\(['"](.+)['"],\s*['"](.+)['"]\)/);
        if (match) {
          action = {
            type: 'press',
            selector: match[1],
            value: match[2],
            retryCount: 0,
            previousSelectors: []
          };
        }
      } else if (trimmed.startsWith('wait')) {
        const selector = trimmed.match(/wait\(['"](.+)['"]\)/)?.[1];
        if (selector) {
          action = {
            type: 'wait',
            selector,
            retryCount: 0,
            previousSelectors: []
          };
        }
      }

      if (action) {
        action.previousSelectors = this.selectorHistory.get(action.selector) || [];
        actions.push(action);
      }
    }

    return actions;
  }

  private actionToScript(action: ActionContext): string {
    switch (action.type) {
      case 'goto':
        return `goto('${action.selector}')`;
      case 'click':
        return `click('${action.selector}')`;
      case 'type':
        return `type('${action.selector}', '${action.value}')`;
      case 'select':
        return `select('${action.selector}', '${action.value}')`;
      case 'check':
        return `check('${action.selector}')`;
      case 'uncheck':
        return `uncheck('${action.selector}')`;
      case 'hover':
        return `hover('${action.selector}')`;
      case 'press':
        return `press('${action.selector}', '${action.value}')`;
      case 'wait':
        return `wait('${action.selector}')`;
      default:
        return '';
    }
  }
} 