import { Router } from 'express';
import { createDNSRecord, deleteDNSRecord, getDomain, updateDNSRecord, upsertDomain } from '../controller/domainController';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/domain - Upsert domain
router.post('/upsertDomain', authenticate, upsertDomain);

// GET /api/domain - Get domain
router.get('/getDomain', authenticate, getDomain);

// POST /api/domain/createDNSRecord - Create DNS record
router.post('/createDNSRecord', authenticate, createDNSRecord);

// POST /api/domain/updateDNSRecord - Update DNS record
router.put('/updateDNSRecord/:id', authenticate, updateDNSRecord);

// DELETE /api/domain/deleteDNSRecord - Delete DNS record
router.delete('/deleteDNSRecord/:id', authenticate, deleteDNSRecord);

export default router;
