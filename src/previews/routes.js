import express from 'express';

import { previewEmail } from './controller.js';

const router = express.Router({ mergeParams: true });

router.get('/emails', previewEmail);

export default router;
