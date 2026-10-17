import { Router } from 'express';

import {
  createScore,
  listScores,
  getScore,
  updateScore,
  deleteScore,
} from '../../../controllers/scores.controller.js';
import { authenticate, authorizeLeastComposer } from '../../../middlewares/authenticate.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeLeastComposer());

router.post('/', createScore);
router.get('/', listScores);
router.get('/:id', getScore);
router.put('/:id', updateScore);
router.delete('/:id', deleteScore);

export default router;
