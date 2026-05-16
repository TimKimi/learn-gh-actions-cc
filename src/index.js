const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const version = process.env.APP_VERSION || '0.0.0';

app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, GitHub Actions!' });
});

const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

// 导出 app 供测试使用，同时导出 server 以便测试后关闭
module.exports = { app, server };