/**
 * Idempotent Administrator Provisioning Script
 * 
 * Safely provisions an initial administrator account for the IT303 Weather Monitoring System.
 * - Inspects the shared MongoDB `users` collection.
 * - Idempotent: checks for existing administrator accounts and preserves them without overwriting passwords.
 * - Secure: Hashes passwords with PBKDF2 (100,000 iterations, 64-byte key length, SHA-512) via User.setPassword.
 * - Never logs plaintext passwords or writes plaintext credentials to the database.
 * 
 * Usage:
 *   ADMIN_USERNAME=admin ADMIN_EMAIL=admin@weather.local ADMIN_PASSWORD=Admin@Secure2026! node src/scripts/seedAdmin.js
 *   or npm run seed:admin
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather_db';
  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  const email = (process.env.ADMIN_EMAIL || 'admin@weather.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@Secure2026!';

  console.log('==================================================');
  console.log('  IT303 Weather Monitoring - Admin Account Seeder  ');
  console.log('==================================================');
  console.log(`Connecting to MongoDB...`);

  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 8000 });
    console.log(`Connected to database: ${mongoose.connection.name}`);

    // Check if an admin account already exists
    const existingAdmin = await User.findOne({
      $or: [
        { role: 'admin' },
        { username: username },
        { email: email }
      ]
    });

    if (existingAdmin) {
      console.log(`[Admin Seed] ℹ️ An administrator account already exists:`);
      console.log(`  - Username: ${existingAdmin.username}`);
      console.log(`  - Email:    ${existingAdmin.email || 'N/A'}`);
      console.log(`  - Role:     ${existingAdmin.role}`);
      console.log(`[Admin Seed] Existing credentials and password hashes are strictly preserved.`);
      console.log(`[Admin Seed] No modifications were made. Idempotent check passed.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Provision new administrator
    const adminUser = new User({
      username,
      email,
      role: 'admin'
    });

    adminUser.setPassword(password);
    await adminUser.save();

    console.log(`[Admin Seed] ✅ Administrator successfully provisioned!`);
    console.log(`  - Username:  ${adminUser.username}`);
    console.log(`  - Email:     ${adminUser.email}`);
    console.log(`  - Role:      ${adminUser.role}`);
    console.log(`  - Salt:      [Generated 16-byte random salt]`);
    console.log(`  - Hash:      [PBKDF2-SHA512 (100,000 iterations)]`);
    console.log(`  - Database:  ${mongoose.connection.name}.users`);
    console.log('==================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`[Admin Seed] ❌ Failed to seed admin: ${err.message}`);
    process.exit(1);
  }
}

seedAdmin();
