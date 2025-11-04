import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const createCollectionField = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { collectionId, fieldType, fieldLabel, placeholder, defaultValue, required, order } = req.body;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const existingField = await prisma.field.findFirst({
            where: {
                collectionId,
                authorId: req.user.id,
            },
        });
        if (existingField) {
            throw new ApiError('A field with this collectionId already exists', 400);
        }
        const field = await prisma.field.create({
            data: {
                collectionId,
                fieldType,
                fieldLabel,
                placeholder,
                defaultValue,
                required,
                order,
            },
        });
        res.json({
            success: true,
            message: 'Field created successfully',
            data: field,
        });
    } catch (error) {
        next(error);
    }
}

export const getAllCollectionFields = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { collectionId } = req.params;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const fields = await prisma.field.findMany({
            where: { collectionId, authorId: req.user.id },
        });
        res.json({
            success: true,
            data: fields,
        });
    }
    catch (error) {
        next(error);
    }
}

export const updateCollectionField = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { fieldType, fieldLabel, placeholder, defaultValue, required, order } = req.body;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const existingField = await prisma.field.findUnique({
            where: { id },
        });
        if (!existingField) {
            throw new ApiError('Field not found', 404);
        }
        const field = await prisma.field.update({
            where: { id },
            data: {
                ...(fieldType && { fieldType }),
                ...(fieldLabel && { fieldLabel }),
                ...(placeholder && { placeholder }),
                ...(defaultValue && { defaultValue }),
                ...(required && { required }),
                ...(order && { order }),
            },
        });
        res.json({
            success: true,
            message: 'Field updated successfully',
            data: field,
        });
    }
    catch (error) {
        next(error);
    }
}

export const getCollectionFieldById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const field = await prisma.field.findUnique({
            where: { id },
        });
        if (!field) {
            throw new ApiError('Field not found', 404);
        }
        res.json({
            success: true,
            data: field,
        });
    }
    catch (error) {
        next(error);
    }
}

export const deleteCollectionField = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const existingField = await prisma.field.findUnique({
            where: { id },
        });

        if (!existingField) {
            throw new ApiError('Field not found', 404);
        }
        await prisma.field.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Field deleted successfully',
        });
        
    } catch (error) {
        next(error);
    }
}


