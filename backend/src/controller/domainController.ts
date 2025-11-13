import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

export const upsertDomain = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        if (req.user.role !== 'ADMIN') {
            throw new ApiError('You do not have permission to perform this action. Only administrators can manage domains.', 403);
        }

        const { domainName } = req.body;

        if (!domainName) {
            throw new ApiError('Domain name is required', 400);
        }

        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
        if (!domainRegex.test(domainName)) {
            throw new ApiError('Invalid domain name', 400);
        }

        const domain = await prisma.domain.upsert({
            where: { domainName },
            update: {
                domainName,
                // Only update authorId if it's not already set (for existing domains)
            },
            create: {
                domainName,
                authorId: parseInt(req.user.id),
                sslActive: false,
                verified: false,
            },
            include: {
                dnsRecords: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            }
        });

        res.json({
            success: true,
            message: 'Domain upserted successfully',
            data: domain,
        });
    } catch (error: any) {
        console.error('Error upserting domain:', error);
        if (error.code === 'P2002') {
            throw new ApiError('Domain already exists', 400);
        }
        next(error);
    }
}

export const getDomain = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const domain = await prisma.domain.findFirst({
            where: {
                authorId: parseInt(req.user.id),
            },
            include: {
                dnsRecords: {
                    orderBy: {
                        createdAt: 'desc',
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

        if (!domain) {
            res.json({
                success: true,
                data: null,
            });
            return;
        }

        res.json({
            success: true,
            data: domain,
        });
    } catch (error) {
        next(error);
    }
}