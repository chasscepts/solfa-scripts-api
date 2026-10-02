import { Router } from 'express';

import {
  listScripts,
  createScript,
  claimEdit,
  updateScript,
  deleteScript
} from '../../../controllers/externalScripts.controller.js';
import {
  authenticate,
  authorizeLeastComposer,
  authorizeLeastAdmin,
} from '../../../middlewares/authenticate.js';
import validate from '../../../middlewares/validations/index.js';
import {
  externalScriptSchema,
  updateExternalScriptSchema,
} from '../../../middlewares/validations/externalScript.js';
import { idCheck } from '../../../middlewares/validations/common.js';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorizeLeastComposer(), listScripts);
router.post('/', authenticate, validate(externalScriptSchema), createScript);
router.post('/:id/claim-edit', validate(idCheck, 'params'), authenticate, authorizeLeastComposer(), claimEdit);
router.put('/:id', validate(idCheck, 'params'), authenticate, authorizeLeastComposer(), validate(updateExternalScriptSchema), updateScript);
router.delete('/:id', validate(idCheck, 'params'), authenticate, authorizeLeastAdmin(), deleteScript);

export default router;
