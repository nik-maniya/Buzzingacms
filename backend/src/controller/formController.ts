import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const createForm = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, slug, description, fields, settings } = req.body;

        if (!req.user) throw new ApiError("User not authenticated", 401);
        if (!name || !slug) throw new ApiError("Name and slug are required", 400);

        // Ensure slug uniqueness per user (author)
        const exists = await prisma.form.findFirst({ where: { slug, authorId: req.user.id } });
        if (exists) throw new ApiError("A form with this slug already exists for this user", 400);

        const form = await prisma.form.create({
            data: {
                name,
                slug,
                description: description || null,
                fields: Array.isArray(fields) ? fields : (fields ?? []),
                settings: settings ?? {},
                authorId: req.user.id,
            },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });

        res.status(201).json({ success: true, message: "Form created successfully", data: form });
    } catch (err) {
        next(err);
    }
}

export const updateForm = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, slug, description, fields, settings } = req.body;

        const existingForm = await prisma.form.findUnique({ where: { id } });
        if (!existingForm) {
            throw new ApiError("Form not found", 404);
        }

        // If slug is being changed, ensure uniqueness
        if (slug && slug !== existingForm.slug) {
            const slugExists = await prisma.form.findUnique({ where: { slug } });
            if (slugExists) {
                throw new ApiError("A form with this slug already exists", 400);
            }
        }

        const form = await prisma.form.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(description !== undefined && { description }),
                ...(fields !== undefined && { fields }),
                ...(settings !== undefined && { settings }),
            },
        });

        res.json({
            success: true,
            message: "Form updated successfully",
            data: form,
        });
    }
    catch (error) {
        next(error);
    }
}

export const deleteForm = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
}

export const getAllForms = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const forms = await prisma.form.findMany({
            where: { authorId: req.user.id },
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
}

export const getFormById = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
}