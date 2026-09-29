import { Router } from 'express';

import config from '../config/index.js';
import apiRoutes from './api/index.js';

const router = Router({ mergeParams: true });

router.use('/api', apiRoutes);

if (config.emails.previewEnabled) {
  router.use('/previews', (await import('../previews/routes.js')).default);
}

export default router;
