import express from 'express';

import {
  listSongs,
  listSongsAdmin,
  getSong,
  updateSong,
  deleteSong,
} from '../../../controllers/songs.controller.js';
import { authenticate, authorizeLeastComposer } from '../../../middlewares/authenticate.js';
import validate from '../../../middlewares/validations/index.js';
import { idCheck } from '../../../middlewares/validations/common.js';
import { updateSongSchema } from '../../../middlewares/validations/songs.js';

const router = express.Router();

router.get('/', listSongs);

router.use(authenticate);

router.get('/admin', authorizeLeastComposer(), listSongsAdmin);
router.get('/:id', validate(idCheck, 'params'), getSong);
router.put(
  '/:id',
  validate(updateSongSchema, 'body'),
  authorizeLeastComposer(),
  updateSong,
);
router.delete(
  '/:id',
  validate(idCheck, 'params'),
  authorizeLeastComposer(),
  deleteSong,
);

export default router;
