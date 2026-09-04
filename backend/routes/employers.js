const express = require('express');
const Employer = require('../models/Employer');
const Grievance = require('../models/Grievance');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// POST /api/employers — register employer profile
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const existing = await Employer.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Employer profile already exists.' });
    }
    const employer = await Employer.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Employer registered.', employer });
  } catch (error) {
    next(error);
  }
});

// GET /api/employers — officer/admin only
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
      if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
      if (req.query.state) filter['workplaceLocations.state'] = req.query.state;

      const [employers, total] = await Promise.all([
        Employer.find(filter)
          .populate('userId', 'name email')
          .skip(skip)
          .limit(limit)
          .sort({ riskScore: -1 }),
        Employer.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: employers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/employers/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const employer = await Employer.findById(req.params.id).populate('userId', 'name email');

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found.' });
    }

    const isOwner = employer.userId._id.toString() === req.user._id.toString();
    const isOfficer = ['admin', 'labor_officer', 'district_officer'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, employer });
  } catch (error) {
    next(error);
  }
});

// PUT /api/employers/:id
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found.' });
    }

    const isOwner = employer.userId.toString() === req.user._id.toString();
    const isOfficer = ['admin', 'labor_officer', 'district_officer'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    delete req.body.userId;
    delete req.body.employerId;

    const updated = await Employer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Employer updated.', employer: updated });
  } catch (error) {
    next(error);
  }
});

// GET /api/employers/:id/risk-score — compute and return risk score
router.get('/:id/risk-score', verifyToken, async (req, res, next) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found.' });
    }

    const totalComplaints = employer.complaints.length;
    const openComplaints = await Grievance.countDocuments({
      employerId: employer._id,
      status: { $in: ['submitted', 'assigned', 'under_investigation'] },
    });
    const emergencyComplaints = await Grievance.countDocuments({
      employerId: employer._id,
      severity: 'emergency',
    });

    // Risk scoring formula
    let score = 0;
    score += Math.min(totalComplaints * 3, 30); // max 30 pts from total complaints
    score += Math.min(openComplaints * 5, 25); // max 25 pts from open complaints
    score += Math.min(emergencyComplaints * 10, 20); // max 20 pts from emergency
    score += employer.wageViolations * 4; // 4 pts per violation
    score += employer.safetyIncidents * 5; // 5 pts per safety incident
    if (!employer.compliance.wageCompliance) score += 10;
    if (!employer.compliance.safetyCompliance) score += 10;
    score = Math.min(score, 100);

    let riskLevel;
    if (score < 25) riskLevel = 'low';
    else if (score < 50) riskLevel = 'medium';
    else if (score < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    // Persist updated risk
    employer.riskScore = score;
    employer.riskLevel = riskLevel;
    await employer.save();

    res.json({
      success: true,
      employerId: employer._id,
      companyName: employer.companyName,
      riskScore: score,
      riskLevel,
      breakdown: {
        totalComplaints,
        openComplaints,
        emergencyComplaints,
        wageViolations: employer.wageViolations,
        safetyIncidents: employer.safetyIncidents,
        wageCompliance: employer.compliance.wageCompliance,
        safetyCompliance: employer.compliance.safetyCompliance,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
