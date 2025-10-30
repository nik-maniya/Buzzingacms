import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/forms - Get all forms
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const forms = await prisma.form.findMany({
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
            responses: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: forms,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/forms/:id - Get single form
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const form = await prisma.form.findUnique({
      where: { id },
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
            responses: true,
          },
        },
      },
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    res.json({
      success: true,
      data: form,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/forms - Create form
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, fields, settings } = req.body;

    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Check if slug already exists
    const existingForm = await prisma.form.findUnique({
      where: { slug },
    });

    if (existingForm) {
      throw new ApiError('A form with this slug already exists', 400);
    }

    const form = await prisma.form.create({
      data: {
        name,
        slug,
        description,
        fields: fields || [],
        settings: settings || {},
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
      message: 'Form created successfully',
      data: form,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/forms/:id - Update form
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, description, fields, settings } = req.body;

    const existingForm = await prisma.form.findUnique({
      where: { id },
    });

    if (!existingForm) {
      throw new ApiError('Form not found', 404);
    }

    // If slug is being changed, check if new slug exists
    if (slug && slug !== existingForm.slug) {
      const slugExists = await prisma.form.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new ApiError('A form with this slug already exists', 400);
      }
    }

    const form = await prisma.form.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(fields && { fields }),
        ...(settings && { settings }),
      },
    });

    res.json({
      success: true,
      message: 'Form updated successfully',
      data: form,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/forms/:id - Delete form
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingForm = await prisma.form.findUnique({
      where: { id },
    });

    if (!existingForm) {
      throw new ApiError('Form not found', 404);
    }

    await prisma.form.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Form deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/forms/:id/responses - Get form responses
router.get('/:id/responses', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const form = await prisma.form.findUnique({
      where: { id },
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    const [responses, total] = await Promise.all([
      prisma.formResponse.findMany({
        where: { formId: id },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.formResponse.count({
        where: { formId: id },
      }),
    ]);

    res.json({
      success: true,
      data: responses,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/forms/:id/responses - Submit form response (public endpoint)
router.post('/:id/responses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const responseData = req.body;

    const form = await prisma.form.findUnique({
      where: { id },
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    const response = await prisma.formResponse.create({
      data: {
        formId: id,
        data: responseData,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Form response submitted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
