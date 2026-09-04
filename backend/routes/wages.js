const express = require('express');
const WageReference = require('../models/WageReference');
const Worker = require('../models/Worker');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/wages — list wage references with optional filters
router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.sector) filter.sector = req.query.sector;
    if (req.query.state) filter.state = req.query.state;
    if (req.query.occupation)
      filter.occupation = new RegExp(req.query.occupation, 'i');

    const wages = await WageReference.find(filter).sort({ state: 1, sector: 1 });
    res.json({ success: true, count: wages.length, wages });
  } catch (error) {
    next(error);
  }
});

// POST /api/wages — admin only
router.post('/', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const ref = await WageReference.create(req.body);
    res.status(201).json({ success: true, message: 'Wage reference created.', ref });
  } catch (error) {
    next(error);
  }
});

// POST /api/wages/analyze — wage fairness analysis for a worker
router.post('/analyze', verifyToken, async (req, res, next) => {
  try {
    const { workerId } = req.body;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId is required.' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    // Authorization: worker can only analyze own profile; officers/admin can analyze any
    const isOwner = worker.userId.toString() === req.user._id.toString();
    const isOfficer = ['admin', 'labor_officer', 'district_officer'].includes(req.user.role);
    if (!isOwner && !isOfficer) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const refQuery = { isActive: true };
    if (worker.sector) refQuery.sector = worker.sector;
    if (worker.currentState) refQuery.state = worker.currentState;

    const references = await WageReference.find(refQuery);

    if (references.length === 0) {
      return res.json({
        success: true,
        verdict: 'insufficient_data',
        message: 'No matching wage reference data found.',
        workerWage: worker.dailyWage,
        monthlyWage: worker.monthlyWage,
      });
    }

    const bestMatch = references[0];
    const workerWage = worker.dailyWage || 0;
    const refWage = bestMatch.minimumWage;
    const ratio = refWage > 0 ? workerWage / refWage : 0;

    let verdict, score;
    if (ratio >= 1.1) { verdict = 'fair'; score = 100; }
    else if (ratio >= 1.0) { verdict = 'fair'; score = 85; }
    else if (ratio >= 0.85) { verdict = 'potentially_low'; score = 60; }
    else { verdict = 'high_risk'; score = Math.max(0, Math.round(ratio * 60)); }

    res.json({
      success: true,
      verdict,
      score,
      workerWage,
      referenceWage: refWage,
      ratio: parseFloat(ratio.toFixed(3)),
      sector: worker.sector,
      state: worker.currentState,
      matchedReference: bestMatch,
      allReferences: references,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
