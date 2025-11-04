import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createCollection, deleteCollection, getAllCollections, getCollectionById, updateCollection } from '../controller/collectionController.js';

const router = Router();

// GET /api/collections - Get all collections
router.get('/getAll', authenticate, getAllCollections)

// GET /api/collections/:id - Get single collection
router.get('/getCollectionById/:id', authenticate, getCollectionById)
  

// POST /api/collections - Create collection
router.post('/create', authenticate, createCollection)

// PUT /api/collections/:id - Update collection
router.put('/updateCollection/:id', authenticate, updateCollection)

// DELETE /api/collections/:id - Delete collection
router.delete('/deleteCollection/:id', authenticate, deleteCollection)

// POST /api/collections/:id/items - Create collection item
router.post('/:id/items', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { data, status } = req.body;

    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new ApiError('Collection not found', 404);
    }

    const item = await prisma.collectionItem.create({
      data: {
        collectionId: id,
        data: data || {},
        status: status || 'draft',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Collection item created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

export default router;