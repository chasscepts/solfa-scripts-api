import { Messages, StatusCodes } from '../../utils/index.js';
import { getCode } from './errorCodes.js';

export const routesErrorHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: Messages.ROUTE_NOT_FOUND });
};

const errorHandler = (err, req, res) => {
  const code = (err && err.code) || null;
  const error = getCode(code);

  res.status(error.statusCode).json({ message: error.message });
};

export default errorHandler;
