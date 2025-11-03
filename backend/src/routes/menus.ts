import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createMenu, getMenuById } from '../controller/menuController.js';

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
router.get('/getMenuById/:id', authenticate, getMenuById); 


// POST /api/menus - Create menu
router.post('/cerateMenu', authenticate, createMenu);

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

    // Validate header and footer structure if provided
    if (req.body.header && typeof req.body.header !== 'object') {
      throw new ApiError('Header must be an object with html, css, and js properties', 400);
    }

    if (req.body.footer && typeof req.body.footer !== 'object') {
      throw new ApiError('Footer must be an object with html, css, and js properties', 400);
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(location !== undefined && { location }),
        ...(items && { items }),
        ...(req.body.header !== undefined && { header: req.body.header }),
        ...(req.body.footer !== undefined && { footer: req.body.footer }),
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
