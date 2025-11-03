import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const createMenu = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, slug, location, items, header, footer } = req.body;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        // Validation
        if (!name || !slug) {
            throw new ApiError('Name and slug are required', 400);
        }

        // Check if slug already exists for this author
        const existingMenu = await prisma.menu.findFirst({
            where: {
                slug,
                authorId: req.user.id,
            },
        });

        if (existingMenu) {
            throw new ApiError('A menu with this slug already exists', 400);
        }

        // Validate header and footer structure if provided
        if (header && typeof header !== 'object') {
            throw new ApiError('Header must be an object with html, css, and js properties', 400);
        }

        if (footer && typeof footer !== 'object') {
            throw new ApiError('Footer must be an object with html, css, and js properties', 400);
        }

        const menu = await prisma.menu.create({
            data: {
                name,
                slug,
                location: location || null,
                items: items || [],
                ...(header && { header: header as any }),
                ...(footer && { footer: footer as any }),
                authorId: req.user.id,
            } as any,
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
            message: 'Menu created successfully',
            data: menu,
        });
    } catch (error) {
        next(error);
    }
};

export const getMenuById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const menu = await prisma.menu.findUnique({
            where: { id },
        });
        if (!menu) {
            throw new ApiError('Menu not found', 404);
        }
        res.json({
            success: true,
            data: menu,
        });
    }
    catch (error) {
        next(error);
    }
}

export const updateMenu = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, slug, location, items } = req.body;

        const existingMenu = await prisma.menu.findUnique({
            where: { id },
        });

        if (!existingMenu) {
            throw new ApiError('Menu not found', 404);
        }

        // If slug is being changed, check if new slug exists for the same author
        if (slug && slug !== existingMenu.slug) {
            const slugExists = await prisma.menu.findFirst({
                where: {
                    slug,
                    authorId: existingMenu.authorId,
                    NOT: { id },
                },
            });

            if (slugExists) {
                throw new ApiError('A menu with this slug already exists', 400);
            }
        }

        // Validate header and footer structure if provided
        if (req.body.header && typeof req.body.header !== 'object') {
            throw new ApiError('Header must be an object with html, css, and js properties', 400);
        }

        if (req.body.footer && typeof req.body.footer !== 'object') {
            throw new ApiError('Footer must be an object with html, css, and js properties', 400);
        }

        const menu = await prisma.menu.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(location !== undefined && { location }),
                ...(items !== undefined && { items: items || [] }),
                ...(req.body.header !== undefined && { header: (req.body.header ?? null) as any }),
                ...(req.body.footer !== undefined && { footer: (req.body.footer ?? null) as any }),
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

        res.json({
            success: true,
            message: 'Menu updated successfully',
            data: menu,
        });
    } catch (error) {
        next(error);
    }
}

export const deleteMenu = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const existingMenu = await prisma.menu.findUnique({
            where: { id },
        });

        if (!existingMenu) {
            throw new ApiError('Menu not found', 404);
        }

        await prisma.menu.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Menu deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}

export const getAllMenus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const menus = await prisma.menu.findMany({
            where: { authorId: req.user.id },
            include: {
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
            data: menus,
        });
    } catch (error) {
        next(error);
    }
}



