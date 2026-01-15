import { Router } from 'express';
import { createCollectionItem, deleteCollectionItem, getAllCollectionItems, getCollectionItemById, updateCollectionItem } from '../controller/collectionItemsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/collection-items - Get all collection items
router.get('/getAllCollectionItems/:collectionId', authenticate, getAllCollectionItems)

// POST /api/collection-items - Create collection item
router.post('/createCollectionItem', authenticate, createCollectionItem)

// PUT /api/collection-items/:id - Update collection item
router.put('/updateCollectionItem/:id', authenticate, updateCollectionItem)

// GET /api/collection-items/:id - Get collection item by id
router.get('/getCollectionItemById/:id', authenticate, getCollectionItemById)

// DELETE /api/collection-items/:id - Delete collection item
router.delete('/deleteCollectionItem/:id', authenticate, deleteCollectionItem)

export default router;