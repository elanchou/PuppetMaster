import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import { Logger } from '../../utils/logger';

export class AIPilot {
  private stagehand: Stagehand;
  private logger: Logger;

  constructor(apiKey: string) {
    this.logger = new Logger();
    this.stagehand = new Stagehand({
      env: 'LOCAL',
      modelName: 'gemini-2.0-flash',
      modelClientOptions: {
        apiKey: apiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      },
    });
    this.logger.info('AIPilot 初始化，使用模型: gemini-2.0-flash');
  }

  async init() {
    try {
      await this.stagehand.init();
      this.logger.info('AIPilot 初始化成功');
    } catch (error) {
      this.logger.error('AIPilot 初始化失败', error);
      throw error;
    }
  }

  async navigateToUrl(url: string) {
    try {
      const page = this.stagehand.page;
      await page.goto(url);
      this.logger.info(`已导航到 ${url}`);
    } catch (error) {
      this.logger.error(`导航到 ${url} 失败`, error);
      throw error;
    }
  }

  async performAction(instruction: string) {
    try {
      const page = this.stagehand.page;
      await page.act(instruction);
      this.logger.info(`已执行操作: ${instruction}`);
    } catch (error) {
      this.logger.error(`执行操作失败: ${instruction}`, error);
      throw error;
    }
  }

  async extractData<T extends z.AnyZodObject>(
    instruction: string,
    schema: T
  ): Promise<z.infer<T>> {
    try {
      const page = this.stagehand.page;
      const result = await page.extract({
        instruction,
        schema,
      });
      this.logger.info(`数据提取成功`);
      return result;
    } catch (error) {
      this.logger.error(`数据提取失败，指令: ${instruction}`, error);
      throw error;
    }
  }

  async close() {
    try {
      await this.stagehand.close();
      this.logger.info('AIPilot 已关闭');
    } catch (error) {
      this.logger.error('关闭 AIPilot 失败', error);
      throw error;
    }
  }
} 