const express = require('express');
const cors = require('cors');
require('dotenv').config();

const templatesRouter = require('./routes/templates');
const excelRouter = require('./routes/excel');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/templates', templatesRouter);
app.use('/api/excel', excelRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`SF Etichette PRO backend running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Try: PORT=3002 nodemon index.js\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
