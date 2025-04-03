import { Browser, BrowserContext, Page } from 'playwright';

export interface RecordedStep {
  type: 'click' | 'input' | 'scroll' | 'navigation' | 'custom';
  selector?: string;
  value?: string;
  url?: string;
  timestamp: number;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface AutomationConfig {
  recordingPath: string;
  browserInstances: number;
  randomization: {
    mouseMovement: boolean;
    clickOffset: number;
    waitTime: {
      min: number;
      max: number;
    };
  };
  aiConfig: {
    enabled: boolean;
    model: string;
    apiKey: string;
  };
}

export interface BrowserConnector {
  connect(userId?: string): Promise<{ browser: Browser; context: BrowserContext }>;
  disconnect(): Promise<void>;
  createPage(): Promise<Page>;
}

export interface ScriptOptimizer {
  optimize(script: string, page: Page): Promise<string>;
}

export interface ScriptExecutor {
  execute(script: string, page: Page): Promise<ExecutionResult>;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  error?: string;
  optimizedScript?: string;
  instance?: number;
}

export interface SelectorAnalysis {
  exists: boolean;
  similar: string[];
  html: string;
}

export interface Logger {
  info(message: string, ...args: any[]): void;
  error(message: string, error?: any): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
} 