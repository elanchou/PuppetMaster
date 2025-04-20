import { Request, Response } from 'express';
import { AIPilot } from '../../core/ai/AIPilot';
import { Logger } from '../../utils/logger';

export class AIPilotController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  async execute(req: Request, res: Response) {
    const { url, instruction, apiKey } = req.body;

    if (!url || !instruction || !apiKey) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    try {
      const pilot = new AIPilot(apiKey);
      await pilot.init();

      // 导航到目标网址
      await pilot.navigateToUrl(url);

      // 执行指令
      await pilot.performAction(instruction);

      // 关闭浏览器
      await pilot.close();

      this.logger.info('AI Pilot执行成功');
      return res.json({
        success: true,
        message: '执行成功',
      });
    } catch (error) {
      this.logger.error('AI Pilot执行失败', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
      });
    }
  }
} 