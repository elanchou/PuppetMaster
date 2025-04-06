import WebSocket, { Server } from 'ws';
import http from 'http';

export class WebSocketServer {
  private static instance: WebSocketServer;
  private wss: Server | null = null;
  private clients: Set<WebSocket> = new Set();

  private constructor() {
    // 私有构造函数，强制使用单例
  }

  public static getInstance(): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer();
    }
    return WebSocketServer.instance;
  }

  public initialize(server: http.Server): void {
    if (this.wss) {
      return;
    }

    this.wss = new Server({ server });
    
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  public broadcast(type: string, data: any): void {
    if (!this.wss) {
      console.warn('WebSocket服务器未初始化');
      return;
    }

    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public close(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.clients.clear();
    }
  }
} 