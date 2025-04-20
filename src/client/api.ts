import axios from 'axios';
import { API_BASE_URL } from './config';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 浏览器相关接口
export const browserApi = {
  // 启动浏览器
  start: async (userId: string) => {
    const response = await api.get(`/v1/browser/start`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  // 停止浏览器
  stop: async (userId: string) => {
    const response = await api.get(`/v1/browser/stop`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  // 执行脚本
  execute: async (params: {
    script: string;
    instances?: number;
    useAds?: boolean;
    adsUserId?: string;
  }) => {
    const response = await api.post('/v1/browser/execute', params);
    return response.data;
  }
};

// 错误处理相关接口
export const errorApi = {
  // 获取错误列表
  getErrors: async () => {
    const response = await api.get('/v1/errors');
    return response.data;
  },

  // 获取错误详情
  getErrorDetail: async (errorId: string) => {
    const response = await api.get(`/v1/errors/${errorId}`);
    return response.data;
  }
};

// 错误纠正相关接口
export const errorCorrectionApi = {
  // 提交错误纠正
  submit: async (params: {
    errorId: string;
    correction: string;
  }) => {
    const response = await api.post('/v1/error-correction', params);
    return response.data;
  },

  // 获取纠正历史
  getHistory: async () => {
    const response = await api.get('/v1/error-correction/history');
    return response.data;
  }
}; 