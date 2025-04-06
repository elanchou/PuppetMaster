import app from './app';
import { Logger } from '../utils/logger';
import http from 'http';
import { WebSocketServer } from '../websocket/WebSocketServer';

const logger = new Logger();
const PORT = process.env.PORT || 3000;

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化WebSocket服务器
WebSocketServer.getInstance().initialize(server);

// 启动服务器
server.listen(PORT, () => {
  logger.info(`服务器启动在端口 ${PORT}`);
}); 