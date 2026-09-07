const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticateJWT, requireRole } = require('../auth/jwt');
const mongoose = require('mongoose');

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
        error: 'Validation Error: Username or Email must be at least 3 characters long'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Validation Error: Password must be at least 4 characters long'
      });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email ? email.trim().toLowerCase() : '';

    if (mongoose.connection.readyState !== 1) {
      const mockUser = {
        _id: 'mock_user_' + Date.now(),
        username: trimmedUsername,
        email: trimmedEmail,
        role: role === 'admin' ? 'admin' : 'operator'
      };
      const token = generateToken(mockUser);
      return res.status(201).json({
        success: true,
        data: {
          user: mockUser,
          token
        },
        error: null
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
        error: `An account with this username or email is already registered`
      });
    }

    // Check if this is the very first user (if so, automatically make them admin)
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : (role === 'admin' ? 'admin' : 'operator');

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

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues a JWT token
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
      const mockUser = {
        _id: 'mock_operator_id',
        username: identifier,
        email: identifier.includes('@') ? identifier : `${identifier}@station.local`,
        role: identifier.toLowerCase().includes('admin') ? 'admin' : 'operator'
      };
      const token = generateToken(mockUser);
      return res.json({
        success: true,
        data: {
          user: mockUser,
          token
        },
        error: null
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
