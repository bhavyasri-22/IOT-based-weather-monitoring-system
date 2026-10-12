function assessPassword(password) {
  const value = typeof password === 'string' ? password : '';
  const checks = {
    length: value.length >= 12,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const strength = passed >= 5 ? 'strong' : passed >= 3 && value.length >= 8 ? 'medium' : 'weak';
  const errors = [];
  if (!checks.length) errors.push('Password must be at least 12 characters long.');
  if (!checks.lowercase || !checks.uppercase || !checks.number || !checks.symbol) {
    errors.push('Password must include uppercase, lowercase, number, and symbol characters.');
  }
  return { valid: errors.length === 0, strength, checks, errors };
}

module.exports = { assessPassword };
