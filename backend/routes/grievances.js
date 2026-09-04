const express = require('express');
const Grievance = require('../models/Grievance');
const Employer = require('../models/Employer');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// POST /api/grievances — submit complaint (worker)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { category, description, location, evidence, severity, employerId, isAnonymous } =
      req.body;

    if (!category || !description) {
      return res
        .status(400)
        .json({ success: false, message: 'Category and description are required.' });
    }

    // Worker must have a worker profile
    const Worker = require('../models/Worker');
    const worker = await Worker.findOne({ userId: req.user._id });
    if (!worker) {
      return res
        .status(400)
        .json({ success: false, message: 'Worker profile required to file a grievance.' });
    }

    const grievance = await Grievance.create({
      workerId: worker._id,
      employerId,
      category,
      description,
      location,
      evidence,
      severity: severity || 'medium',
      isAnonymous: isAnonymous || false,
      'timestamps.submitted': new Date(),
    });

    // Link grievance to employer if provided
    if (employerId) {
      await Employer.findByIdAndUpdate(employerId, {
        $push: { complaints: grievance._id },
      });
    }

    res.status(201).json({ success: true, message: 'Grievance submitted.', grievance });
  } catch (error) {
    next(error);
  }
});

// GET /api/grievances — officer/admin with filters
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
      if (req.query.status) filter.status = req.query.status;
      if (req.query.severity) filter.severity = req.query.severity;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.state) filter['location.state'] = req.query.state;

      const [grievances, total] = await Promise.all([
        Grievance.find(filter)
          .populate('workerId', 'personalDetails.name occupation sector')
          .populate('employerId', 'companyName')
          .populate('assignedOfficer', 'name email')
          .skip(skip)
          .limit(limit)
          .sort({ 'timestamps.submitted': -1 }),
        Grievance.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: grievances,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/grievances/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('workerId')
      .populate('employerId', 'companyName sector')
      .populate('assignedOfficer', 'name email');

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const Worker = require('../models/Worker');
    const worker = await Worker.findById(grievance.workerId._id || grievance.workerId);
    const isOwner = worker && worker.userId.toString() === req.user._id.toString();
    const isOfficer = ['admin', 'labor_officer', 'district_officer'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, grievance });
  } catch (error) {
    next(error);
  }
});

// PUT /api/grievances/:id/status — officer/admin
router.put(
  '/:id/status',
  verifyToken,
  requireRole('admin', 'labor_officer', 'district_officer'),
  async (req, res, next) => {
    try {
      const { status, resolution } = req.body;
      const validStatuses = [
        'submitted', 'assigned', 'under_investigation', 'action_taken', 'resolved',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
      }

      const update = { status };
      if (resolution) update.resolution = resolution;
      if (status === 'resolved') update['timestamps.resolved'] = new Date();

      const grievance = await Grievance.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!grievance) {
        return res.status(404).json({ success: false, message: 'Grievance not found.' });
      }

      res.json({ success: true, message: 'Status updated.', grievance });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/grievances/:id/assign — admin assigns officer
router.put(
  '/:id/assign',
  verifyToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { officerId } = req.body;
      if (!officerId) {
        return res.status(400).json({ success: false, message: 'officerId is required.' });
      }

      const grievance = await Grievance.findByIdAndUpdate(
        req.params.id,
        {
          assignedOfficer: officerId,
          status: 'assigned',
          'timestamps.assigned': new Date(),
        },
        { new: true }
      ).populate('assignedOfficer', 'name email');

      if (!grievance) {
        return res.status(404).json({ success: false, message: 'Grievance not found.' });
      }

      res.json({ success: true, message: 'Grievance assigned.', grievance });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/grievances/:id/escalate
router.post('/:id/escalate', verifyToken, async (req, res, next) => {
  try {
    const { escalationReason } = req.body;

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const Worker = require('../models/Worker');
    const worker = await Worker.findById(grievance.workerId);
    const isOwner = worker && worker.userId.toString() === req.user._id.toString();
    const isOfficer = ['admin', 'labor_officer', 'district_officer'].includes(req.user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    grievance.escalated = true;
    grievance.escalationReason = escalationReason || 'Escalated by user';
    await grievance.save();

    res.json({ success: true, message: 'Grievance escalated.', grievance });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
