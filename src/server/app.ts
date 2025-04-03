import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { errorCorrectionRouter } from './routes/error-correction';
import { executionRouter } from './routes/execution';

const app = express();

app.use(cors());
app.use(json());

// 注册路由
app.use('/api/execute', executionRouter);
app.use('/api/error-correction', errorCorrectionRouter);

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app; 