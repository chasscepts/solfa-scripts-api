import { Router } from 'express';

import authRoutes from './auth.routes.js';
import referenceScriptsRoutes from './referenceScripts.routes.js';
import photosRoutes from './photos.routes.js';
import solfaScriptsRoutes from './solfaScripts.routes.js';
import songsRoutes from './songs.routes.js';
import usersRoutes from './users.routes.js';

const router = Router({ mergeParams: true });

router.use('/auth', authRoutes);
router.use('/reference-scripts', referenceScriptsRoutes);
router.use('/photos', photosRoutes);
router.use('/solfa-scripts', solfaScriptsRoutes);
router.use('/songs', songsRoutes);
router.use('/users', usersRoutes);

export default router;
