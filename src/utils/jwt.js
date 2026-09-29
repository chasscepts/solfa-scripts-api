import jwt from 'jsonwebtoken';

import config from '../config/index.js';
import CustomError from './errors/CustomError.js';
import Messages from './constants/messages.js';
import StatusCodes from './statusCodes.js';

const { decode: jsonDecode, sign, verify } = jwt;

const encode = (payload, expiresIn) => new Promise((resolve, reject) => {
  sign(payload, config.jwt.secret, { expiresIn: expiresIn || config.jwt.expiresIn }, (err, token) => {
    if (err) {
      reject(err);
    } else {
      resolve(token);
    }
  });
});

const verifyToken = (token) => new Promise((resolve, reject) => {
  verify(token, config.jwt.secret, (err, payload) => {
    if (err) {
      reject(new CustomError(
        Messages.UNAUTHORIZED,
        StatusCodes.UNAUTHORIZED,
        { message: Messages.INVALID_OR_EXPIRED_TOKEN },
      ));
    } else {
      resolve(payload);
    }
  });
});

const decode = (token) => jsonDecode(token, config.jwt.secret);

const getToken = (id, expiresIn = '24h') => encode({ id }, expiresIn);

const decodeToken = async (token) => {
  const { id } = await verifyToken(token);

  return id;
};

const buildAccessToken = (payload) => sign(
  payload, config.jwt.accessSecret,
  { expiresIn: config.jwt.accessExpiry },
);

const buildRefreshToken = (payload) => sign(
  payload, config.jwt.refreshSecret,
  { expiresIn: config.jwt.refreshExpiry },
);

const verifyARToken = (token, isRefresh = false) => {
  let decoded = null;

  try {
    decoded = verify(token, isRefresh ? config.jwt.refreshSecret : config.jwt.accessSecret);
  } catch {
    // ignore
  }

  return decoded;
};

const verifyAccessToken = (token) => verifyARToken(token, false);

const verifyRefreshToken = (token) => verifyARToken(token, true);

const JWT = {
  decode,
  decodeToken,
  encode,
  getToken,
  verify: verifyToken,
  buildAccessToken,
  buildRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

export default JWT;
