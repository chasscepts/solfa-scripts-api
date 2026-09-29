import StatusCodes from '../../utils/statusCodes.js';

/** @import Joi from 'joi' */

/**
 * @param {Joi.Schema} schema
 * @param {string} prop
 * @returns
 */
const validate = (schema, prop = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[prop]);

  if (error) {
    const errorDetails = error.details.map((detail) => detail.message).join(', ');

    console.log('error', error);

    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ message: errorDetails || 'Some required fields are blank or failed to pass validations!', error });
  }

  req[prop] = value;

  return next();
};

export default validate;
