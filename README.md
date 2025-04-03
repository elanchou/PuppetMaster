# PuppetMaster - 智能自动化交互框架

PuppetMaster 是一个强大的自动化交互框架，专门设计用于批量处理加密钱包操作。它能够录制用户的标准操作流程，并通过智能随机化和 AI 辅助来模拟真实用户行为。

## 主要特性

- 🎥 操作录制：支持通过 Chrome Recorder 记录用户操作
- 🤖 自动化执行：支持多浏览器实例并行执行
- 🎲 随机行为：智能注入随机鼠标移动和等待时间
- 🧠 AI 辅助：通过 GPT-4 优化操作流程并处理异常
- 📊 实时监控：提供详细的执行日志和错误报告

## 安装

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/puppet-master.git
cd puppet-master
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量：
```bash
cp .env.example .env
```
编辑 `.env` 文件，填入必要的配置信息。

## 使用方法

1. 启动服务器：
```bash
npm start
```

2. 录制操作：
   - 使用 Chrome DevTools 的 Recorder 功能录制操作
   - 导出录制文件到 `recordings` 目录

3. 执行自动化：
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d @recordings/your-recording.json
```

## 配置说明

### 浏览器配置
- `BROWSER_INSTANCES`: 并行执行的浏览器实例数量
- `RECORDING_PATH`: 录制文件存储路径

### 随机化配置
- `ENABLE_MOUSE_MOVEMENT`: 启用随机鼠标移动
- `CLICK_OFFSET`: 点击位置随机偏移范围
- `MIN_WAIT_TIME`: 最小等待时间
- `MAX_WAIT_TIME`: 最大等待时间

### AI 配置
- `ENABLE_AI`: 启用 AI 辅助功能
- `AI_MODEL`: 使用的 OpenAI 模型
- `OPENAI_API_KEY`: OpenAI API 密钥

## 开发

- 构建项目：
```bash
npm run build
```

- 运行测试：
```bash
npm test
```

- 开发模式：
```bash
npm run dev
```

## 注意事项

- 确保 MetaMask 扩展已正确配置
- 妥善保管 API 密钥和钱包信息
- 定期检查和更新依赖包

## 贡献

欢迎提交 Pull Request 或创建 Issue。

## 许可证

MIT 