import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const createCollectionItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { collectionId, data, status } = req.body;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const collectionIdInt = typeof collectionId === 'string' ? parseInt(collectionId, 10) : collectionId;
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }
        const collection = await prisma.collection.findUnique({
            where: { id: collectionIdInt },
        });
        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }
        // Normalize status to uppercase and default to DRAFT
        const normalizedStatus = status ? status.toUpperCase() : 'DRAFT';
        const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
        const finalStatus = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'DRAFT';

        const item = await prisma.collectionItem.create({
            data: {
                collectionId: collectionIdInt,
                data,
                status: finalStatus as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
            },
            include: {
                collection: true,
            }
        });
        res.json({
            success: true,
            message: 'Collection item created successfully',
            data: item,
        });
    } catch (error) {
        next(error);
    }
}

export const getAllCollectionItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { collectionId } = req.params;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const collectionIdInt = parseInt(collectionId, 10);
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }
        const items = await prisma.collectionItem.findMany({
            where: {
                collectionId: collectionIdInt,
                collection: { authorId: req.user.id },
            },
            include: {
                collection: true,
            },
        });
        res.json({
            success: true,
            data: items,
        });
    } catch (error) {
        next(error);
    }
}

export const updateCollectionItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { data, status } = req.body;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const itemId = parseInt(id, 10);
        if (isNaN(itemId)) {
            throw new ApiError('Invalid item ID', 400);
        }
        // Authorize: only allow update if the item's collection belongs to the logged-in user
        const existing = await prisma.collectionItem.findUnique({
            where: { id: itemId },
            include: { collection: true },
        });
        if (!existing) {
            throw new ApiError('Collection item not found', 404);
        }
        // Ensure ID comparison uses numbers
        const userIdInt = parseInt(req.user.id as any, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }
        if (existing.collection.authorId !== userIdInt) {
            throw new ApiError('Forbidden', 403);
        }
        
        // Merge incoming JSON data with existing data (do not replace)
        const existingData = (existing.data || {}) as Record<string, any>;
        const incomingData = (data || {}) as Record<string, any>;
        const mergedData: Record<string, any> = { ...existingData, ...incomingData };
        
        // Merge top-level convenience fields into JSON
        if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
            mergedData.title = req.body.title;
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'slug')) {
            mergedData.slug = req.body.slug;
        }
        
        // Normalize status if provided
        const updateData: any = { data: mergedData };
        if (status) {
            const normalizedStatus = String(status).toUpperCase();
            const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
            updateData.status = validStatuses.includes(normalizedStatus) 
                ? normalizedStatus 
                : existing.status;
        }
        
        const item = await prisma.collectionItem.update({
            where: { id: itemId },
            data: updateData,
        });
        res.json({
            success: true,
            message: 'Collection item updated successfully',
            data: item,
        });
    } catch (error) {
        next(error);
    }
}

export const getCollectionItemById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const itemId = parseInt(id, 10);
        if (isNaN(itemId)) {
            throw new ApiError('Invalid item ID', 400);
        }
        const item = await prisma.collectionItem.findUnique({
            where: { id: itemId },
            include: { collection: true },
        });
        if (!item) {
            throw new ApiError('Collection item not found', 404);
        }
        if (item.collection.authorId !== req.user.id) {
            throw new ApiError('Forbidden', 403);
        }
        res.json({
            success: true,
            data: item,
        });
    } catch (error) {
        next(error);
    }
}

export const deleteCollectionItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const itemId = parseInt(id, 10);
        if (isNaN(itemId)) {
            throw new ApiError('Invalid item ID', 400);
        }
        const item = await prisma.collectionItem.findUnique({
            where: { id: itemId },
            include: { collection: true },
        });
        if (!item) {
            throw new ApiError('Collection item not found', 404);
        }
        if (item.collection.authorId !== req.user.id) {
            throw new ApiError('Forbidden', 403);
        }
        await prisma.collectionItem.delete({
            where: { id: itemId },
        });
        res.json({
            success: true,
            message: 'Collection item deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
}