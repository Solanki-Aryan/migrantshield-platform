const express = require('express');
const Worker = require('../models/Worker');
const Grievance = require('../models/Grievance');
const WelfareScheme = require('../models/WelfareScheme');
const WageReference = require('../models/WageReference');
const Employer = require('../models/Employer');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

const officerAdmin = requireRole('admin', 'labor_officer', 'district_officer');

// GET /api/dashboard/stats
router.get('/stats', verifyToken, officerAdmin, async (req, res, next) => {
  try {
    const [
      totalWorkers,
      registeredWorkers,
      totalComplaints,
      openComplaints,
      schemeApplications,
    ] = await Promise.all([
      Worker.countDocuments(),
      Worker.countDocuments({ isActive: true }),
      Grievance.countDocuments(),
      Grievance.countDocuments({
        status: { $in: ['submitted', 'assigned', 'under_investigation'] },
      }),
      Worker.aggregate([
        { $unwind: '$welfareStatus' },
        { $count: 'total' },
      ]),
    ]);

    // Wage alerts: workers earning below minimum wage
    const wageAlerts = await Worker.aggregate([
      {
        $lookup: {
          from: 'wagereferences',
          let: { sector: '$sector', state: '$currentState' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$sector', '$$sector'] },
                    { $eq: ['$state', '$$state'] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'wageRef',
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $gt: [{ $size: '$wageRef' }, 0] },
              {
                $lt: [
                  '$dailyWage',
                  { $arrayElemAt: ['$wageRef.minimumWage', 0] },
                ],
              },
            ],
          },
        },
      },
      { $count: 'count' },
    ]);

    res.json({
      success: true,
      stats: {
        totalWorkers,
        registeredWorkers,
        totalComplaints,
        openComplaints,
        wageAlerts: wageAlerts[0]?.count || 0,
        schemeApplications: schemeApplications[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/worker-analytics
router.get('/worker-analytics', verifyToken, officerAdmin, async (req, res, next) => {
  try {
    const [bySector, byState, byGender] = await Promise.all([
      Worker.aggregate([
        { $group: { _id: '$sector', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Worker.aggregate([
        { $group: { _id: '$currentState', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Worker.aggregate([
        { $group: { _id: '$personalDetails.gender', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ success: true, bySector, byState, byGender });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/welfare-analytics
router.get('/welfare-analytics', verifyToken, officerAdmin, async (req, res, next) => {
  try {
    const byStatus = await Worker.aggregate([
      { $unwind: '$welfareStatus' },
      { $group: { _id: '$welfareStatus.applicationStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const totalSchemes = await WelfareScheme.countDocuments({ isActive: true });

    res.json({ success: true, byStatus, totalSchemes });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/grievance-analytics
router.get('/grievance-analytics', verifyToken, officerAdmin, async (req, res, next) => {
  try {
    const [byCategory, bySeverity, total, resolved] = await Promise.all([
      Grievance.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Grievance.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: 'resolved' }),
    ]);

    res.json({
      success: true,
      byCategory,
      bySeverity,
      resolutionRate: total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 0,
      total,
      resolved,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/wage-analytics
router.get('/wage-analytics', verifyToken, officerAdmin, async (req, res, next) => {
  try {
    const avgWagesBySector = await Worker.aggregate([
      { $match: { dailyWage: { $gt: 0 } } },
      {
        $group: {
          _id: '$sector',
          avgDailyWage: { $avg: '$dailyWage' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const referenceWages = await WageReference.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$sector',
          avgMinimumWage: { $avg: '$minimumWage' },
        },
      },
    ]);

    const refMap = {};
    referenceWages.forEach((r) => (refMap[r._id] = r.avgMinimumWage));

    const comparison = avgWagesBySector.map((s) => ({
      sector: s._id,
      avgActualWage: parseFloat(s.avgDailyWage.toFixed(2)),
      referenceWage: refMap[s._id] || null,
      workerCount: s.count,
    }));

    res.json({ success: true, comparison });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/high-risk-employers
router.get('/high-risk-employers', verifyToken, officerAdmin, async (req, res, next) => {
  try {
    const employers = await Employer.find({
      riskLevel: { $in: ['high', 'critical'] },
      isActive: true,
    })
      .populate('userId', 'name email')
      .sort({ riskScore: -1 })
      .limit(20);

    res.json({ success: true, count: employers.length, employers });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
