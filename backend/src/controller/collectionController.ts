import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const createCollection = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, slug, description } = req.body;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        // Check if slug already exists
        const existingCollection = await prisma.collection.findFirst({
            where: {
                slug,
                authorId: req.user.id,
            },
        });

        if (existingCollection) {
            throw new ApiError('A collection with this slug already exists', 400);
        }

        const collection = await prisma.collection.create({
            data: {
                name,
                slug,
                description,
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
            message: 'Collection created successfully',
            data: collection,
        });
    } catch (error) {
        next(error);
    }
}

export const getAllCollections = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const collections = await prisma.collection.findMany({
            where: {
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
                _count: {
                    select: {
                        items: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: collections,
        });
    } catch (error) {
        next(error);
    }
}

export const getCollectionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const collectionId = parseInt(id, 10);
        if (isNaN(collectionId)) {
            throw new ApiError('Invalid collection ID', 400);
        }

        const collection = await prisma.collection.findUnique({
            where: { id: collectionId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }

        if (collection.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only access your own collections', 403);
        }

        res.json({
            success: true,
            data: collection,
        });
    } catch (error) {
        next(error);
    }
}

export const updateCollection = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, slug, description } = req.body;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const collectionId = parseInt(id, 10);
        if (isNaN(collectionId)) {
            throw new ApiError('Invalid collection ID', 400);
        }

        const existingCollection = await prisma.collection.findUnique({
            where: { id: collectionId },
        });

        if (!existingCollection) {
            throw new ApiError('Collection not found', 404);
        }

        if (existingCollection.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only update your own collections', 403);
        }

        // If slug is being changed, check if new slug exists
        if (slug && slug !== existingCollection.slug) {
            const slugExists = await prisma.collection.findFirst({
                where: {
                    slug,
                    authorId: req.user.id,
                },
            });

            if (slugExists) {
                throw new ApiError('A collection with this slug already exists', 400);
            }
        }

        const collection = await prisma.collection.update({
            where: { id: collectionId },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(description !== undefined && { description }),
            },
        });

        res.json({
            success: true,
            message: 'Collection updated successfully',
            data: collection,
        });
    } catch (error) {
        next(error);
    }
}

export const deleteCollection = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const collectionId = parseInt(id, 10);
        if (isNaN(collectionId)) {
            throw new ApiError('Invalid collection ID', 400);
        }

        const existingCollection = await prisma.collection.findUnique({
            where: { id: collectionId },
        });

        if (!existingCollection) {
            throw new ApiError('Collection not found', 404);
        }

        if (existingCollection.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only delete your own collections', 403);
        }

        await prisma.collection.delete({
            where: { id: collectionId },
        });

        res.json({
            success: true,
            message: 'Collection deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}

// Get all collections with their published items for page rendering
export const getCollectionsWithItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        // Get first 3 collections for the user with their published items
        const collections = await prisma.collection.findMany({
            where: {
                authorId: userIdInt,
            },
            include: {
                items: {
                    where: {
                        status: 'PUBLISHED',
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                fields: {
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 3, // Limit to first 3 collections
        });

        res.json({
            success: true,
            data: collections,
        });
    } catch (error) {
        next(error);
    }
}

// Get collection items by collection slug (for dynamic pages like blog)
export const getCollectionItemsBySlug = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        // Find collection by slug
        const collection = await prisma.collection.findFirst({
            where: {
                slug: slug,
                authorId: userIdInt,
            },
            include: {
                fields: {
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });

        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }

        // Get published items for this collection
        const items = await prisma.collectionItem.findMany({
            where: {
                collectionId: collection.id,
                status: 'PUBLISHED',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: {
                collection: {
                    id: collection.id,
                    name: collection.name,
                    slug: collection.slug,
                    description: collection.description,
                },
                items: items,
                fields: collection.fields,
            },
        });
    } catch (error) {
        next(error);
    }
}