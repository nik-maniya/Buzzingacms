import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const createPage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, slug, content, customCss, customJs, status, description, keywords, ogImage, isHomePage } = req.body;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        // Check if slug already exists
        const existingPage = await prisma.page.findUnique({
            where: { slug },
        });

        if (existingPage) {
            throw new ApiError('A page with this slug already exists', 400);
        }

        // If this page is selected as home page, unset existing home page for this user
        if (req.user && isHomePage === true) {
            await prisma.page.updateMany({
                where: { authorId: req.user.id, /* prisma generate pending */ } as any,
                data: { isHomePage: false } as any,
            } as any);
        }

        const page = await prisma.page.create({
            data: ({
                title,
                slug,
                content: content || {},
                status: status || 'DRAFT',
                description,
                keywords: keywords || [],
                ogImage,
                isHomePage: isHomePage === true,
                authorId: req.user.id,
                customCss,
                customJs,
            } as any),
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
            message: 'Page created successfully',
            data: page,
        });
    } catch (error) {
        next(error);
    }
}

export const getAllPages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }
        const pages = await prisma.page.findMany({
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
                createdAt: 'asc',
            },
        });

        res.json({
            success: true,
            data: pages,
        });
    } catch (error) {
        next(error);
    }
}

export const updatePage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { title, slug, content, customCss, customJs, status, description, keywords, ogImage, isHomePage } = req.body;

        // Check if page exists
        const existingPage = await prisma.page.findUnique({
            where: { id },
        });

        if (!existingPage) {
            throw new ApiError('Page not found', 404);
        }

        // If slug is being changed, check if new slug exists
        if (slug && slug !== existingPage.slug) {
            const slugExists = await prisma.page.findUnique({
                where: { slug },
            });

            if (slugExists) {
                throw new ApiError('A page with this slug already exists', 400);
            }
        }

        // If setting this page as home, unset others for this user
        if (req.user && isHomePage === true) {
            await prisma.page.updateMany({
                where: { authorId: req.user.id, id: { not: id } } as any,
                data: { isHomePage: false } as any,
            } as any);
        }

        const page = await prisma.page.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(slug && { slug }),
                ...(content && { content }),
                ...(customCss !== undefined && { customCss }),
                ...(customJs !== undefined && { customJs }),
                ...(status && { status }),
                ...(description !== undefined && { description }),
                ...(keywords && { keywords }),
                ...(ogImage !== undefined && { ogImage }),
                ...(isHomePage !== undefined && { isHomePage: !!isHomePage }),
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
            message: 'Page updated successfully',
            data: page,
        });
    } catch (error) {
        next(error);
    }
}

export const deletePage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Check if page exists
        const existingPage = await prisma.page.findUnique({
            where: { id },
        });

        if (!existingPage) {
            throw new ApiError('Page not found', 404);
        }

        await prisma.page.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Page deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}
