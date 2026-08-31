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
    role: user.role || 'admin'
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
      error: `Invalid or expired authentication token: ${err.message}`
    });
  }
}

module.exports = {
  generateToken,
  authenticateJWT,
  JWT_SECRET
};
