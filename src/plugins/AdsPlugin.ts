import axios from 'axios';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { Logger } from '../utils/logger';

interface AdsResponse {
  code: number;
  data: {
    ws: {
      puppeteer: string;
    };
  };
}

export class AdsPlugin {
  private logger: Logger;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private baseUrl: string;
  private userId: string | null = null;

  constructor(baseUrl: string = 'http://local.adspower.net:50325') {
    this.logger = new Logger();
    this.baseUrl = baseUrl;
  }

  async connect(userId: string): Promise<{ browser: Browser; context: BrowserContext }> {
    try {
      this.userId = userId;
      const response = await axios.get<AdsResponse>(`${this.baseUrl}/api/v1/browser/start?user_id=${userId}`);
      
      if (response.data.code !== 0 || !response.data.data.ws?.puppeteer) {
        throw new Error('AdsPower 启动失败或返回数据无效');
      }

      this.browser = await chromium.connectOverCDP(response.data.data.ws.puppeteer);
      this.context = this.browser.contexts()[0];

      if (!this.context) {
        throw new Error('无法获取浏览器上下文');
      }

      this.logger.info(`AdsPower 浏览器已连接: ${userId}`);
      return { browser: this.browser, context: this.context };
    } catch (error) {
      this.logger.error('AdsPower 连接失败', error);
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

      // 调用 AdsPower API 关闭浏览器
      if (this.userId) {
        try {
          await axios.get(`${this.baseUrl}/api/v1/browser/stop?user_id=${this.userId}`);
          this.logger.info(`AdsPower 浏览器已关闭: ${this.userId}`);
        } catch (error) {
          this.logger.error('AdsPower 关闭失败', error);
        }
        this.userId = null;
      }
    }
  }
} 