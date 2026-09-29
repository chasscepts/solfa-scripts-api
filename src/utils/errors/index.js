import Messages from '../constants/messages.js';
import StatusCodes from '../statusCodes.js';

const CustomError = (message, status, error) => {
  const err = new Error(message || Messages.SERVER_ERROR);
  err.status = status || StatusCodes.SERVER_ERROR;

  if (error) {
    err.error = error;
  }

  return err;
};

export const handleError = (err, res) => {
  const status = err?.status || StatusCodes.SERVER_ERROR;
  const message = err?.message || Messages.SERVER_ERROR;
  let error = {
    code: status,
    message,
  };

  if (err?.error) {
    if (err.error.code) {
      error.code = err.error.code;
    }
    if (err.error.message) {
      error.message = err.error.message;
    }

    const props = err.error.errorProps;

    if (props) {
      if (typeof props === 'object' && !Array.isArray(props)) {
        try {
          error = { ...error, ...props };
        } catch {
          // No Action Required!
        }
      } else {
        error = { ...error, details: props };
      }
    }
  }

  res.status(status).json({ message, error });
};

export const throwError = (message, status, errorMessage, errorCode, errorProps) => {
  let error = null;

  if (errorMessage || errorCode) {
    error = {
      code: errorCode || status,
      message: errorMessage || message,
    };
  }

  if (errorProps) {
    if (!error) {
      error = {
        code: status,
        message,
      };
    }

    try {
      error = { ...error, ...errorProps };
    } catch {
      // No Action Required!
    }
  }

  throw new CustomError(message, status, error);
};

export const tryHandle = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    if (res.headersSent) {
      return next(error);
    }

    return handleError(error, res);
  }
};

export const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);

    return;
  }

  handleError(err, res);
};
