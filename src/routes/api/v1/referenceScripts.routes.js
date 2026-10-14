import { Router } from 'express';

import {
  listScripts,
  createScript,
  claimEdit,
  updateScript,
  deleteScript
} from '../../../controllers/referenceScripts.controller.js';
import {
  authenticate,
  authorizeLeastComposer,
  authorizeLeastAdmin,
} from '../../../middlewares/authenticate.js';
import validate from '../../../middlewares/validations/index.js';
import {
  referenceScriptSchema,
  updateReferenceScriptSchema,
} from '../../../middlewares/validations/referenceScript.js';
import { idCheck } from '../../../middlewares/validations/common.js';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorizeLeastComposer(), listScripts);
router.post('/', authenticate, validate(referenceScriptSchema), createScript);
router.post('/:id/claim-edit', validate(idCheck, 'params'), authenticate, authorizeLeastComposer(), claimEdit);
router.put('/:id', validate(idCheck, 'params'), authenticate, authorizeLeastComposer(), validate(updateReferenceScriptSchema), updateScript);
router.delete('/:id', validate(idCheck, 'params'), authenticate, authorizeLeastAdmin(), deleteScript);

export default router;
