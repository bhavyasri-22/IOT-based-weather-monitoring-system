const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    password_hash: {
      type: String,
      required: true
    },
    salt: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['admin', 'operator', 'user'],
      default: 'user'
    },
    password_reset_token_hash: {
      type: String,
      default: null
    },
    password_reset_expires_at: {
      type: Date,
      default: null
    },
    last_login_at: {
      type: Date,
      default: null
    },
    previous_login_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password_hash;
        delete ret.salt;
        return ret;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password_hash;
        delete ret.salt;
        return ret;
      }
    }
  }
);

/**
 * Hashes and sets the password for user instance using PBKDF2 (100,000 iterations)
 * @param {string} password 
 */
userSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password_hash = crypto.pbkdf2Sync(password, this.salt, 100000, 64, 'sha512').toString('hex');
};

/**
 * Validates candidate password against stored PBKDF2 hash (supports legacy 1000 iter & current 100000 iter)
 * @param {string} password 
 * @returns {boolean}
 */
userSchema.methods.validatePassword = function (password) {
  if (!this.salt || !this.password_hash) return false;
  
  // Try 100,000 iterations (standard)
  const hash100k = crypto.pbkdf2Sync(password, this.salt, 100000, 64, 'sha512').toString('hex');
  if (this.password_hash === hash100k) return true;

  // Backward compatibility fallback for legacy hashes with 1,000 iterations
  const hash1k = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
  return this.password_hash === hash1k;
};

userSchema.methods.setPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.password_reset_token_hash = crypto.createHash('sha256').update(token).digest('hex');
  this.password_reset_expires_at = new Date(Date.now() + 15 * 60 * 1000);
  return token;
};

userSchema.methods.clearPasswordResetToken = function () {
  this.password_reset_token_hash = null;
  this.password_reset_expires_at = null;
};

module.exports = mongoose.model('User', userSchema);
