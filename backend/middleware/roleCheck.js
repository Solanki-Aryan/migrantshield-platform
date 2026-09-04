/**
 * requireRole(...roles) — middleware factory that restricts access to users
 * whose role is included in the provided roles array.
 *
 * Usage:
 *   router.get('/admin-only', verifyToken, requireRole('admin'), handler)
 *   router.get('/officers', verifyToken, requireRole('labor_officer', 'district_officer', 'admin'), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
};

module.exports = { requireRole };
