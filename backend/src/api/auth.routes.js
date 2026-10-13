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

    // Public registration is strictly user role. Admin roles can ONLY be provisioned
    // through protected administrative seed scripts. Never accept role from frontend.
    const assignedRole = 'user';

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

// In-memory rate limiter for password reset requests (5 attempts per 15 min per identity)
const resetRateLimiter = new Map();
function isResetRateLimited(key) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 5;
  const record = resetRateLimiter.get(key) || { count: 0, firstReq: now };
  if (now - record.firstReq > windowMs) {
    resetRateLimiter.set(key, { count: 1, firstReq: now });
    return false;
  }
  if (record.count >= maxRequests) {
    return true;
  }
  record.count += 1;
  resetRateLimiter.set(key, record);
  return false;
}

/**
 * Requests a single-use, time-limited reset token. The response is deliberately
 * identical whether or not the address exists to prevent account enumeration.
 */
router.post('/password-reset/request', async (req, res) => {
  const message = 'If an account matches that email, password reset instructions have been sent.';
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const clientKey = `${req.ip}_${email}`;

    if (isResetRateLimited(clientKey)) {
      return res.status(429).json({
        success: false,
        data: null,
        error: 'Too many password reset requests. Please wait a few minutes before trying again.'
      });
    }

    if (!email || !email.includes('@') || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: { message }, error: null });
    }

    if (user) {
      const hasDeliveryChannel = Boolean(process.env.RESEND_API_KEY || process.env.PASSWORD_RESET_DELIVERY_WEBHOOK_URL);
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction && !hasDeliveryChannel) {
        console.error('[Password Reset Security] In production, RESEND_API_KEY or PASSWORD_RESET_DELIVERY_WEBHOOK_URL is required. Refusing to create or store reset token without secure delivery channel.');
        user.clearPasswordResetToken();
        await user.save();
      } else if (hasDeliveryChannel) {
        const token = user.setPasswordResetToken();
        const resetUrl = `${process.env.PASSWORD_RESET_URL || 'http://localhost:5173/auth'}?token=${encodeURIComponent(token)}`;
        
        let sent = false;
        try {
          if (process.env.RESEND_API_KEY) {
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'IoT Weather Monitoring <onboarding@resend.dev>';
            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: fromEmail,
                to: [user.email],
                subject: 'Reset Your Password – IoT Weather Monitoring System',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #F8FAFC;">
                    <h2 style="color: #0F172A; margin-bottom: 12px;">Password Reset Request</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello,</p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.5;">A password reset was requested for your account on the <strong>IoT Weather Monitoring System</strong>. Click the button below to choose a new password:</p>
                    <p style="margin: 24px 0;">
                      <a href="${resetUrl}" style="background-color: #1976D2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
                    </p>
                    <p style="color: #64748B; font-size: 12px; line-height: 1.4;">Or copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #1976D2;">${resetUrl}</a></p>
                    <p style="color: #94A3B8; font-size: 11px; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 12px;">This link expires in 15 minutes. If you did not request this, you can safely ignore this email.</p>
                  </div>
                `
              })
            });
            sent = resendRes.ok;
          } else if (process.env.PASSWORD_RESET_DELIVERY_WEBHOOK_URL) {
            const webhookRes = await fetch(process.env.PASSWORD_RESET_DELIVERY_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, resetUrl })
            });
            sent = webhookRes.ok;
          }
        } catch (err) {
          console.error('[Password Reset Dispatch Error]:', err.message);
          sent = false;
        }

        if (sent) {
          await user.save();
        } else {
          user.clearPasswordResetToken();
          await user.save();
        }
      } else {
        // Safe development/testing fallback (NODE_ENV !== 'production' only)
        const token = user.setPasswordResetToken();
        await user.save();
        const testResetUrl = `${process.env.PASSWORD_RESET_URL || 'http://localhost:5173/auth'}?token=${encodeURIComponent(token)}`;
        console.log(`[Password Reset Dev Info] Token generated for ${user.email}: ${token}`);
        console.log(`[Password Reset Dev Info] Reset URL: ${testResetUrl}`);
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
    const { username, email, password, expectedRole } = req.body;
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

    // Role check: If login was attempted through admin portal, verify administrator privileges
    if (expectedRole === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied: This account does not have administrator privileges.'
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
 * POST /api/auth/logout
 * Acknowledges session revocation
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
    error: null
  });
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
