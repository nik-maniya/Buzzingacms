import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createPage, deletePage, getAllPages, updatePage } from '../controller/pagesController.js';

const router = Router();

// GET /api/pages - Get all pages
router.get('/', authenticate, getAllPages) 

// GET /api/pages/:id - Get single page
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const page = await prisma.page.findUnique({
      where: { id },
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

    if (!page) {
      throw new ApiError('Page not found', 404);
    }

    res.json({
      success: true,
      data: page,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/pages - Create new page
router.post('/', authenticate, createPage)
  

// PUT /api/pages/:id - Update page
router.put('/:id', authenticate, updatePage)
  

// DELETE /api/pages/:id - Delete page
router.delete('/:id', authenticate, deletePage)

export default router;
