import { Router } from 'express';

import authRoutes from './auth.routes.js';
import externalScriptsRoutes from './externalScripts.routes.js';
import photosRoutes from './photos.routes.js';
import solfaScriptsRoutes from './solfaScripts.routes.js';

const router = Router({ mergeParams: true });

router.use('/auth', authRoutes);
router.use('/external-scripts', externalScriptsRoutes);
router.use('/photos', photosRoutes);
router.use('/solfa-scripts', solfaScriptsRoutes);

export default router;
