"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const execution_1 = require("./routes/execution");
const error_correction_1 = require("./routes/error-correction");
const errors_1 = __importDefault(require("./routes/errors"));
const app = (0, express_1.default)();
// 中间件配置
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API 路由
app.use('/api/v1/browser', execution_1.executionRouter);
app.use('/api/v1/error-correction', error_correction_1.errorCorrectionRouter);
app.use('/api/v1/errors', errors_1.default);
// 健康检查
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
