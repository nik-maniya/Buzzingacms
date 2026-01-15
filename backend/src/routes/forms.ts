import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createForm, deleteForm, getAllForms, getFormById, updateForm } from '../controller/formController.js';

const router = Router();

// GET /api/forms - Get all forms
router.get('/getAllForms', authenticate, getAllForms)
// GET /api/forms/:id - Get single form
router.get('/getFormById/:id', authenticate, getFormById)

// POST /api/forms - Create form
router.post('/createForms', authenticate, createForm)
// PUT /api/forms/:id - Update form
router.put('/updateForms/:id', authenticate, updateForm)

// DELETE /api/forms/:id - Delete form
router.delete('/deleteForms/:id', authenticate, deleteForm)

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
