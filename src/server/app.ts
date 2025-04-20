import express from 'express';
import cors from 'cors';
import { executionRouter } from './routes/execution';
import { errorCorrectionRouter } from './routes/error-correction';
import errorsRouter from './routes/errors';

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/v1/browser', executionRouter);
app.use('/api/v1/error-correction', errorCorrectionRouter);
app.use('/api/v1/errors', errorsRouter);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app; 