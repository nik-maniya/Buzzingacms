import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { log } from 'console';

export const createPage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, slug, content, customCss, customJs, status, description, keywords, ogImage, isHomePage } = req.body;

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        // Check if slug already exists
        const existingPage = await prisma.page.findFirst({
            where: { slug, authorId: req.user.id },
        });

        if (existingPage) {
            throw new ApiError('You already have a page with this slug', 400);
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

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const pageId = parseInt(id, 10);
        let existingPage = null;

        if (!isNaN(pageId)) {
            existingPage = await prisma.page.findUnique({
                where: { id: pageId },
            });
        }

        if (!existingPage && req.user) {
            existingPage = await prisma.page.findFirst({
                where: {
                    slug: id,
                    authorId: req.user.id,
                },
            });
        }

        if (!existingPage) {
            throw new ApiError('Page not found', 404);
        }

        if (existingPage.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only update your own pages', 403);
        }

        // If slug is being changed, check if new slug exists
        if (slug && slug !== existingPage.slug) {
            const existingPage = await prisma.page.findFirst({
                where: { slug, authorId: req.user.id },
            });

            if (existingPage) {
                throw new ApiError('You already have a page with this slug', 400);
            }
        }

        if (req.user && isHomePage === true) {
            await prisma.page.updateMany({
                where: { authorId: req.user.id, id: { not: existingPage.id } } as any,
                data: { isHomePage: false } as any,
            } as any);
        }

        const page = await prisma.page.update({
            where: { id: existingPage.id },
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

        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const pageId = parseInt(id, 10);
        let page = null;

        if (!isNaN(pageId)) {
            page = await prisma.page.findUnique({
                where: { id: pageId },
            });
        }

        if (!page && req.user) {
            page = await prisma.page.findFirst({
                where: {
                    slug: id,
                    authorId: req.user.id,
                },
            });
        }

        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        if (page.authorId !== req.user.id) {
            throw new ApiError('Unauthorized - You can only delete your own pages', 403);
        }

        // Delete using the actual page ID
        await prisma.page.delete({
            where: { id: page.id },
        });

        res.json({
            success: true,
            message: 'Page deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const getPageById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            throw new ApiError('User not authenticated', 401);
        }

        const userIdInt = parseInt(req.user.id, 10);
        if (isNaN(userIdInt)) {
            throw new ApiError('Invalid user ID', 400);
        }

        let page = null;

        const pageId = parseInt(id, 10);
        if (!isNaN(pageId)) {
            page = await prisma.page.findUnique({
                where: {
                    id: pageId,
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
        }

        if (!page) {
            page = await prisma.page.findFirst({
                where: {
                    slug: id,
                    authorId: userIdInt,
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
        }

        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        if (page.authorId !== userIdInt) {
            throw new ApiError('Unauthorized - You can only access your own pages', 403);
        }

        res.json({
            success: true,
            data: page,
        });
    } catch (error) {
        next(error);
    }
}

async function processCollectionPlaceholders(html: string, authorId: number): Promise<string> {
    if (!html) return html;
    
    const collectionPattern = /\{\{collection:([^}]+)\}\}/g;
    const collectionMatches = Array.from(html.matchAll(collectionPattern));
    
    if (collectionMatches.length === 0) {
        return html;
    }
    
    let processedHtml = html;
    
    const matchesArray = Array.from(collectionMatches).reverse();
    
    for (const match of matchesArray) {
        const fullMatch = match[0];
        const collectionSlug = match[1].trim();
        
        const collection = await prisma.collection.findFirst({
            where: {
                slug: collectionSlug,
                authorId: authorId,
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
            processedHtml = processedHtml.replace(fullMatch, `<div style="padding: 1rem; background: #f5f5f5; border-radius: 4px; margin: 1rem 0;">
              <p style="color: #666; margin: 0;">Collection "${collectionSlug}" not found.</p>
            </div>`);
            continue;
        }
        
        const items = await prisma.collectionItem.findMany({
            where: {
                collectionId: collection.id,
                status: 'PUBLISHED',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        
        if (items.length === 0) {
            processedHtml = processedHtml.replace(fullMatch, `<div style="padding: 1rem; background: #f5f5f5; border-radius: 4px; margin: 1rem 0;">
              <p style="color: #666; margin: 0;">Collection "${collectionSlug}" has no published items.</p>
            </div>`);
            continue;
        }
        
        const placeholderIndex = processedHtml.indexOf(fullMatch);
        if (placeholderIndex === -1) continue;
        
        const beforePlaceholder = processedHtml.substring(0, placeholderIndex);
        const afterPlaceholder = processedHtml.substring(placeholderIndex + fullMatch.length);
        
        let template = '';
        const nextCollectionPattern = /\{\{collection:([^}]+)\}\}/;
        const nextMatch = afterPlaceholder.match(nextCollectionPattern);
        
        if (nextMatch && nextMatch.index !== undefined) {
            template = afterPlaceholder.substring(0, nextMatch.index).trim();
        } else {
            template = afterPlaceholder.trim();
        }
        
        if (!template || template.length === 0) {
            template = `
              <div class="collection-item" style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #e5e5e5; border-radius: 8px;">
                <h2>{{title}}</h2>
                <p>{{description}}</p>
              </div>
            `;
        }
        
        const itemsHtml = items.map((item, index) => {
            const itemData = item.data as Record<string, any> || {};
            const fields = collection.fields || [];
            
            const enhancedItemData: Record<string, any> = {
                ...itemData,
                _itemId: item.id,
                _itemIndex: index,
                _itemNumber: index + 1,
                _totalItems: items.length,
                slug: itemData.slug || itemData.Slug || itemData.SLUG || '',
            };
            
            let itemHtml = template;
            
            fields.forEach((field) => {
                const fieldLabel = field.fieldLabel || '';
                const possibleKeys = [
                    fieldLabel,
                    fieldLabel.toLowerCase().replace(/\s+/g, '_'),
                    fieldLabel.toLowerCase().replace(/\s+/g, '-'),
                    fieldLabel.toLowerCase(),
                    String(field.id)
                ];
                
                let fieldValue: any = null;
                for (const key of possibleKeys) {
                    if (enhancedItemData[key] !== undefined && enhancedItemData[key] !== null && enhancedItemData[key] !== '') {
                        fieldValue = enhancedItemData[key];
                        break;
                    }
                }
                
                if (fieldValue !== null) {
                    const placeholderVariations = [
                        fieldLabel,
                        fieldLabel.toLowerCase().replace(/\s+/g, '_'),
                        fieldLabel.toLowerCase().replace(/\s+/g, '-'),
                        fieldLabel.toLowerCase(),
                    ];
                    
                    placeholderVariations.forEach(placeholder => {
                        const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(`\\{\\{${escaped}\\}\\}`, 'gi'); // Case-insensitive
                        itemHtml = itemHtml.replace(regex, String(fieldValue));
                    });
                }
            });
            
            Object.keys(enhancedItemData).forEach((key) => {
                const value = enhancedItemData[key];
                if (value !== null && value !== undefined && value !== '' && typeof value !== 'object') {
                    const keyVariations = [
                        key,
                        key.toLowerCase().replace(/\s+/g, '_'),
                        key.toLowerCase().replace(/\s+/g, '-'),
                        key.toLowerCase(),
                    ];
                    
                    keyVariations.forEach(keyVar => {
                        const escaped = keyVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(`\\{\\{${escaped}\\}\\}`, 'gi'); // Case-insensitive
                        itemHtml = itemHtml.replace(regex, String(value));
                    });
                }
            });
            
            itemHtml = itemHtml.replace(
                /<(\w+)([^>]*)>/,
                (match, tag, attrs) => {
                    if (attrs.includes('data-collection-id') || attrs.includes('data-item-id')) return match;
                    return `<${tag}${attrs} data-collection-id="${collection.id}" data-item-id="${item.id}" data-item-index="${index}" style="cursor: pointer;">`;
                }
            );
            
            itemHtml = itemHtml.replace(
                /<(h[1-6])([^>]*)>(.*?)<\/\1>/gi,
                (match, tag, attrs, content) => {
                    if (attrs.includes('data-collection-id')) return match;
                    return `<${tag}${attrs} data-collection-id="${collection.id}" data-item-id="${item.id}" style="cursor: pointer; text-decoration: underline;">${content}</${tag}>`;
                }
            );
            
            itemHtml = itemHtml.replace(
                /<a([^>]*)>(.*?)<\/a>/gi,
                (match, attrs, content) => {
                    if (attrs.includes('data-collection-id') || attrs.includes('href="http')) return match;
                    return `<a${attrs} data-collection-id="${collection.id}" data-item-id="${item.id}" style="cursor: pointer;">${content}</a>`;
                }
            );
            
            return itemHtml;
        }).join('\n');
        
        const remainingContent = nextMatch && nextMatch.index !== undefined 
            ? afterPlaceholder.substring(nextMatch.index) 
            : '';
        processedHtml = beforePlaceholder + itemsHtml + remainingContent;
    }
    
    return processedHtml;
}

export const getPublicPageBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        
        if (slug === undefined || slug === null) {
            throw new ApiError('Slug is required', 400);
        }

        // Extract domain from request hostname
        const hostname = req.headers.host || (req as any).hostname || '';
        const domainName = hostname.split(':')[0]; // Remove port if present
        
        // Domain is required - must be configured in database
        if (!domainName || domainName === 'localhost' || domainName === '127.0.0.1') {
            throw new ApiError('Domain not found in request. Please access the website using a configured domain (e.g., mycms.test).', 400);
        }
        
        // Find domain in database
        const domain = await prisma.domain.findUnique({
            where: { domainName },
        });
        
        if (!domain) {
            throw new ApiError(`Domain "${domainName}" is not configured in the system. Please configure this domain in the CMS.`, 404);
        }
        
        // Get the user ID who owns this domain - all content will be filtered by this
        const authorId = domain.authorId;

        if (slug === '') {
            const homePage = await prisma.page.findFirst({
                where: {
                    isHomePage: true,
                    status: 'PUBLISHED',
                    authorId: authorId, // Filter by domain owner
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
                orderBy: {
                    createdAt: 'asc', 
                },
            });
            
            if (homePage) {
                const contentHtml = (homePage.content as any)?.html || '';
                const processedContent = await processCollectionPlaceholders(contentHtml, homePage.authorId);
                
                const processedPage = {
                    ...homePage,
                    content: {
                        ...(homePage.content as any),
                        html: processedContent,
                    },
                };
                
                return res.json({
                    success: true,
                    data: processedPage,
                });
            }
            
            const homeSlugPage = await prisma.page.findFirst({
                where: {
                    slug: 'home',
                    status: 'PUBLISHED',
                    authorId: authorId, // Filter by domain owner
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
            
            if (homeSlugPage) {
                const contentHtml = (homeSlugPage.content as any)?.html || '';
                const processedContent = await processCollectionPlaceholders(contentHtml, homeSlugPage.authorId);
                
                const processedPage = {
                    ...homeSlugPage,
                    content: {
                        ...(homeSlugPage.content as any),
                        html: processedContent,
                    },
                };
                
                return res.json({
                    success: true,
                    data: processedPage,
                });
            }
            
            throw new ApiError('Home page not found. Please mark a page as "Home Page" in your CMS.', 404);
        }
        
        if (slug === 'home') {
            const homePage = await prisma.page.findFirst({
                where: {
                    slug: 'home',
                    status: 'PUBLISHED',
                    authorId: authorId, // Filter by domain owner
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
            
            if (homePage) {
                const contentHtml = (homePage.content as any)?.html || '';
                const processedContent = await processCollectionPlaceholders(contentHtml, homePage.authorId);
                
                const processedPage = {
                    ...homePage,
                    content: {
                        ...(homePage.content as any),
                        html: processedContent,
                    },
                };
                
                return res.json({
                    success: true,
                    data: processedPage,
                });
            }
            
            throw new ApiError('Page with slug "home" not found', 404);
        }

        const page = await prisma.page.findFirst({
            where: {
                slug: slug,
                status: 'PUBLISHED',
                authorId: authorId, // Filter by domain owner
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

        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        const contentHtml = (page.content as any)?.html || '';
        const processedContent = await processCollectionPlaceholders(contentHtml, page.authorId);
        
        const processedPage = {
            ...page,
            content: {
                ...(page.content as any),
                html: processedContent,
            },
        };

        res.json({
            success: true,
            data: processedPage,
        });
    } catch (error) {
        next(error);
    }
}