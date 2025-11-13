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

        const userId = parseInt(req.user.id);

        const existingUserDomain = await prisma.domain.findFirst({
            where: {
                authorId: userId,
            },
        });

        const existingDomainByName = await prisma.domain.findUnique({
            where: { domainName },
        });

        let isUpdate = false;
        let message = '';

        if (existingDomainByName) {
            if (existingDomainByName.authorId !== userId) {
                throw new ApiError('This domain is already registered by another user', 400);
            }
            isUpdate = true;
            message = 'Domain updated successfully';
        } else {
            if (existingUserDomain) {
                throw new ApiError('You already have a domain. Each user can only have one main domain.', 400);
            }
            isUpdate = false;
            message = 'Domain added successfully';
        }

        const domain = await prisma.domain.upsert({
            where: { domainName },
            update: {
                domainName,
                updatedAt: new Date(),
            },
            create: {
                domainName,
                authorId: userId,
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
            message: message,
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

export const createDNSRecord = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { domainId, type, name, value, ttl } = req.body;

        if (!domainId || !type || !name || !value) {
            throw new ApiError('All fields are required', 400);
        }

        const validTypes = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV'];
        if (!validTypes.includes(type)) {
            throw new ApiError('Invalid DNS record type', 400);
        }

        const ttlValue = ttl || 3600;
        if (ttlValue < 60 || ttlValue > 86400) {
            throw new ApiError('TTL must be between 60 and 86400 seconds', 400);
        }

        const domain = await prisma.domain.findUnique({
            where: { id: parseInt(domainId, 10) },
        });

        if (!domain) {
            throw new ApiError('Domain not found', 404);
        }

        const dnsRecord = await prisma.dnsRecord.create({
            data: {
                domainId: parseInt(domainId, 10),
                type: type as any,
                name,
                value,
                ttl: ttlValue,
                status: 'ACTIVE',
            },
            include: {
                domain: true,
            }
        });

        res.status(201).json({
            success: true,
            message: 'DNS record created successfully',
            data: dnsRecord,
        });
    } catch (error: any) {
        console.error('Error creating DNS record:', error);
        next(error);
    }
}