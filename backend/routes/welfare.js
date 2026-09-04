const express = require('express');
const WelfareScheme = require('../models/WelfareScheme');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/welfare — list all active schemes
router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.state) filter.state = { $in: [req.query.state, 'central'] };
    if (req.query.sector) filter['eligibility.sectors'] = req.query.sector;

    const schemes = await WelfareScheme.find(filter).sort({ schemeName: 1 });
    res.json({ success: true, count: schemes.length, schemes });
  } catch (error) {
    next(error);
  }
});

// GET /api/welfare/:id — scheme detail
router.get('/:id', async (req, res, next) => {
  try {
    const scheme = await WelfareScheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Welfare scheme not found.' });
    }
    res.json({ success: true, scheme });
  } catch (error) {
    next(error);
  }
});

// POST /api/welfare — admin only
router.post('/', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const scheme = await WelfareScheme.create(req.body);
    res.status(201).json({ success: true, message: 'Scheme created.', scheme });
  } catch (error) {
    next(error);
  }
});

// PUT /api/welfare/:id — admin only
router.put('/:id', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    req.body.lastUpdated = new Date();
    const scheme = await WelfareScheme.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Welfare scheme not found.' });
    }
    res.json({ success: true, message: 'Scheme updated.', scheme });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
