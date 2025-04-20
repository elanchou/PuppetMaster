import { Logger } from '../../utils/logger';
import OpenAI from 'openai';

interface AIConfig {
  enabled: boolean;
  model: string;
  apiKey: string;
}

interface MessageCallback {
  onMessage?: (type: string, content: string) => void;
}

export class AIHandler {
  private openai: OpenAI;
  private logger: Logger;
  private config: AIConfig;
  private messageCallback?: MessageCallback;

  constructor(config: AIConfig, messageCallback?: MessageCallback) {
    this.logger = new Logger();
    this.config = config;
    this.messageCallback = messageCallback;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专门优化网页选择器的AI助手。请分析当前页面并提供更好的选择器。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('AI响应为空');
      }

      if (this.messageCallback?.onMessage) {
        this.messageCallback.onMessage('response', result);
      }

      return result;
    } catch (error) {
      this.logger.error('生成AI响应失败', error);
      throw error;
    }
  }

  async suggestSelectorFix(selector: string, action: string, error: string): Promise<string | null> {
    try {
      const prompt = `
        当前选择器: ${selector}
        操作类型: ${action}
        错误信息: ${error}
        
        请提供一个更稳定的选择器。要求：
        1. 使用更可靠的属性（如 id、name、data-* 等）
        2. 避免使用动态生成的类名或ID
        3. 优先使用语义化的选择器
      `;

      return await this.generateResponse(prompt);
    } catch (error) {
      this.logger.error('生成选择器修复建议失败', error);
      return null;
    }
  }
} 