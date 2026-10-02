import { User } from '../models/index.js';
import { Messages, StatusCodes } from '../utils/index.js';
import { throwError } from '../utils/errors/index.js';
import JsonWebToken from '../utils/jwt.js';
import { getAuthorizedUserRoles, Roles } from '../utils/roles.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      throwError('Authorization header missing', StatusCodes.UNAUTHORIZED, 'Authorization header missing', 'AUTH_HEADER_MISSING');
    }

    const token = authHeader.replace('Bearer', '').trim();
    const decoded = JsonWebToken.verifyAccessToken(token);

    if (!decoded?.id) {
      throwError('Invalid token payload', StatusCodes.UNAUTHORIZED, 'Invalid token payload', 'INVALID_TOKEN_PAYLOAD');
    }

    const { id } = decoded;
    const user = await User.findOne({ _id: id, isDeleted: false, status: 'active' }).lean();

    if (!user) {
      throwError('User not found for the provided token', 401, 'User not found for the provided token', 'USER_NOT_FOUND');
    }

    req.token = token;
    req.user = user;

    return next();
  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.AUTHENTICATION_REQUIRED });
  }
};

export const tryAuthenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = JsonWebToken.verifyAccessToken(token);

    if (!decoded?.id) {
      throw new Error('Invalid token payload');
    }

    const { id } = decoded;
    const user = await User.findOne({ _id: id, isDeleted: false, status: 'active' }).lean();

    if (user) {
      req.token = token;
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};

export const authorizeUserRoles = (...allowedRoles) => {
  const rolesToCheck = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

  return (req, res, next) => {
    const { user } = req;

    if (!(user && rolesToCheck.includes(user.role))) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: Messages.FORBIDDEN });
    }

    return next();
  };
};

export const authorizeLeastComposer = () => (
  authorizeUserRoles(getAuthorizedUserRoles(Roles.CONTRIBUTOR))
);

export const authorizeLeastAdmin = () => (
  authorizeUserRoles(getAuthorizedUserRoles(Roles.ADMIN))
);

export const authorizeLeastSuperAdmin = () => (
  authorizeUserRoles(getAuthorizedUserRoles(Roles.SUPER_ADMIN))
);
