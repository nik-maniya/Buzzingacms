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
        const collection = await prisma.collection.findUnique({
            where: { id: collectionId },
        });
        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }
        const item = await prisma.collectionItem.create({
            data: {
                collectionId,
                data,
                status,
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
        const items = await prisma.collectionItem.findMany({
            where: {
                collectionId,
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
        // Authorize: only allow update if the item's collection belongs to the logged-in user
        const existing = await prisma.collectionItem.findUnique({
            where: { id },
            include: { collection: true },
        });
        if (!existing) {
            throw new ApiError('Collection item not found', 404);
        }
        if (existing.collection.authorId !== req.user.id) {
            throw new ApiError('Forbidden', 403);
        }
        const item = await prisma.collectionItem.update({
            where: { id },
            data: { data, status },
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
        const item = await prisma.collectionItem.findUnique({
            where: { id },
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
        const item = await prisma.collectionItem.findUnique({
            where: { id },
            include: { collection: true },
        });
        if (!item) {
            throw new ApiError('Collection item not found', 404);
        }
        if (item.collection.authorId !== req.user.id) {
            throw new ApiError('Forbidden', 403);
        }
        await prisma.collectionItem.delete({
            where: { id },
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