const express = require('express');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/notifications — get notifications for the logged-in user
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all — mark all user notifications as read
router.put('/read-all', verifyToken, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read — mark one notification as read
router.put('/:id/read', verifyToken, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications — create notification (admin/system only)
router.post('/', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { userId, type, title, message, relatedId } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title, and message are required.',
      });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId: relatedId || null,
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
