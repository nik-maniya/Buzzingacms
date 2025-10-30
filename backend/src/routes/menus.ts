import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/menus - Get all menus
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const menus = await prisma.menu.findMany({
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
      data: menus,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/menus/:id - Get single menu
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const menu = await prisma.menu.findUnique({
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

    if (!menu) {
      throw new ApiError('Menu not found', 404);
    }

    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/menus - Create menu
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, slug, location, items } = req.body;

    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Check if slug already exists
    const existingMenu = await prisma.menu.findUnique({
      where: { slug },
    });

    if (existingMenu) {
      throw new ApiError('A menu with this slug already exists', 400);
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        slug,
        location,
        items: items || [],
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
      message: 'Menu created successfully',
      data: menu,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/menus/:id - Update menu
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, location, items } = req.body;

    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new ApiError('Menu not found', 404);
    }

    // If slug is being changed, check if new slug exists
    if (slug && slug !== existingMenu.slug) {
      const slugExists = await prisma.menu.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new ApiError('A menu with this slug already exists', 400);
      }
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(location !== undefined && { location }),
        ...(items && { items }),
      },
    });

    res.json({
      success: true,
      message: 'Menu updated successfully',
      data: menu,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/menus/:id - Delete menu
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new ApiError('Menu not found', 404);
    }

    await prisma.menu.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Menu deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
