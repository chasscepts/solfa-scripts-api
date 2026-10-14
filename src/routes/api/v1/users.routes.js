import express from 'express';

import {
  listUsers,
  getUser,
  updateUser,
  deleteUser
} from '../../../controllers/users.controller.js';
import { authenticate, authorizeLeastAdmin } from '../../../middlewares/authenticate.js';
import validate from '../../../middlewares/validations/index.js';
import { idCheck } from '../../../middlewares/validations/common.js';
import { updateUserSchema } from '../../../middlewares/validations/users.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeLeastAdmin());

router.get('/', listUsers);
router.get('/:id', validate(idCheck, 'params'), getUser);
router.put('/:id', validate(idCheck, 'params'), validate(updateUserSchema), updateUser);
router.delete('/:id', validate(idCheck, 'params'), deleteUser);

export default router;
