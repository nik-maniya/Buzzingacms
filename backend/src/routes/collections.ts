import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/collections - Get all collections
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: collections,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/collections/:id - Get single collection
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!collection) {
      throw new ApiError('Collection not found', 404);
    }

    res.json({
      success: true,
      data: collection,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/collections - Create collection
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, fields } = req.body;

    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Check if slug already exists
    const existingCollection = await prisma.collection.findUnique({
      where: { slug },
    });

    if (existingCollection) {
      throw new ApiError('A collection with this slug already exists', 400);
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        fields: fields || {},
        authorId: req.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: collection,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/collections/:id - Update collection
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, description, fields } = req.body;

    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      throw new ApiError('Collection not found', 404);
    }

    // If slug is being changed, check if new slug exists
    if (slug && slug !== existingCollection.slug) {
      const slugExists = await prisma.collection.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new ApiError('A collection with this slug already exists', 400);
      }
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(fields && { fields }),
      },
    });

    res.json({
      success: true,
      message: 'Collection updated successfully',
      data: collection,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      throw new ApiError('Collection not found', 404);
    }

    await prisma.collection.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

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
