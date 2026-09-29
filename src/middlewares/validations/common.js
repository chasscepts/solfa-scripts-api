import Joi from 'joi';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectId = Joi.string().trim().pattern(objectIdRegex);

export const idFieldsArrayCheck = (fieldNames) => Joi.object(
  fieldNames.reduce((acc, fieldName) => {
    acc[fieldName] = objectId.required();

    return acc;
  }, {})
);

export const idPropCheck = (propName = 'id') => idFieldsArrayCheck([propName]);


export const idFieldsCheck = (...fieldNames) => idFieldsArrayCheck(fieldNames.length ? fieldNames : ['id']);

export const paramsCheck = idFieldsCheck;

export const idCheck = idPropCheck();

export const tokenCheck = Joi.object({
  token: Joi.string().required(),
});

export const termCheck = Joi.object({
  term: Joi.string().required(),
});
