import app from './app';
import { Logger } from '../utils/logger';

const logger = new Logger();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`服务器启动在端口 ${PORT}`);
}); 