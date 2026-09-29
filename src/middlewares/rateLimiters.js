import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const createRateLimiter = ({
  limit,
  message,
  windowMs,
  ...rest
}) => {
  const limiter = rateLimit({
    handler: (req, res) => res.status(429).json({ message }),
    keyGenerator: (req) => {
      const email = (req.body?.email || '').trim().toLowerCase();
      const ip = req.ip ? ipKeyGenerator(req.ip) : 'unknown';

      return `${ip}|${email || 'no-email'}`;
    },
    limit,
    standardHeaders: true,
    windowMs,
    ...rest,
  });

  return limiter;
};

export const createAccountLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 create account requests per `window` (here, per hour)
  message:
    'Too many accounts created from this IP, please try again after an hour',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false,
});

export const resendVerifyEmailLimiter = createRateLimiter({
  limit: 3,
  message: 'Too many verification requests. Please try again later.',
  windowMs: 15 * 60 * 1000,
});

export const forgotPasswordLimiter = createRateLimiter({
  limit: 3,
  message: 'Too many password reset requests. Please try again later.',
  windowMs: 15 * 60 * 1000,
});
