const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_weather_jwt_key_2026';
const JWT_EXPIRES_IN = '24h';

/**
 * Generates signed JWT for an authenticated user
 * @param {Object} user 
 * @returns {string} Signed JWT token
 */
function generateToken(user) {
  const payload = {
    userId: user._id,
    username: user.username,
    role: user.role || 'operator'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Express middleware for verifying JWT tokens on protected routes
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Access denied. Authentication token missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Invalid or expired authentication token.'
    });
  }
}

/**
 * Express middleware to enforce role-based access control (RBAC)
 * @param {string[]|string} allowedRoles 
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Authentication required'
      });
    }

    // Authorize against the database role, never only the role embedded in a client token.
    // Administrative changes fail closed while the database is unavailable.
    let userRole = (req.user.role || 'operator').toLowerCase();
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.userId).select('role');
      if (!user) {
        return res.status(401).json({ success: false, data: null, error: 'Authentication account no longer exists.' });
      }
      userRole = user.role;
      req.user.role = user.role;
    } catch (err) {
      return res.status(503).json({ success: false, data: null, error: 'Authorization service is temporarily unavailable.' });
    }
    const isAuthorized = roles.some((r) => r.toLowerCase() === userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'You do not have permission to perform this action.'
      });
    }

    next();
  };
}

module.exports = {
  generateToken,
  authenticateJWT,
  requireRole,
  JWT_SECRET
};
