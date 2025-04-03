import { Logger as CoreLogger } from '../../utils/logger';

// 创建一个全局共享的 logger 实例
export const logger = new CoreLogger();

// 导出 Logger 类型以供类型声明使用
export type Logger = CoreLogger; 