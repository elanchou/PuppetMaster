import { Page } from 'playwright';

export default async function(page: Page): Promise<void> {
  try {
    // 访问 Google
    await page.goto('https://www.google.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 等待搜索框出现并输入 TSLA
    await page.waitForSelector('input[name="q"]');
    await page.fill('input[name="q"]', 'TSLA stock');
    
    // 模拟按下回车键
    await page.keyboard.press('Enter');

    // 等待搜索结果加载
    await page.waitForSelector('#search');

    // 等待一下，确保结果完全加载
    await page.waitForTimeout(2000);

    // 查找并点击第一个相关的股票结果
    const stockResult = await page.$$('[data-dt]');
    if (stockResult.length > 0) {
      await stockResult[0].click();
    }

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    console.log('搜索和打开 TSLA 完成');
  } catch (error) {
    console.error('执行出错:', error instanceof Error ? error.message : String(error));
    throw error;
  }
} 