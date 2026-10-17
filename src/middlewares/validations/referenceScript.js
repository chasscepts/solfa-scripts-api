import Joi from 'joi';

import { objectId } from './common.js';

export const referenceScriptSchema = Joi.object({
  composer: Joi.string().allow('').optional(),
  devotionalFocus: Joi.string().allow('').optional(),
  liturgicalFunction: Joi.string().allow('').optional(),
  liturgicalSeason: Joi.string().allow('').optional(),
  musicalStyle: Joi.string().allow('').optional(),
  photos: Joi.array().min(1).items(objectId).required(),
  score: objectId.allow(null).optional(),
  title: Joi.string().allow('').optional(),
});

export const updateReferenceScriptSchema = Joi.object({
  score: objectId.allow(null).optional(),
  editor: objectId.allow(null).optional(),
});
