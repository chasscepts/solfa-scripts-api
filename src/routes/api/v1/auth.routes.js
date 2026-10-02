import { Router } from 'express';

import {
  changePassword,
  createUser,
  sendResetPasswordLink,
  getMe,
  login,
  logout,
  reAuth,
  refresh,
  register,
  resetPassword,
  sendVerifyEmail,
  verifyEmail,
} from '../../../controllers/auth.controller.js';
import {
  createAccountLimiter,
  forgotPasswordLimiter,
  resendVerifyEmailLimiter,
} from '../../../middlewares/rateLimiters.js';
import {
  authenticate,
  authorizeLeastAdmin,
} from '../../../middlewares/authenticate.js';
import validate from '../../../middlewares/validations/index.js';
import {
  reAuthSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendVerificationEmailSchema,
} from '../../../middlewares/validations/auth.js';

const router = Router({ mergeParams: true });

router.post(
  '/register',
  createAccountLimiter,
  validate(registerSchema),
  register,
);

router.post(
  '/new',
  createAccountLimiter,
  validate(registerSchema),
  authorizeLeastAdmin(),
  createUser,
);

router.post(
  '/login',
  // createAccountLimiter,
  validate(loginSchema),
  login,
);

router.post('/re-auth', validate(reAuthSchema), reAuth);

router.post('/logout', logout);
router.get('/me', authenticate, getMe);

router.post('/refresh', validate(refreshTokenSchema), refresh);

router.post('/change-password', validate(changePasswordSchema), authenticate, changePassword);

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), sendResetPasswordLink);

router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

router.post('/verify-email', verifyEmail);

router.post('/verify-email/send', validate(sendVerificationEmailSchema), resendVerifyEmailLimiter, sendVerifyEmail);

export default router;
