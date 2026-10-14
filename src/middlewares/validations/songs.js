import Joi from 'joi';
import { objectId } from './common.js';

export const createSongSchema = Joi.object({
  composer: Joi.string().optional(),
  description: Joi.string().optional(),
  devotionalFocus: Joi.string().optional(),
  editor: Joi.string().optional(),
  isDeleted: Joi.boolean().optional(),
  isPublished: Joi.boolean().optional(),
  liturgicalFunction: Joi.string().optional(),
  liturgicalSeason: Joi.string().optional(),
  musicalStyle: Joi.string().optional(),
  solfaScript: Joi.string().optional(),
  staffScript: Joi.string().optional(),
  title: Joi.string().required(),
});

export const updateSongSchema = Joi.object({
  devotionalFocus: Joi.string().allow('').optional(),
  liturgicalFunction: Joi.string().allow('').optional(),
  liturgicalSeason: Joi.string().allow('').optional(),
  musicalStyle: Joi.string().allow('').optional(),
  composer: Joi.string().allow('').optional(),
  title: Joi.string().allow('').optional(),
  description: Joi.string().allow('').optional(),
  editor: objectId.optional(),
  solfaScript: objectId.optional(),
  staffScript: objectId.optional(),
});
