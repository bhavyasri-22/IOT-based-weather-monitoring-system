const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
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
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'operator'],
      default: 'admin'
    }
  },
  {
    timestamps: true
  }
);

/**
 * Hashes and sets the password for user instance
 * @param {string} password 
 */
userSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password_hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

/**
 * Validates candidate password against stored hash
 * @param {string} password 
 * @returns {boolean}
 */
userSchema.methods.validatePassword = function (password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
  return this.password_hash === hash;
};

module.exports = mongoose.model('User', userSchema);
