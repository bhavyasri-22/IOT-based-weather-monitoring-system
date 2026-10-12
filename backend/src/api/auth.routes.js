const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticateJWT, requireRole } = require('../auth/jwt');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { assessPassword } = require('../auth/passwordPolicy');

/**
 * POST /api/auth/register
 * Registers a new administrative or operator user
 */
router.post('/register', async (req, res) => {
  try {
    let { username, password, email, role } = req.body;

    if (!username && email) {
      username = email.includes('@') ? email.split('@')[0] : email;
    }
    if (!email && username && username.includes('@')) {
      email = username;
    }

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Validation Error: Username must be at least 3 characters long'
      });
    }

    const passwordAssessment = assessPassword(password);
    if (!passwordAssessment.valid) {
      return res.status(400).json({
        success: false,
        data: null,
        error: passwordAssessment.errors.join(' '),
        password_strength: passwordAssessment.strength
      });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email ? email.trim().toLowerCase() : '';

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        data: null,
        error: 'Registration unavailable: Database connection is offline.'
      });
    }

    const queryOr = [{ username: trimmedUsername }];
    if (trimmedEmail) {
      queryOr.push({ email: trimmedEmail });
    }

    const existingUser = await User.findOne({ $or: queryOr });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'An account with this username or email is already registered'
      });
    }

    // Public registration is always read-only/operator access.  Admin roles can
    // only be provisioned through a controlled database/deployment process.
    const assignedRole = 'operator';

    const user = new User({
      username: trimmedUsername,
      email: trimmedEmail,
      role: assignedRole
    });
    user.setPassword(password);
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to register user: ${err.message}`
    });
  }
});

router.get('/password-policy', (req, res) => {
  res.json({ success: true, data: { minLength: 12, required: ['uppercase', 'lowercase', 'number', 'symbol'] }, error: null });
});

/**
 * Requests a single-use, time-limited reset token.  The response is deliberately
 * identical whether or not the address exists to prevent account enumeration.
 * A deployment should deliver the generated token through its configured mailer.
 */
router.post('/password-reset/request', async (req, res) => {
  const message = 'If an account matches that email, password reset instructions have been sent.';
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@') || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: { message }, error: null });
    }
    const user = await User.findOne({ email });
    if (user) {
      const token = user.setPasswordResetToken();
      const deliveryUrl = process.env.PASSWORD_RESET_DELIVERY_WEBHOOK_URL;
      // A deployment-owned mail service receives the raw token over a server to
      // server request. Tokens are never returned to clients or written to logs.
      if (deliveryUrl && typeof fetch === 'function') {
        const resetUrl = `${process.env.PASSWORD_RESET_URL || 'http://localhost:5173/auth'}?token=${encodeURIComponent(token)}`;
        const delivery = await fetch(deliveryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, resetUrl })
        });
        if (delivery.ok) await user.save();
        else user.clearPasswordResetToken();
      } else {
        user.clearPasswordResetToken();
      }
    }
    return res.json({ success: true, data: { message }, error: null });
  } catch {
    return res.json({ success: true, data: { message }, error: null });
  }
});

router.post('/password-reset/confirm', async (req, res) => {
  try {
    const { token, password } = req.body;
    const assessment = assessPassword(password);
    if (!token || typeof token !== 'string' || !assessment.valid) {
      return res.status(400).json({ success: false, data: null, error: assessment.errors.join(' ') || 'A valid reset token is required.' });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, data: null, error: 'Password reset is temporarily unavailable.' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ password_reset_token_hash: tokenHash, password_reset_expires_at: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, data: null, error: 'This password reset link is invalid or has expired.' });
    user.setPassword(password);
    user.clearPasswordResetToken();
    await user.save();
    return res.json({ success: true, data: { message: 'Password updated. You can now sign in.' }, error: null });
  } catch {
    return res.status(500).json({ success: false, data: null, error: 'Password reset could not be completed.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues a signed JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Username/email and password are required'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        data: null,
        error: 'Authentication service temporarily unavailable: Database is offline.'
      });
    }

    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() }
      ]
    });

    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid username/email or password'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Authentication failed: ${err.message}`
    });
  }
});

/**
 * GET /api/auth/me
 * Returns currently authenticated user profile metadata
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Return decoded token identity if DB is in fallback
      return res.json({
        success: true,
        data: {
          id: req.user.userId,
          username: req.user.username,
          role: req.user.role
        },
        error: null
      });
    }

    const user = await User.findById(req.user.userId).select('-password_hash -salt');
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: user,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to fetch profile: ${err.message}`
    });
  }
});

/**
 * GET /api/auth/users
 * Lists registered operator and admin accounts (Admin Only)
 */
router.get('/users', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        error: null
      });
    }

    const users = await User.find().select('-password_hash -salt').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users,
      count: users.length,
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: `Failed to list users: ${err.message}`
    });
  }
});

module.exports = router;
