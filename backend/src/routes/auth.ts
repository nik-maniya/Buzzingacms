import { Router } from 'express';

import { login, me, register } from '../controller/authController.js';

const router = Router();

// POST /api/auth/register
router.post('/register', register); 

// POST /api/auth/login
router.post('/login', login) ;

// GET /api/auth/me - Get current user
router.get('/me', me) 
  
export default router;
