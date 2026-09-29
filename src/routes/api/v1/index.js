import { Router } from 'express';

import authRoutes from './auth.routes.js';
import solfaScriptsRoutes from './solfaScripts.routes.js';

const router = Router({ mergeParams: true });

router.use('/auth', authRoutes);
router.use('/solfa-scripts', solfaScriptsRoutes);

export default router;
