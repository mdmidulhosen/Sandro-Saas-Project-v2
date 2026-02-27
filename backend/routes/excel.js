const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/parse', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nessun file caricato' });
  }
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length === 0) {
      return res.json({ headers: [], rows: [], sheetNames: workbook.SheetNames });
    }

    const headers = rows[0].map(String);
    const data = rows.slice(1).filter(row => row.some(cell => cell !== ''));

    res.json({
      headers,
      rows: data,
      sheetNames: workbook.SheetNames
    });
  } catch (err) {
    res.status(400).json({ error: 'Errore nel parsing del file Excel: ' + err.message });
  }
});

module.exports = router;
