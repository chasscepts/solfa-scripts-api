import crypto from 'crypto';

// Generates a unique string using crypto, base64url encoded for URL safety
export const generateUniqueString = (length = 32) => {
  // Generate random bytes, then encode as base64url (RFC 4648, no padding)
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const generateToken = (length = 64) => crypto.randomBytes(length).toString('hex');

export const generateOtp = (length = 7) => {
  let otp = '';

  for (let i = 0; i < length; i += 1) {
    otp = `${otp}${crypto.randomInt(10)}`;
  }

  return Number.parseInt(otp, 10);
};

export const generateChallenge = (length = 16) => crypto.randomBytes(length).toString('utf-8');

export const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateReferralCode = (existingCodes) => {
  const length = 8;
  const prefix = 'REF';
  let referralCode = '';

  do {
    referralCode = prefix + generateRandomString(length);
  } while (existingCodes.includes(referralCode));

  return referralCode;
};

export const generateCouponCode = (existingCodes) => {
  const length = 8;
  const prefix = 'CPN';
  let couponCode = '';

  do {
    couponCode = prefix + generateRandomString(length);
  } while (existingCodes.includes(couponCode));

  return couponCode;
};

export const randomHex = (length) => crypto.randomBytes(length).toString('hex');
