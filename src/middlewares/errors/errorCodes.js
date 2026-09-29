export const INVALID_EMAIL_OR_PASSWORD = {
  statusCode: 400, // Bad Request
  message: 'Invalid email address or password',
};

export const NOT_FOUND = {
  statusCode: 404, // Not Found
  message: 'Not found',
};

export const INVALID_UPDATES = {
  statusCode: 400, // Bad Request
  message: 'update type not allowed, only name, password and age can be updated',
};

export const INTERNAL_ERROR = {
  statusCode: 500, // Internal Server Error
  message: 'Internal Server Error',
};

export const getCode = (code) => {
  switch (code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return INVALID_EMAIL_OR_PASSWORD;
    case 'NOT_FOUND':
      return NOT_FOUND;
    case 'INVALID_UPDATES':
      return INVALID_UPDATES;
    case 'INTERNAL_ERROR':
      return INTERNAL_ERROR;
    default:
      return INTERNAL_ERROR;
  }
};
