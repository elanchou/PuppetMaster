"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = require("../utils/logger");
const http_1 = __importDefault(require("http"));
const WebSocketServer_1 = require("../websocket/WebSocketServer");
const logger = new logger_1.Logger();
const PORT = process.env.PORT || 3000;
// 创建HTTP服务器
const server = http_1.default.createServer(app_1.default);
// 初始化WebSocket服务器
WebSocketServer_1.WebSocketServer.getInstance().initialize(server);
// 启动服务器
server.listen(PORT, () => {
    logger.info(`服务器启动在端口 ${PORT}`);
});
