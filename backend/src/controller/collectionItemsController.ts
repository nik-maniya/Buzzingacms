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
            where: { collectionId },
        });
        res.json({
            success: true,
            data: items,
            include: {
                collection: true,
                fields: true,
            },
        });
    } catch (error) {
        next(error);
    }
}

export const updateCollectionItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    
}

export const getCollectionItemById = async (req: AuthRequest, res: Response, next: NextFunction) => {

}

export const deleteCollectionItem = async (req: AuthRequest, res: Response, next: NextFunction) => {

}