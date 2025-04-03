import { Page } from 'playwright';

interface WaitTimeConfig {
  min: number;
  max: number;
}

interface RandomizationConfig {
  mouseMovement: boolean;
  clickOffset: number;
  waitTime: WaitTimeConfig;
}

export async function randomDelay(config: WaitTimeConfig): Promise<void> {
  const delay = Math.random() * (config.max - config.min) + config.min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function addRandomMouseMovement(
  page: Page,
  selector: string,
  config: RandomizationConfig
): Promise<void> {
  if (!config.mouseMovement) return;

  const element = await page.$(selector);
  if (!element) return;

  const box = await element.boundingBox();
  if (!box) return;

  // 生成随机的中间点
  const points = generateRandomPath(
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    config.clickOffset
  );

  // 执行鼠标移动
  for (const point of points) {
    await page.mouse.move(point.x, point.y);
    await randomDelay({ min: 10, max: 30 });
  }
}

function generateRandomPath(
  target: { x: number; y: number },
  maxOffset: number
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const numPoints = Math.floor(Math.random() * 5) + 3;

  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: target.x + (Math.random() - 0.5) * maxOffset,
      y: target.y + (Math.random() - 0.5) * maxOffset
    });
  }

  return points;
} 