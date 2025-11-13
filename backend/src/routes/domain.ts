import { Router } from 'express';
import { upsertDomain } from '../controller/domainController';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/domain - Upsert domain
router.post('/upsertDomain', authenticate, upsertDomain);

export default router;
