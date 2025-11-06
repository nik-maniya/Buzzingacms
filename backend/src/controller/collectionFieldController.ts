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
        
        const collectionIdInt = typeof collectionId === 'string' ? parseInt(collectionId, 10) : collectionId;
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }
        
        // Verify collection exists and belongs to user
        const collection = await prisma.collection.findUnique({
            where: { id: collectionIdInt },
        });
        
        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }

        if (collection.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only add fields to your own collections', 403);
        }
        
        const field = await prisma.field.create({
            data: {
                collectionId: collectionIdInt,
                authorId: req.user.id,
                fieldType,
                fieldLabel,
                placeholder,
                defaultValue,
                required: required || false,
                order: order ?? 0,
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

        const collectionIdInt = parseInt(collectionId, 10);
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }

        // Verify collection exists and belongs to user
        const collection = await prisma.collection.findUnique({
            where: { id: collectionIdInt },
        });

        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }

        if (collection.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only access fields from your own collections', 403);
        }

        const fields = await prisma.field.findMany({
            where: { collectionId: collectionIdInt, authorId: req.user.id },
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
        const fieldId = parseInt(id, 10);
        if (isNaN(fieldId)) {
            throw new ApiError('Invalid field ID', 400);
        }
        const existingField = await prisma.field.findUnique({
            where: { id: fieldId },
        });
        if (!existingField) {
            throw new ApiError('Field not found', 404);
        }

        if (existingField.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only update your own fields', 403);
        }

        const field = await prisma.field.update({
            where: { id: fieldId },
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
        const fieldId = parseInt(id, 10);
        if (isNaN(fieldId)) {
            throw new ApiError('Invalid field ID', 400);
        }
        const field = await prisma.field.findUnique({
            where: { id: fieldId },
        });
        if (!field) {
            throw new ApiError('Field not found', 404);
        }

        if (field.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only access your own fields', 403);
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

        const fieldId = parseInt(id, 10);
        if (isNaN(fieldId)) {
            throw new ApiError('Invalid field ID', 400);
        }

        const existingField = await prisma.field.findUnique({
            where: { id: fieldId },
        });

        if (!existingField) {
            throw new ApiError('Field not found', 404);
        }

        if (existingField.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only delete your own fields', 403);
        }

        await prisma.field.delete({
            where: { id: fieldId },
        });

        res.json({
            success: true,
            message: 'Field deleted successfully',
        });
        
    } catch (error) {
        next(error);
    }
}

export const getAllFieldName = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { collectionId } = req.params;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const collectionIdInt = parseInt(collectionId, 10);
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }

        // Verify collection exists and belongs to user
        const collection = await prisma.collection.findUnique({
            where: { id: collectionIdInt },
        });

        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }

        if (collection.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only access fields from your own collections', 403);
        }

        const fields = await prisma.field.findMany({
            where: { collectionId: collectionIdInt, authorId: req.user.id },
            select: {
                id: true,
                fieldLabel: true,
            },
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


