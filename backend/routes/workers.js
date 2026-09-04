const express = require('express');
const Worker = require('../models/Worker');
const WelfareScheme = require('../models/WelfareScheme');
const WageReference = require('../models/WageReference');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// POST /api/workers — create worker profile for logged-in user
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const existing = await Worker.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Worker profile already exists.' });
    }
    const worker = await Worker.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Worker profile created.', worker });
  } catch (error) {
    next(error);
  }
});

// GET /api/workers — admin/officer only, paginated list
router.get(
  '/',
  verifyToken,
  requireRole('admin', 'labor_officer', 'district_officer'),
  async (req, res, next) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.sector) filter.sector = req.query.sector;
      if (req.query.currentState) filter.currentState = req.query.currentState;

      const [workers, total] = await Promise.all([
        Worker.find(filter)
          .populate('userId', 'name email mobile role')
          .populate('employerId', 'companyName')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Worker.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: workers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/workers/:id — worker can only get own profile; officers/admin can get any
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('userId', 'name email mobile')
      .populate('skills.skillId')
      .populate('employerId', 'companyName sector');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const isOwner = worker.userId._id.toString() === req.user._id.toString();
    const isOfficer = ['admin', 'labor_officer', 'district_officer'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, worker });
  } catch (error) {
    next(error);
  }
});

// PUT /api/workers/:id — update worker profile
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const isOwner = worker.userId.toString() === req.user._id.toString();
    const isOfficer = ['admin', 'labor_officer', 'district_officer'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Prevent changing userId
    delete req.body.userId;
    delete req.body.workerId;

    const updated = await Worker.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Worker profile updated.', worker: updated });
  } catch (error) {
    next(error);
  }
});

// GET /api/workers/:id/welfare-eligibility
router.get('/:id/welfare-eligibility', verifyToken, async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id).populate('userId', 'name email');
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const schemes = await WelfareScheme.find({ isActive: true });

    const workerAge = worker.personalDetails?.dob
      ? Math.floor(
          (Date.now() - new Date(worker.personalDetails.dob).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : null;

    const eligibleSchemes = schemes.filter((scheme) => {
      const e = scheme.eligibility;

      if (workerAge !== null) {
        if (e.minAge && workerAge < e.minAge) return false;
        if (e.maxAge && workerAge > e.maxAge) return false;
      }

      if (e.sectors && e.sectors.length > 0 && !e.sectors.includes('all')) {
        if (worker.sector && !e.sectors.includes(worker.sector)) return false;
      }

      return true;
    });

    res.json({
      success: true,
      workerId: worker._id,
      totalSchemes: schemes.length,
      eligibleCount: eligibleSchemes.length,
      eligibleSchemes,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workers/:id/wage-analysis
router.get('/:id/wage-analysis', verifyToken, async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const references = await WageReference.find({
      sector: worker.sector,
      state: worker.currentState,
      isActive: true,
    });

    if (references.length === 0) {
      return res.json({
        success: true,
        message: 'No wage reference data available for this sector/state.',
        workerWage: worker.dailyWage,
        verdict: 'insufficient_data',
      });
    }

    const refWage = references[0].minimumWage;
    const workerWage = worker.dailyWage || 0;
    const ratio = workerWage / refWage;

    let verdict;
    if (ratio >= 1.0) verdict = 'fair';
    else if (ratio >= 0.85) verdict = 'potentially_low';
    else verdict = 'high_risk';

    res.json({
      success: true,
      workerWage,
      referenceWage: refWage,
      ratio: parseFloat(ratio.toFixed(2)),
      verdict,
      references,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
