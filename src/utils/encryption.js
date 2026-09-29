import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { randomHex } from './random.js';

const HASH_ALGORITHM = 'sha256';
const PADDING = crypto.constants.RSA_PKCS1_OAEP_PADDING;
const SYMMETRIC_ALGORITHM = 'aes-256-cbc';

/**
 * Generates a random key and symmetrically encrypts @message with it.
 * returns both key and encrypted message
 * @param {string} message data to encrypt
 * @returns { { key: string, data: string } }
 */
const symmEncrypt = (message) => {
  const iv = crypto.randomBytes(16);
  const key = crypto.randomBytes(32);

  const cipher = crypto.createCipheriv(SYMMETRIC_ALGORITHM, key, iv);

  const encrypted = cipher.update(message, 'utf-8', 'hex');

  return {
    data: `${encrypted}${cipher.final('hex')}`,
    key: Buffer.concat([iv, key], iv.length + key.length).toString('hex'),
  };
};

/**
 * Decrypts an encrypted @message using @key
 * @param {string} key used in encryption
 * @param {string} message encrypted data
 * @returns { string } decrypted message
 */
const symmDecrypt = (key, message) => {
  const buffer = Buffer.from(key, 'hex');
  const iv = buffer.subarray(0, 16);
  const secret = buffer.subarray(16);
  const decipher = crypto.createDecipheriv(SYMMETRIC_ALGORITHM, secret, iv);

  const decrypted = decipher.update(message, 'hex', 'utf8');

  return `${decrypted}${decipher.final('utf8')}`;
};

const cryptoPrivateDecrypt = (privateKey, message) => crypto.privateDecrypt({
  key: privateKey,
  padding: PADDING,
  oaepHash: HASH_ALGORITHM,
}, Buffer.from(message, 'hex')).toString('hex');

const cryptoPublicEncrypt = (publicKey, message) => crypto.publicEncrypt({
  key: publicKey,
  padding: PADDING,
  oaepHash: HASH_ALGORITHM,
}, Buffer.from(message, 'hex')).toString('hex');

/**
 * Generates a public - private rsa key pair
 * @param {number} length
 * @param {string} format
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
export const generateKeyPairAsync = (length) => new Promise((resolve, reject) => {
  crypto.generateKeyPair('rsa', {
    modulusLength: length || 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  }, (err, publicKey, privateKey) => {
    if (err) {
      reject(err);
    } else {
      resolve({ publicKey, privateKey });
    }
  });
});

/**
 * Symmetrically encrypts @message and
 * asymmetrically encrypt the encryption key using a public key
 * return both encrypted message and key
 * @param {string} publicKey private key
 * @param {string} message data to encrypt
 * @returns {{ key: string, data: string }}
 */
export const publicEncrypt = (publicKey, message) => {
  const { key, data } = symmEncrypt(message);

  return {
    key: cryptoPublicEncrypt(publicKey, key),
    data,
  };
};

/**
 *  Asymetrically decrypts @encryptedKey using a private key
 * then symmetrically decrypts @message using the decrypted key.
 * @param {string} privateKey private key
 * @param {string} encryptedKey asymmetrically encrypted key
 * @param {string} message symmetrically encrypted data
 * @returns {string}
 */
export const privateDecrypt = (privateKey, encryptedKey, message) => {
  const key = cryptoPrivateDecrypt(privateKey, encryptedKey).toString('hex');

  return symmDecrypt(key, message);
};

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const randomHash = (length) => {
  const token = randomHex(length);
  const hash = hashToken(token);

  return { hash, token };
};

export const hashPassword = (text) => bcrypt.hash(text, 12);

export const verifyPassword = (text, hash) => bcrypt.compare(text, hash);
