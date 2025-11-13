import { Router } from 'express';
import { createDNSRecord, getDomain, upsertDomain } from '../controller/domainController';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/domain - Upsert domain
router.post('/upsertDomain', authenticate, upsertDomain);

// GET /api/domain - Get domain
router.get('/getDomain', authenticate, getDomain);

// POST /api/domain/createDNSRecord - Create DNS record
router.post('/createDNSRecord', authenticate, createDNSRecord);

export default router;
