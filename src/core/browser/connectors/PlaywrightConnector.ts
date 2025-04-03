import { BrowserConnector } from '../../../types';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { Logger } from '../../../utils/logger';

export class PlaywrightConnector implements BrowserConnector {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(private readonly logger: Logger) {}

  async connect(): Promise<{ browser: Browser; context: BrowserContext }> {
    try {
      this.browser = await chromium.launch({
        headless: false
      });
      this.context = await this.browser.newContext();
      
      this.logger.info('Playwright 浏览器已连接');
      return { browser: this.browser, context: this.context };
    } catch (error) {
      this.logger.error('浏览器连接失败', error);
      throw error;
    }
  }

  async createPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('浏览器上下文未初始化');
    }
    return await this.context.newPage();
  }

  async disconnect(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.logger.info('Playwright 浏览器已关闭');
    }
  }
} 