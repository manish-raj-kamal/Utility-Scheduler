const crypto = require('crypto');

/**
 * In-memory OTP store for registration flow.
 * Key = email (lowercase), Value = { otp, expiresAt }
 *
 * OTPs auto-expire. Cleanup runs every 5 minutes.
 */
const store = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const COOLDOWN_MS = 45 * 1000;      // 45 seconds between resends

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.expiresAt) store.delete(key);
  }
}, 5 * 60 * 1000);

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

/**
 * Create and store an OTP for the given email.
 * Returns { otp } or throws if rate-limited.
 */
const createOtp = (email) => {
  const key = email.toLowerCase().trim();
  const existing = store.get(key);

  if (existing && Date.now() < existing.cooldownUntil) {
    const wait = Math.ceil((existing.cooldownUntil - Date.now()) / 1000);
    throw new Error(`Please wait ${wait}s before requesting another OTP`);
  }

  const otp = generateOtp();
  store.set(key, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    cooldownUntil: Date.now() + COOLDOWN_MS
  });
  return { otp };
};

/**
 * Verify the OTP for the given email.
 * Returns true or throws with a descriptive message.
 */
const verifyOtp = (email, otp) => {
  const key = email.toLowerCase().trim();
  const entry = store.get(key);

  if (!entry) throw new Error('No OTP was requested for this email');
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    throw new Error('OTP has expired — request a new one');
  }
  if (entry.otp !== otp) throw new Error('Invalid OTP');

  // OTP is valid — remove it
  store.delete(key);
  return true;
};

module.exports = { createOtp, verifyOtp };
