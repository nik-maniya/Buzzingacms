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

        let message = '';

        if (existingUserDomain) {
            if (existingDomainByName) {
                if (existingDomainByName.authorId !== userId) {
                    throw new ApiError('This domain is already registered by another user', 400);
                }
                message = 'Domain updated successfully';
            } else {
                await prisma.$executeRaw`
                    UPDATE domains 
                    SET "domainName" = ${domainName}, "updatedAt" = NOW()
                    WHERE id = ${existingUserDomain.id}
                `;

                const domain = await prisma.domain.findUnique({
                    where: { id: existingUserDomain.id },
                    include: {
                        dnsRecords: true,
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
                    message: 'Domain updated successfully',
                    data: domain,
                });
                return;
            }
        } else {
            if (existingDomainByName) {
                throw new ApiError('This domain is already registered by another user', 400);
            }
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
                        createdAt: 'asc',
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

export const updateDNSRecord = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { type, name, value, ttl } = req.body;

        const recordId = parseInt(id, 10);
        if (isNaN(recordId)) {
            throw new ApiError('Invalid record ID', 400);
        }

        const existingRecord = await prisma.dnsRecord.findUnique({
            where: { id: recordId },
        });

        if (!existingRecord) {
            throw new ApiError('DNS record not found', 404);
        }

        if (ttl !==undefined && (ttl < 60 || ttl > 86400)) {
            throw new ApiError('TTL must be between 60 and 86400 seconds', 400);
        }

        const updatedRecord = await prisma.dnsRecord.update({
            where: { id: recordId },
            data: {
                ...(type && { type: type as any }),
                ...(name !== undefined && { name }),
                ...(value !== undefined && { value }),
                ...(ttl !== undefined && { ttl }),
            },
            include: {
                domain: true,
            }
        });

        res.json({
            success: true,
            message: 'DNS record updated successfully',
            data: updatedRecord,
        });
    } catch (error: any) {
        console.error('Error updating DNS record:', error);
        next(error);
    }
}

export const deleteDNSRecord = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const recordId = parseInt(id, 10);
        if (isNaN(recordId)) {
            throw new ApiError('Invalid record ID', 400);
        }

        const existingRecord = await prisma.dnsRecord.findUnique({
            where: { id: recordId },
        });

        if (!existingRecord) {
            throw new ApiError('DNS record not found', 404);
        }

        await prisma.dnsRecord.delete({
            where: { id: recordId },
        });

        res.json({
            success: true,
            message: 'DNS record deleted successfully',
        });
        
    } catch (error: any) {
        console.error('Error deleting DNS record:', error);
        next(error);
    }
}