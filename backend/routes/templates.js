const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');

router.get('/', (req, res) => {
  res.json(storage.getAll());
});

router.get('/:id', (req, res) => {
  const template = storage.getById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template non trovato' });
  res.json(template);
});

router.post('/', (req, res) => {
  try {
    const template = storage.create(req.body);
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const template = storage.update(req.params.id, req.body);
  if (!template) return res.status(404).json({ error: 'Template non trovato' });
  res.json(template);
});

router.delete('/:id', (req, res) => {
  const deleted = storage.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Template non trovato' });
  res.json({ success: true });
});

module.exports = router;
