import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const createPageTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try{
        const { collectionId, htmlContent, customCss, customJs } = req.body;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        
        // Convert user ID from string to integer
        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
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
        
        if (collection.authorId !== userIdInt) {
            throw new ApiError('Unauthorized - You can only create templates for your own collections', 403);
        }
        
        const template = await prisma.pageTemplate.create({
            data: {
                collectionId: collectionIdInt,
                htmlContent,
                customCss,
                customJs,
                authorId: userIdInt,
            },
        });
        res.json({
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

        // Convert user ID from string to integer
        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        const collectionIdInt = parseInt(collectionId, 10);
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }

        const templates = await prisma.pageTemplate.findMany({
            where: {
                collectionId: collectionIdInt,
                collection: { authorId: userIdInt },
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

        // Convert user ID from string to integer
        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        if (template.authorId !== userIdInt) {
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
        const { name, description, htmlContent, customCss, customJs } = req.body;

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

        // Convert user ID from string to integer
        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        if (existingTemplate.authorId !== userIdInt) {
            throw new ApiError('Unauthorized - You can only access your own page templates', 403);
        }

        const template = await prisma.pageTemplate.update({
            where: { id: templateId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(htmlContent !== undefined && { htmlContent }),
                ...(customCss !== undefined && { customCss }),
                ...(customJs !== undefined && { customJs }),
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

        // Convert user ID from string to integer
        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        if (existingTemplate.authorId !== userIdInt) {
            throw new ApiError('Unauthorized - You can only access your own page templates', 403);
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

        // Convert user ID from string to integer
        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        if (template.authorId !== userIdInt) {
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

        if (item.collection.authorId !== userIdInt) {
            throw new ApiError('Unauthorized - You can only access items from your own collections', 403);
        }

        // Verify template and item belong to same collection
        if (template.collectionId !== item.collectionId) {
            throw new ApiError('Template and item do not belong to the same collection', 400);
        }

        // Get field labels for reference
        const fields = await prisma.field.findMany({
            where: { collectionId: template.collectionId },
            select: { id: true, fieldLabel: true },
        });

        // Render template: replace {{fieldLabel}} with actual values from item.data
        let renderedHtml = template.htmlContent;
        const fieldValues = item.data as Record<string, any>;

        // Replace all field placeholders with actual values
        fields.forEach((field) => {
            const label = field.fieldLabel;
            const labelLower = label.toLowerCase().replace(/\s+/g, '_');

            const placeholderExact = `{{${label}}}`;
            const placeholderLower = `{{${labelLower}}}`;

            const escapedExact = placeholderExact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedLower = placeholderLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            let value: any = undefined;
            if (fieldValues[label] !== undefined) value = fieldValues[label];
            if (value === undefined && fieldValues[labelLower] !== undefined) value = fieldValues[labelLower];
            if (value === undefined && fieldValues[String(field.id)] !== undefined) value = fieldValues[String(field.id)];
            if (value === undefined) {
                const matchKey = Object.keys(fieldValues).find(
                    (k) => k.toLowerCase().replace(/\s+/g, '_') === labelLower
                );
                if (matchKey) value = fieldValues[matchKey];
            }

            const replaceWith = String(value ?? '');
            renderedHtml = renderedHtml.replace(new RegExp(escapedExact, 'g'), replaceWith);
            renderedHtml = renderedHtml.replace(new RegExp(escapedLower, 'g'), replaceWith);
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

export const renderCollectionItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { collectionId } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        const collectionIdInt = parseInt(collectionId, 10);
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }

        // Verify collection belongs to the user
        const collection = await prisma.collection.findUnique({ where: { id: collectionIdInt } });
        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }
        if (collection.authorId !== userIdInt) {
            throw new ApiError('Unauthorized - You can only access your own collections', 403);
        }

        // Get latest template for this collection
        const template = await prisma.pageTemplate.findFirst({
            where: { collectionId: collectionIdInt, authorId: userIdInt },
            orderBy: { updatedAt: 'desc' },
        });
        if (!template) {
            return res.json({ success: true, data: [] });
        }

        // Get all items for this collection
        const items = await prisma.collectionItem.findMany({
            where: { collectionId: collectionIdInt },
        });

        // Get field labels for mapping
        const fields = await prisma.field.findMany({
            where: { collectionId: collectionIdInt },
            select: { id: true, fieldLabel: true },
        });

        const results = items.map((item) => {
            let renderedHtml = template.htmlContent;
            const fieldValues = item.data as Record<string, any>;

            // Replace placeholders using flexible matching (label, lower_snake_case, and numeric field id)
            fields.forEach((field) => {
                const label = field.fieldLabel;
                const labelLower = label.toLowerCase().replace(/\s+/g, '_');

                const placeholderExact = `{{${label}}}`;
                const placeholderLower = `{{${labelLower}}}`;

                const escapedExact = placeholderExact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const escapedLower = placeholderLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // Possible keys in data: exact label, lower_snake_case, numeric field id as string, case-insensitive match
                let value: any = undefined;
                if (fieldValues[label] !== undefined) value = fieldValues[label];
                if (value === undefined && fieldValues[labelLower] !== undefined) value = fieldValues[labelLower];
                if (value === undefined && fieldValues[String((field as any).id)] !== undefined) value = fieldValues[String((field as any).id)];
                if (value === undefined) {
                    const matchKey = Object.keys(fieldValues).find(
                        (k) => k.toLowerCase().replace(/\s+/g, '_') === labelLower
                    );
                    if (matchKey) value = fieldValues[matchKey];
                }

                const replaceWith = String(value ?? '');
                // Replace both variants
                renderedHtml = renderedHtml.replace(new RegExp(escapedExact, 'g'), replaceWith);
                renderedHtml = renderedHtml.replace(new RegExp(escapedLower, 'g'), replaceWith);
            });

            return {
                itemId: item.id,
                data: item.data,
                htmlContent: renderedHtml,
            };
        });

        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

export const renderCollectionItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { collectionId, itemId } = req.params;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        const collectionIdInt = parseInt(collectionId, 10);
        const itemIdInt = parseInt(itemId, 10);
        if (isNaN(collectionIdInt)) {
            throw new ApiError('Invalid collection ID', 400);
        }
        if (isNaN(itemIdInt)) {
            throw new ApiError('Invalid item ID', 400);
        }

        // Verify collection belongs to the user
        const collection = await prisma.collection.findUnique({ where: { id: collectionIdInt } });
        if (!collection) {
            throw new ApiError('Collection not found', 404);
        }
        if (collection.authorId !== userIdInt) {
            throw new ApiError('Unauthorized - You can only access your own collections', 403);
        }

        // Get latest template for this collection
        const template = await prisma.pageTemplate.findFirst({
            where: { collectionId: collectionIdInt, authorId: userIdInt },
            orderBy: { updatedAt: 'desc' },
        });
        if (!template) {
            throw new ApiError('No template found for this collection', 404);
        }

        // Get the item
        const item = await prisma.collectionItem.findUnique({
            where: { id: itemIdInt },
        });
        if (!item || item.collectionId !== collectionIdInt) {
            throw new ApiError('Collection item not found', 404);
        }

        // Get field labels for mapping
        const fields = await prisma.field.findMany({
            where: { collectionId: collectionIdInt },
            select: { id: true, fieldLabel: true },
        });

        // Render
        let renderedHtml = template.htmlContent;
        const fieldValues = item.data as Record<string, any>;
        fields.forEach((field) => {
            const label = field.fieldLabel;
            const labelLower = label.toLowerCase().replace(/\s+/g, '_');

            const placeholderExact = `{{${label}}}`;
            const placeholderLower = `{{${labelLower}}}`;

            const escapedExact = placeholderExact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedLower = placeholderLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            let value: any = undefined;
            if (fieldValues[label] !== undefined) value = fieldValues[label];
            if (value === undefined && fieldValues[labelLower] !== undefined) value = fieldValues[labelLower];
            if (value === undefined && fieldValues[String((field as any).id)] !== undefined) value = fieldValues[String((field as any).id)];
            if (value === undefined) {
                const matchKey = Object.keys(fieldValues).find(
                    (k) => k.toLowerCase().replace(/\s+/g, '_') === labelLower
                );
                if (matchKey) value = fieldValues[matchKey];
            }

            const replaceWith = String(value ?? '');
            renderedHtml = renderedHtml.replace(new RegExp(escapedExact, 'g'), replaceWith);
            renderedHtml = renderedHtml.replace(new RegExp(escapedLower, 'g'), replaceWith);
        });

        res.json({
            success: true,
            data: {
                itemId: item.id,
                data: item.data,
                htmlContent: renderedHtml,
            },
        });
    } catch (error) {
        next(error);
    }
};