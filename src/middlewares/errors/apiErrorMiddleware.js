import { handleError } from '../../utils/errors/index.js';

const apiErrorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);

    return;
  }

  handleError(err, res);
};

export default apiErrorMiddleware;
