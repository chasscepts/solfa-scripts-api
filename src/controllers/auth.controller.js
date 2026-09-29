import {
  EmailToken,
  User,
  authenticatedUser,
  withOptionalTransaction,
} from '../models/index.js';
import EmailServices from '../services/email.service.js';
import { Messages, StatusCodes } from '../utils/index.js';
import {
  hashPassword,
  hashToken,
  randomHash,
  verifyPassword,
} from '../utils/encryption.js';
import { handleError } from '../utils/errors/index.js';
import JsonWebToken from '../utils/jwt.js';
import config from '../config/index.js';
import { Roles } from '../utils/roles.js';

const EMAIL_TOKEN_TTL_MS = 60 * 60 * 1000;
const EMAIL_VERIFY_TOKEN_TTL_MS = 24 * EMAIL_TOKEN_TTL_MS;

const sessionOptions = (session) => (session ? { session } : undefined);

const withSession = (query, session) => (session ? query.session(session) : query);

const createEmailToken = async (tokenData, session) => {
  if (!session) {
    return EmailToken.create(tokenData);
  }

  const [emailToken] = await EmailToken.create([tokenData], { session });

  return emailToken;
};

const invalidTokenResult = (message = 'Invalid or already used token.') => ({
  error: { message },
  status: 400,
});

const sendVerificationEmail = async (user, token) => {
  try {
    const clientBaseUrl = config.app.clientUrl;
    const verificationPage = `${clientBaseUrl}/verify-email`;
    const verificationUrl = `${verificationPage}?token=${encodeURIComponent(token)}`;

    await EmailServices.sendEmail(user.email, {
      subject: 'Verify your email for Neighborly',
      name: user.firstname,
      template: 'verify-email',
      verificationPage,
      verificationUrl,
      token,
    }, `Token: ${token}, Verification URL: ${verificationUrl}`);
  } catch {
    // ignore
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.UNAUTHORIZED });
    }

    res.json(authenticatedUser(req.user));
  } catch (err) {
    return handleError(err, res);
  }
};

export const createUser = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const firstname = (req.body.firstname || '').trim();
    const lastname = (req.body.lastname || '').trim();
    const password = req.body.password || '';

    if (!(email && firstname && lastname && password)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: Messages.MISSING_REGISTRATION_FIELDS });
    }

    // Check if a user exists with the same email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(StatusCodes.SERVER_ERROR).json({ message: Messages.SERVER_ERROR });
    }

    const user = await User.create({
      email,
      firstname,
      lastname,
      password,
      role: req.body.role || Roles.USER,
    });

    return res.status(StatusCodes.CREATED).json({
      data: authenticatedUser(user),
    });
  } catch (err) {
    return handleError(err, res);
  }
};

// POST /auth/register
export const register = async (req, res) => {
  try {
    const country = req.body.country || null;
    const email = (req.body.email || '').trim().toLowerCase();
    const firstname = (req.body.firstname || '').trim();
    const lastname = (req.body.lastname || '').trim();
    const password = req.body.password || '';
    const phone = (req.body.phone || '').trim() || null;

    if (!(email && firstname && lastname && password && phone)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: Messages.MISSING_REGISTRATION_FIELDS });
    }

    // Check if a user exists with the same email or phone
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res.status(StatusCodes.SERVER_ERROR).json({ message: Messages.SERVER_ERROR });
    }

    const user = await User.create({
      country,
      email,
      firstname,
      lastname,
      password,
      phone,
    });

    const { hash: tokenHash, token } = randomHash(32);
    const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);

    await createEmailToken({
      expiresAt,
      metadata: {},
      tokenHash,
      type: 'email_verify',
      user: user._id,
    });

    await sendVerificationEmail(user, token);

    return res.status(StatusCodes.CREATED).json(authenticatedUser(user));
  } catch (err) {
    return handleError(err, res);
  }
};

// POST /auth/login
export const login = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!(email && password)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.MISSING_AUTH_FIELDS });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.INVALID_CREDENTIALS });
    }

    const ok = await verifyPassword(password, user.password);

    if (!ok) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.INVALID_CREDENTIALS });
    }

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    return res.json(authenticatedUser(user));
  } catch (err) {
    return handleError(err, res);
  }
};

export const reAuth = async (req, res) => {
  const { token } = req.body;
  const { id } = JsonWebToken.verifyAccessToken(token);
  const user = await User.findOne({ _id: id, isDeleted: false, status: 'active' });

  if (!user) {
    throwError(
      Messages.UNPROCESSABLE_ENTITY,
      StatusCodes.UNPROCESSABLE_ENTITY,
      Messages.UNPROCESSABLE_ENTITY,
    );
  }

  res.json(authenticatedUser(user));
};

// POST /auth/refresh
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || '';

    if (!refreshToken) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.MISSING_REFRESH_TOKEN });
    }

    const decoded = JsonWebToken.verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.INVALID_REFRESH_TOKEN });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.INVALID_REFRESH_TOKEN });
    }

    const accessToken = JsonWebToken.buildAccessToken({ id: String(user._id) });

    return res.json({ accessToken });
  } catch (err) {
    return handleError(err, res);
  }
};

// POST /auth/change-password
// Body: { oldPassword, password }
export const changePassword = async (req, res) => {
  try {
    const currentPassword = req.body?.currentPassword || '';
    const newPassword = req.body?.newPassword || '';

    if (!currentPassword) {
      return res.status(400).json({ message: 'Old password is required.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const ok = await verifyPassword(currentPassword, user.password);

    if (!ok) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    await User.updateOne({ _id: userId }, { password: await hashPassword(newPassword) });

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    return handleError(err, res);
  }
};

// Route: POST /auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.EMAIL_REQUIRED });
    }

    const user = await User.findOne({ email });

    // Always return success to avoid leaking user enumeration.
    if (!user) {
      return res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
    }

    const { hash: tokenHash, token } = randomHash(32);
    const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);

    await createEmailToken({
      expiresAt,
      metadata: {},
      tokenHash,
      type: 'password_reset',
      subject: user._id,
      subjectRef: 'User',
    });

    const clientBaseUrl = config.app.clientUrl;
    const resetUrl = `${clientBaseUrl}/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`;

    await EmailServices.sendEmail(user.email, {
      subject: 'Reset your password',
      name: user.firstname,
      template: 'forgot-password',
      resetUrl,
    }, `Reset your password: ${resetUrl}`);

    return res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
  } catch (err) {
    return handleError(err, res);
  }
};

// Route: POST /auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const password = req.body?.newPassword || '';
    const token = req.body?.token || '';

    if (!token) {
      return res.status(400).json({ message: 'Token is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const tokenHash = hashToken(token);

    const result = await withOptionalTransaction(EmailToken, async (session) => {
      const emailToken = await withSession(EmailToken.findOne({
        consumedAt: null,
        tokenHash,
        type: 'password_reset',
      }), session);

      if (!emailToken) {
        return invalidTokenResult();
      }

      if (emailToken.expiresAt.getTime() < Date.now()) {
        return { error: { message: 'Token has expired.' }, status: 400 };
      }

      const now = new Date();
      const consumeResult = await EmailToken.updateOne(
        { _id: emailToken._id, consumedAt: null },
        { consumedAt: now },
        sessionOptions(session),
      );

      if (consumeResult.matchedCount !== 1) {
        return invalidTokenResult();
      }

      const userUpdateResult = await User.updateOne(
        { _id: emailToken.subject },
        { password },
        sessionOptions(session),
      );

      if (userUpdateResult.matchedCount !== 1) {
        return { error: { message: 'User not found.' }, status: 404 };
      }

      return { data: { message: 'Password reset successful.' } };
    });

    if (result.error) {
      return res.status(result.status || 400).json(result.error);
    }

    return res.json(result.data);
  } catch (err) {
    return handleError(err, res);
  }
};

export const sendVerifyEmail = async (req, res) => {
  try {
    let email = req.body?.email || '';
    /** @type {User} */
    let user = req.user;
  
    email = (email || '').trim().toLowerCase();

    if (!(email || user)) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (!user) {
      user = await User.findOne({ email });
    }

    // Always return success to avoid user enumeration.
    if (!user) {
      return res.json({ message: 'If an account exists for this email, a verification link has been sent.' });
    }

    // If already verified, still return success (no need to send).
    if (user.emailVerified) {
      return res.json({ message: 'If an account exists for this email, a verification link has been sent.' });
    }

    const { hash: tokenHash, token } = randomHash(32);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_TTL_MS);

    await withOptionalTransaction(EmailToken, async (session) => {
      const now = new Date();

      // Invalidate any previous unused verification tokens for this user.
      await EmailToken.updateMany(
        { consumedAt: null, type: 'email_verify', user: user._id },
        { consumedAt: now },
        sessionOptions(session),
      );

      await createEmailToken({
        expiresAt,
        metadata: {},
        tokenHash,
        type: 'email_verify',
        user: user._id,
      }, session);
    });

    await sendVerificationEmail(user, token);

    return res.json({ message: 'If an account exists for this email, a verification link has been sent.' });
  } catch (err) {
    return handleError(err, res);
  }
};

// Route: POST /auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token || '';

    if (!token) {
      return res.status(400).json({ message: 'Token is required.' });
    }

    const tokenHash = hashToken(token);

    const result = await withOptionalTransaction(EmailToken, async (session) => {
      const emailToken = await withSession(EmailToken.findOne({
        consumedAt: null,
        tokenHash,
        type: 'email_verify',
      }), session);

      if (!emailToken) {
        return {
          data: null,
          error: {
            code: 'TOKEN_INVALID',
            message: 'Token has expired.',
          },
          status: 400,
        };
      }

      const user = await withSession(User.findById(emailToken.subject), session);

      if (!user) {
        return {
          data: null,
          error: {
            code: 'TOKEN_INVALID',
            message: 'Token has expired.',
          },
          status: 400,
        };
      }

      if (emailToken.expiresAt.getTime() < Date.now()) {
        return {
          data: null,
          error: {
            code: 'TOKEN_EXPIRED',
            email: user.email,
            message: 'Token has expired.',
          },
          status: 400,
        };
      }

      const now = new Date();
      const consumeResult = await EmailToken.updateOne(
        { _id: emailToken._id, consumedAt: null },
        { consumedAt: now },
        sessionOptions(session),
      );

      if (consumeResult.matchedCount !== 1) {
        return {
          data: null,
          error: {
            code: 'TOKEN_INVALID',
            message: 'Token has expired.',
          },
          status: 400,
        };
      }

      await User.updateOne(
        { _id: user._id },
        { emailVerified: true },
        sessionOptions(session),
      );
      user.emailVerified = true;

      return { data: user, error: null, status: 200 };
    });

    if (result.error) {
      return res.status(result.status || 400).json(result.error);
    }

    const user = result.data;

    return res.json(authenticatedUser(user));
  } catch (err) {
    return handleError(err, res);
  }
};

// Route: POST /auth/logout
export const logout = async (req, res) => {
  try {
    // For JWT, logout can be handled on the client side by deleting tokens.
    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    return handleError(err, res);
  }
};
