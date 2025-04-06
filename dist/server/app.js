"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const error_correction_1 = require("./routes/error-correction");
const execution_1 = require("./routes/execution");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, body_parser_1.json)());
// 注册路由
app.use('/api/execute', execution_1.executionRouter);
app.use('/api/error-correction', error_correction_1.errorCorrectionRouter);
// 健康检查端点
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
