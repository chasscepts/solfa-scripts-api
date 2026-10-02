import express from 'express';

import {
  cloudinarySign,
  createPhoto,
} from '../../../controllers/photos.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import validate from '../../../middlewares/validations/index.js';
import { createPhotoSchema, createSignatureSchema } from '../../../middlewares/validations/photos.js';

const router = express.Router();

router.post('/sign', validate(createSignatureSchema), authenticate, cloudinarySign);

router.post('/', validate(createPhotoSchema), authenticate, createPhoto);

export default router;
