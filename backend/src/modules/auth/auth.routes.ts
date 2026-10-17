import { Router } from 'express';
import { login, getMe } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), login);
router.get('/me', authenticate, getMe);

export { router as authRouter };
