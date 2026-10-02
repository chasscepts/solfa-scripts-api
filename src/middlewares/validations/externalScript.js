import Joi from 'joi';

import { objectId } from './common.js';

export const externalScriptSchema = Joi.object({
  composer: Joi.string().allow('').optional(),
  devotionalFocus: Joi.string().allow('').optional(),
  liturgicalFunction: Joi.string().allow('').optional(),
  liturgicalSeason: Joi.string().allow('').optional(),
  musicalStyle: Joi.string().allow('').optional(),
  photos: Joi.array().min(1).items(objectId).required(),
  script: objectId.allow(null).optional(),
  title: Joi.string().allow('').optional(),
});

export const updateExternalScriptSchema = Joi.object({
  script: objectId.allow(null).optional(),
  scriptRef: Joi.string().valid('SolfaScript').when('script', {
    is: objectId.required(),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  editor: objectId.allow(null).optional(),
});
