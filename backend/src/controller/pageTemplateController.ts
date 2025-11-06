import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const createPageTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, description, htmlContent, collectionId } = req.body;

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
            throw new ApiError('Forbidden', 403);
        }

        const template = await prisma.pageTemplate.create({
            data: {
                name,
                description,
                htmlContent,
                collectionId: collectionIdInt,
                authorId: req.user.id,
            },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
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
            message: 'Page template created successfully',
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllPageTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { collectionId } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const collectionIdInt = parseInt(collectionId, 10);
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }

        const templates = await prisma.pageTemplate.findMany({
            where: {
                collectionId: collectionIdInt,
                collection: { authorId: req.user.id },
            },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
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
            data: templates,
        });
    } catch (error) {
        next(error);
    }
};

export const getPageTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const templateId = parseInt(id, 10);
        if (isNaN(templateId)) {
            throw new ApiError('Invalid template ID', 400);
        }

        const template = await prisma.pageTemplate.findUnique({
            where: { id: templateId },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!template) {
            throw new ApiError('Page template not found', 404);
        }

        if (template.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only access your own page templates', 403);
        }

        res.json({
            success: true,
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

export const updatePageTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description, htmlContent } = req.body;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const templateId = parseInt(id, 10);
        if (isNaN(templateId)) {
            throw new ApiError('Invalid template ID', 400);
        }

        const existingTemplate = await prisma.pageTemplate.findUnique({
            where: { id: templateId },
        });

        if (!existingTemplate) {
            throw new ApiError('Page template not found', 404);
        }

        if (existingTemplate.authorId !== req.user.id) {
            throw new ApiError('Forbidden', 403);
        }

        const template = await prisma.pageTemplate.update({
            where: { id: templateId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(htmlContent && { htmlContent }),
            },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: 'Page template updated successfully',
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

export const deletePageTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const templateId = parseInt(id, 10);
        if (isNaN(templateId)) {
            throw new ApiError('Invalid template ID', 400);
        }

        const existingTemplate = await prisma.pageTemplate.findUnique({
            where: { id: templateId },
        });

        if (!existingTemplate) {
            throw new ApiError('Page template not found', 404);
        }

        if (existingTemplate.authorId !== req.user.id) {
            throw new ApiError('Forbidden', 403);
        }

        await prisma.pageTemplate.delete({
            where: { id: templateId },
        });

        res.json({
            success: true,
            message: 'Page template deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// Render template with collection item data for preview/display
export const renderTemplateWithItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { templateId, itemId } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const templateIdInt = parseInt(templateId, 10);
        const itemIdInt = parseInt(itemId, 10);
        
        if (isNaN(templateIdInt)) {
            throw new ApiError('Invalid template ID', 400);
        }
        if (isNaN(itemIdInt)) {
            throw new ApiError('Invalid item ID', 400);
        }

        // Get template
        const template = await prisma.pageTemplate.findUnique({
            where: { id: templateIdInt },
        });

        if (!template) {
            throw new ApiError('Page template not found', 404);
        }

        if (template.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only access your own page templates', 403);
        }

        // Get collection item
        const item = await prisma.collectionItem.findUnique({
            where: { id: itemIdInt },
            include: {
                collection: true,
            },
        });

        if (!item) {
            throw new ApiError('Collection item not found', 404);
        }

        if (item.collection.authorId !== req.user.id) {
            throw new ApiError('Forbidden', 403);
        }

        // Verify template and item belong to same collection
        if (template.collectionId !== item.collectionId) {
            throw new ApiError('Template and item do not belong to the same collection', 400);
        }

        // Get field labels for reference
        const fields = await prisma.field.findMany({
            where: { collectionId: template.collectionId },
            select: { fieldLabel: true },
        });

        // Render template: replace {{fieldLabel}} with actual values from item.data
        let renderedHtml = template.htmlContent;
        const fieldValues = item.data as Record<string, any>;

        // Replace all field placeholders with actual values
        fields.forEach((field) => {
            const placeholder = `{{${field.fieldLabel}}}`;
            const value = fieldValues[field.fieldLabel] || '';
            renderedHtml = renderedHtml.replace(new RegExp(placeholder, 'g'), String(value));
        });

        res.json({
            success: true,
            data: {
                template: {
                    id: template.id,
                    name: template.name,
                    htmlContent: template.htmlContent,
                },
                item: {
                    id: item.id,
                    data: item.data,
                },
                renderedHtml,
            },
        });
    } catch (error) {
        next(error);
    }
};

