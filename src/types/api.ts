/**
 * API接口类型定义
 */

// 通用响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

// 执行脚本请求接口
export interface ExecuteScriptRequest {
  script: string;
  instances?: number;
  useAds?: boolean;
  adsUserId?: string;
}

// 执行脚本结果接口
export interface ExecuteScriptResult {
  success: boolean;
  message?: string;
  error?: string;
  selectorInfo?: {
    selector: string;
    action: string;
  };
}

// 执行脚本响应接口
export interface ExecuteScriptResponse extends ApiResponse {
  executionId: string;
  results?: ExecuteScriptResult[];
}

// 脚本执行状态接口
export interface ScriptStatus {
  id: string;
  startTime: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  error?: string;
}

// 错误记录接口
export interface ErrorRecord {
  id: string;
  timestamp: string;
  selector: string;
  action: string;
  error: string;
  attempts: Array<{
    selector: string;
    success: boolean;
    timestamp: string;
  }>;
  status: 'pending' | 'fixed' | 'failed';
}

// 修复错误请求接口
export interface FixErrorRequest {
  selector: string;
}

// 启动错误纠正请求接口
export interface StartErrorCorrectionRequest {
  script: string;
  useAds?: boolean;
  adsUserId?: string;
}

// 启动错误纠正响应接口
export interface StartErrorCorrectionResponse extends ApiResponse {
  correctionId: string;
}

// API路径常量
export const API_PATHS = {
  EXECUTE_SCRIPT: '/v1/execute',
  GET_SCRIPT_STATUSES: '/v1/statuses',
  START_ERROR_CORRECTION: '/v1/errors/start',
  GET_ERRORS: '/v1/errors',
  RETRY_ERROR: (id: string) => `/v1/errors/${id}/retry`,
  FIX_ERROR: (id: string) => `/v1/errors/${id}/fix`,
  EXECUTE_AI_PILOT: '/v1/ai-pilot/execute',
} as const;

export interface RecordSession {
  id: string;
  timestamp: string;
  script: string;
  status: string;
} 