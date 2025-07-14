const express = require('express');
const router = express.Router();
const StoveData = require('../models/StoveData');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /stoves - list all stoves (any authenticated user)
router.get('/stoves', verifyToken, async (req, res) => {
  try {
    const stoves = await StoveData.find({}, '-__v');
    res.json(stoves);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /stoves/:id - get logs for one stove (any authenticated user)
router.get('/stoves/:id', verifyToken, async (req, res) => {
  try {
    const stove = await StoveData.findById(req.params.id, '-__v');
    if (!stove) return res.status(404).json({ error: 'Not found' });
    res.json(stove);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /stoves/by-stoveid/:stove_id - get all logs for a given stove_id (any authenticated user)
router.get('/stoves/by-stoveid/:stove_id', verifyToken, async (req, res) => {
  try {
    const docs = await StoveData.find({ stove_id: req.params.stove_id }, '-__v');
    // Combine all logs from all docs
    const allLogs = docs.flatMap(doc => doc.logs.map(log => ({ ...log.toObject(), stoveDocId: doc._id })));
    res.json({ logs: allLogs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this endpoint to count cooking sessions in the last 24 hours
router.get('/stoves/logs/last24h/count', verifyToken, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stoves = await StoveData.find({}, 'logs');
    let count = 0;
    stoves.forEach(stove => {
      count += stove.logs.filter(log => new Date(log.date) >= since).length;
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /stoves - add new stove (super_admin only)
router.post('/stoves', verifyToken, requireRole('super_admin'), async (req, res) => {
  try {
    const stove = new StoveData(req.body);
    await stove.save();
    res.status(201).json(stove);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// PUT /stoves/:id - edit stove (super_admin only)
router.put('/stoves/:id', verifyToken, requireRole('super_admin'), async (req, res) => {
  try {
    const stove = await StoveData.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!stove) return res.status(404).json({ error: 'Not found' });
    res.json(stove);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// DELETE /stoves/:id - delete stove (super_admin only)
router.delete('/stoves/:id', verifyToken, requireRole('super_admin'), async (req, res) => {
  try {
    const stove = await StoveData.findByIdAndDelete(req.params.id);
    if (!stove) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 