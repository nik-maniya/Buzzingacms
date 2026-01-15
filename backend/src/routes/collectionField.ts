import { Router } from 'express';
import { createCollectionField, deleteCollectionField, getAllCollectionFields, getAllFieldName, getCollectionFieldById, updateCollectionField } from '../controller/collectionFieldController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/collection-fields - Get all collection fields
router.get('/getAllCollectionFields/:collectionId', authenticate, getAllCollectionFields)

// POST /api/collection-fields - Create collection field
router.post('/createCollectionField', authenticate, createCollectionField)

// PUT /api/collection-fields/:id - Update collection field
router.put('/updateCollectionField/:id', authenticate, updateCollectionField)

// GET /api/collection-fields/:id - Get collection field by id
router.get('/getCollectionFieldById/:id', authenticate, getCollectionFieldById)

// DELETE /api/collection-fields/:id - Delete collection field
router.delete('/deleteCollectionField/:id', authenticate, deleteCollectionField)

// GET /api/collection-fields/getAllFieldNameCollectionWise/:collectionId - Get all field names collection wise
router.get('/getAllFieldName/:collectionId', authenticate, getAllFieldName)


export default router;