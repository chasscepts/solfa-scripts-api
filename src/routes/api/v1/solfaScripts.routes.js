import { Router } from 'express';

import {
  createScript,
  listScripts,
  getScript,
  updateScript,
  deleteScript,
} from '../../../controllers/solfaScripts.controller.js';
import { authenticate, authorizeLeastComposer } from '../../../middlewares/authenticate.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeLeastComposer());

router.post('/', createScript);
router.get('/', listScripts);
router.get('/:id', getScript);
router.put('/:id', updateScript);
router.delete('/:id', deleteScript);

export default router;
