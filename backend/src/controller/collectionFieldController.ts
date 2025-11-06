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

        // Convert user ID to integer for comparison
        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }
        if (existingField.authorId !== userIdInt) {
            throw new ApiError('Unauthorized - You can only delete your own fields', 403);
        }

        // Get all collection items for this collection
        const collectionItems = await prisma.collectionItem.findMany({
            where: { collectionId: existingField.collectionId },
        });

        // Remove this field's data from all collection items
        // Field data can be stored with field ID (as string) or fieldLabel as key
        const fieldIdStr = String(fieldId);
        const fieldLabel = existingField.fieldLabel;

        for (const item of collectionItems) {
            const itemData = (item.data || {}) as Record<string, any>;
            const updatedData: Record<string, any> = { ...itemData };
            
            // Remove field data by ID (e.g., "8", "9", "11")
            if (updatedData[fieldIdStr] !== undefined) {
                delete updatedData[fieldIdStr];
            }
            
            // Remove field data by fieldLabel
            if (updatedData[fieldLabel] !== undefined) {
                delete updatedData[fieldLabel];
            }
            
            // Also check for lowercase/snake_case version
            const fieldLabelLower = fieldLabel.toLowerCase().replace(/\s+/g, '_');
            if (updatedData[fieldLabelLower] !== undefined) {
                delete updatedData[fieldLabelLower];
            }

            // Update the item if data changed
            if (Object.keys(updatedData).length !== Object.keys(itemData).length) {
                await prisma.collectionItem.update({
                    where: { id: item.id },
                    data: { data: updatedData },
                });
            }
        }

        // Remove this field's placeholders from all page templates in this collection
        const pageTemplates = await prisma.pageTemplate.findMany({
            where: { 
                collectionId: existingField.collectionId,
                authorId: userIdInt,
            },
        });

        for (const template of pageTemplates) {
            let updatedHtml = template.htmlContent;
            const fieldLabel = existingField.fieldLabel;
            const fieldLabelLower = fieldLabel.toLowerCase().replace(/\s+/g, '_');
            
            // Remove placeholders: {{fieldLabel}} and {{field_label}}
            const placeholderExact = `{{${fieldLabel}}}`;
            const placeholderLower = `{{${fieldLabelLower}}}`;
            
            // Escape special regex characters
            const escapedExact = placeholderExact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedLower = placeholderLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Remove all occurrences of both placeholder formats
            updatedHtml = updatedHtml.replace(new RegExp(escapedExact, 'g'), '');
            updatedHtml = updatedHtml.replace(new RegExp(escapedLower, 'g'), '');
            
            // Update template if HTML changed
            if (updatedHtml !== template.htmlContent) {
                await prisma.pageTemplate.update({
                    where: { id: template.id },
                    data: { htmlContent: updatedHtml },
                });
            }
        }

        // Now delete the field
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


