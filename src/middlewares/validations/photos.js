import Joi from 'joi';

export const createPhotoSchema = Joi.object({
  altText: Joi.string().allow('').optional(),
  format: Joi.string().allow('').optional(),
  height: Joi.number().optional(),
  label: Joi.string().allow('').optional(),
  name: Joi.string().allow('').optional(),
  publicId: Joi.string().required(),
  size: Joi.number().optional(),
  url: Joi.string().required(),
  width: Joi.number().optional(),
});

export const createSignatureSchema = Joi.object({
  folder: Joi.string().required(),
  publicId: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});
