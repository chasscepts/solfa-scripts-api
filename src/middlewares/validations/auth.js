import Joi from 'joi';

import { objectId } from './common.js';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  firstname: Joi.string().min(2).required(),
  lastname: Joi.string().min(2).required(),
  password: Joi.string().min(8).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

export const sendVerificationEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const reAuthSchema = Joi.object({
  token: Joi.string().required(),
});
