import { throwError } from './errors/index.js';
import Messages from './constants/messages.js';
import StatusCodes from './statusCodes.js';

const USER = 'user';
const ADMIN = 'admin';
const SUPER_ADMIN = 'super_admin';
const CONTRIBUTOR = 'contributor';

export const Roles = {
  ADMIN: ADMIN,
  SUPER_ADMIN: SUPER_ADMIN,
  CONTRIBUTOR: CONTRIBUTOR,
  USER: USER,
};

export const RolesList = [USER, CONTRIBUTOR, ADMIN, SUPER_ADMIN];

export const getAuthorizedUserRoles = (role) => {
  const index = RolesList.indexOf(role);

  if (index === -1) {
    return [];
  }

  return RolesList.slice(index);
};

export const isAdmin = (req) => {
  const user = req?.user;

  if (!user) {
    return false;
  }

  return user.role === Roles.ADMIN || user.role === Roles.SUPER_ADMIN;
};

export const assertAdmin = (req) => {
  if (!isAdmin(req)) {
    throwError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN);
  }
};

export const assertOwnerOrAdmin = (req, script) => {
  if (!req.user) {
    throwError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN);
  }
  if (isAdmin(req)) {
    return req.user;
  }

  const user = req.user;

  if (!(user && script)) {
    throwError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  if (String(script.owner) !== String(user._id)) {
    throwError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  return user;
};

export const assertSelfOrAdmin = (req, userId) => {
  if (!req.user) {
    throwError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN);
  }
  if (isAdmin(req)) {
    return req.user;
  }

  const user = req.user;

  if (!(user && userId)) {
    throwError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  if (String(user._id) !== String(userId)) {
    throwError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  return user;
};

export const assertSuperAdmin = (req) => {
  const user = req.user;
  
  if (user?.role !== Roles.SUPER_ADMIN) {
    throwError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  return user;
};
