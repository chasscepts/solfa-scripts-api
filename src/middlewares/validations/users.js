import Joi from 'joi';

import { RolesList } from '../../utils/roles.js';
import { STATUSES } from '../../utils/constants/index.js';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

export const updateUserSchema = Joi.object({
  role: Joi.string().valid(...RolesList),
  status: Joi.string().valid(...STATUSES),
});