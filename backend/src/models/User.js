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
      enum: ['admin', 'operator'],
      default: 'admin'
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

module.exports = mongoose.model('User', userSchema);
