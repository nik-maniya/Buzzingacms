import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/pages - Get all pages
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pages = await prisma.page.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    next(error);
  }
});

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
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, slug, content, status, description, keywords, ogImage } = req.body;

    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug },
    });

    if (existingPage) {
      throw new ApiError('A page with this slug already exists', 400);
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content: content || {},
        status: status || 'DRAFT',
        description,
        keywords: keywords || [],
        ogImage,
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
      message: 'Page created successfully',
      data: page,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/pages/:id - Update page
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, slug, content, status, description, keywords, ogImage } = req.body;

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
    });

    if (!existingPage) {
      throw new ApiError('Page not found', 404);
    }

    // If slug is being changed, check if new slug exists
    if (slug && slug !== existingPage.slug) {
      const slugExists = await prisma.page.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new ApiError('A page with this slug already exists', 400);
      }
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(content && { content }),
        ...(status && { status }),
        ...(description !== undefined && { description }),
        ...(keywords && { keywords }),
        ...(ogImage !== undefined && { ogImage }),
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

    res.json({
      success: true,
      message: 'Page updated successfully',
      data: page,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pages/:id - Delete page
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
    });

    if (!existingPage) {
      throw new ApiError('Page not found', 404);
    }

    await prisma.page.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
