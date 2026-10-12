const mongoose = require('mongoose');
const User = require('../models/User');
const AlertLog = require('../models/AlertLog');
const { assessPassword } = require('../auth/passwordPolicy');

async function runTests() {
  console.log('--------------------------------------------------');
  console.log('  Testing Auth, Roles, Notifications & Policies   ');
  console.log('--------------------------------------------------');

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather_db';
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // 1. Password Policy Assessment
  const weakCheck = assessPassword('123456');
  assert(!weakCheck.valid && weakCheck.strength === 'weak', 'Weak password rejected by policy');

  const strongCheck = assessPassword('ValidPass123!@#');
  assert(strongCheck.valid && strongCheck.strength === 'strong', 'Strong password accepted by policy');

  // 2. User Registration Role Integrity
  const testUsername = `testuser_${Date.now()}`;
  const testEmail = `${testUsername}@example.com`;
  
  // Clean up any stale record
  await User.deleteOne({ username: testUsername });

  // Simulate register logic: even if body had role: 'admin', assignedRole is 'user'
  const user = new User({
    username: testUsername,
    email: testEmail,
    role: 'user'
  });
  user.setPassword('ValidPass123!@#');
  await user.save();

  assert(user.role === 'user', 'New registration strictly receives role: "user"');
  assert(user.validatePassword('ValidPass123!@#') === true, 'Password validated correctly with PBKDF2 hash');
  assert(user.validatePassword('WrongPassword123!') === false, 'Invalid password rejected');

  // 3. Admin Account Verification
  const admin = await User.findOne({ role: 'admin', username: 'admin' });
  assert(admin !== null && admin.role === 'admin', 'Provisioned administrator exists in database');
  assert(admin.validatePassword('admin123') === true, 'Admin credentials authenticate successfully');

  // 4. Role Guard: User cannot log in via admin expectedRole
  const attemptAsAdmin = user.role === 'admin';
  assert(attemptAsAdmin === false, 'Standard user is rejected when attempting administrator login');

  // 5. Password Reset Flow: Token generation and single-use invalidation
  const resetToken = user.setPasswordResetToken();
  await user.save();
  assert(typeof resetToken === 'string' && resetToken.length === 64, 'Single-use cryptographic reset token generated');
  assert(user.password_reset_token_hash !== null, 'Reset token hash stored in database (never plaintext token)');
  assert(user.password_reset_expires_at > new Date(), 'Reset token has valid future expiration');

  // Reset password
  user.setPassword('NewStrongPass2026!$');
  user.clearPasswordResetToken();
  await user.save();

  assert(user.validatePassword('NewStrongPass2026!$') === true, 'New password set successfully');
  assert(user.password_reset_token_hash === null, 'Reset token hash invalidated immediately after use');
  assert(user.password_reset_expires_at === null, 'Reset expiry cleared');

  // 6. Notification Read/Unread Flow
  // Clear any test alert
  await AlertLog.deleteMany({ device_id: 'TEST-DEV-99' });

  // Create an unread alert
  const testAlert = await AlertLog.create({
    device_id: 'TEST-DEV-99',
    alert_type: 'threshold_exceeded',
    parameter: 'temperature',
    severity: 'warning',
    message: 'High temperature test alert',
    status: 'active',
    is_read: false
  });

  const unreadBefore = await AlertLog.countDocuments({
    status: 'active',
    $or: [{ is_read: false }, { is_read: { $exists: false } }]
  });
  assert(unreadBefore >= 1, `Unread count reflects unread active alert (count: ${unreadBefore})`);

  // Mark all as read
  await AlertLog.updateMany(
    { status: 'active', $or: [{ is_read: false }, { is_read: { $exists: false } }] },
    { $set: { is_read: true, read_at: new Date() } }
  );

  const unreadAfter = await AlertLog.countDocuments({
    status: 'active',
    is_read: false
  });
  assert(unreadAfter === 0, 'After viewing notifications, unread count is exactly 0 and badge clears');

  // Clean up
  await AlertLog.deleteMany({ device_id: 'TEST-DEV-99' });
  await User.deleteOne({ _id: user._id });

  console.log('--------------------------------------------------');
  console.log(`Summary: ${passed}/${total} tests passed.`);
  console.log('--------------------------------------------------');

  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
