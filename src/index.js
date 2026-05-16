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

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

module.exports = app; // 为测试导出