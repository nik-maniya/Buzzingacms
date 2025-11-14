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

// Helper function to process collection placeholders in HTML content
async function processCollectionPlaceholders(html: string, authorId: number): Promise<string> {
    if (!html) return html;
    
    // Match {{collection:slug}} pattern
    const collectionPattern = /\{\{collection:([^}]+)\}\}/g;
    const collectionMatches = Array.from(html.matchAll(collectionPattern));
    
    if (collectionMatches.length === 0) {
        return html;
    }
    
    let processedHtml = html;
    
    // Process collections in reverse order to maintain correct indices
    const matchesArray = Array.from(collectionMatches).reverse();
    
    for (const match of matchesArray) {
        const fullMatch = match[0];
        const collectionSlug = match[1].trim();
        
        // Find collection by slug for this author
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
        
        // Fetch published items for this collection
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
        
        // Find the placeholder position
        const placeholderIndex = processedHtml.indexOf(fullMatch);
        if (placeholderIndex === -1) continue;
        
        const beforePlaceholder = processedHtml.substring(0, placeholderIndex);
        const afterPlaceholder = processedHtml.substring(placeholderIndex + fullMatch.length);
        
        // Extract template - everything after the collection placeholder until next {{collection:slug}}
        let template = '';
        const nextCollectionPattern = /\{\{collection:([^}]+)\}\}/;
        const nextMatch = afterPlaceholder.match(nextCollectionPattern);
        
        if (nextMatch && nextMatch.index !== undefined) {
            template = afterPlaceholder.substring(0, nextMatch.index).trim();
        } else {
            template = afterPlaceholder.trim();
        }
        
        // Default template if none provided
        if (!template || template.length === 0) {
            template = `
              <div class="collection-item" style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #e5e5e5; border-radius: 8px;">
                <h2>{{title}}</h2>
                <p>{{description}}</p>
              </div>
            `;
        }
        
        // Render each item
        const itemsHtml = items.map((item, index) => {
            const itemData = item.data as Record<string, any> || {};
            const fields = collection.fields || [];
            
            // Enhanced item data with metadata
            const enhancedItemData: Record<string, any> = {
                ...itemData,
                _itemId: item.id,
                _itemIndex: index,
                _itemNumber: index + 1,
                _totalItems: items.length,
                slug: itemData.slug || itemData.Slug || itemData.SLUG || '',
            };
            
            // Replace field placeholders in template
            let itemHtml = template;
            
            // First, try to match fields by their fieldLabel (matching frontend logic)
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
                    // Replace {{fieldLabel}} and variations (case-insensitive)
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
            
            // Then replace any remaining placeholders from itemData directly
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
            
            // Add data attributes to make items clickable
            // Add data-collection-id and data-item-id to the first element of each item
            itemHtml = itemHtml.replace(
                /<(\w+)([^>]*)>/,
                (match, tag, attrs) => {
                    // Check if already has data attributes
                    if (attrs.includes('data-collection-id') || attrs.includes('data-item-id')) return match;
                    // Add data attributes for click handling
                    return `<${tag}${attrs} data-collection-id="${collection.id}" data-item-id="${item.id}" data-item-index="${index}" style="cursor: pointer;">`;
                }
            );
            
            // Also make headings (h1-h6) clickable
            itemHtml = itemHtml.replace(
                /<(h[1-6])([^>]*)>(.*?)<\/\1>/gi,
                (match, tag, attrs, content) => {
                    // Check if already has data attributes
                    if (attrs.includes('data-collection-id')) return match;
                    return `<${tag}${attrs} data-collection-id="${collection.id}" data-item-id="${item.id}" style="cursor: pointer; text-decoration: underline;">${content}</${tag}>`;
                }
            );
            
            // Also make links clickable (if they don't have external hrefs)
            itemHtml = itemHtml.replace(
                /<a([^>]*)>(.*?)<\/a>/gi,
                (match, attrs, content) => {
                    // Skip if already has data attributes or is external link
                    if (attrs.includes('data-collection-id') || attrs.includes('href="http')) return match;
                    return `<a${attrs} data-collection-id="${collection.id}" data-item-id="${item.id}" style="cursor: pointer;">${content}</a>`;
                }
            );
            
            return itemHtml;
        }).join('\n');
        
        // Replace placeholder with rendered items
        const remainingContent = nextMatch && nextMatch.index !== undefined 
            ? afterPlaceholder.substring(nextMatch.index) 
            : '';
        processedHtml = beforePlaceholder + itemsHtml + remainingContent;
    }
    
    return processedHtml;
}

// Public endpoint - Get published page by slug (no authentication required)
export const getPublicPageBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        
        if (!slug) {
            throw new ApiError('Slug is required', 400);
        }

        // If slug is 'home' or empty, ALWAYS show the page marked as home page
        // This ensures users first see the home page when they visit the site
        if (slug === 'home' || slug === '') {
            // Priority 1: Find page with slug 'home' AND marked as home page (most specific)
            const exactHomePage = await prisma.page.findFirst({
                where: {
                    slug: 'home',
                    isHomePage: true,
                    status: 'PUBLISHED',
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
            
            if (exactHomePage) {
                // Process collection placeholders in content
                const contentHtml = (exactHomePage.content as any)?.html || '';
                const processedContent = await processCollectionPlaceholders(contentHtml, exactHomePage.authorId);
                
                // Update the page object with processed content
                const processedPage = {
                    ...exactHomePage,
                    content: {
                        ...(exactHomePage.content as any),
                        html: processedContent,
                    },
                };
                
                return res.json({
                    success: true,
                    data: processedPage,
                });
            }
            
            // Priority 2: Find any page marked as home page (regardless of slug)
            const homePage = await prisma.page.findFirst({
                where: {
                    isHomePage: true,
                    status: 'PUBLISHED',
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
                    createdAt: 'asc', // Get the first created home page if multiple exist
                },
            });
            
            if (homePage) {
                // Process collection placeholders in content
                const contentHtml = (homePage.content as any)?.html || '';
                const processedContent = await processCollectionPlaceholders(contentHtml, homePage.authorId);
                
                // Update the page object with processed content
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
            
            // Priority 3: If no page is marked as home, try to find a page with slug 'home'
            const homeSlugPage = await prisma.page.findFirst({
                where: {
                    slug: 'home',
                    status: 'PUBLISHED',
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
                // Process collection placeholders in content
                const contentHtml = (homeSlugPage.content as any)?.html || '';
                const processedContent = await processCollectionPlaceholders(contentHtml, homeSlugPage.authorId);
                
                // Update the page object with processed content
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
            
            // If still no page found, return 404
            throw new ApiError('Home page not found. Please mark a page as "Home Page" in your CMS.', 404);
        }

        // For other slugs, find the page by slug
        const page = await prisma.page.findFirst({
            where: {
                slug: slug,
                status: 'PUBLISHED',
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

        // Process collection placeholders in content
        const contentHtml = (page.content as any)?.html || '';
        const processedContent = await processCollectionPlaceholders(contentHtml, page.authorId);
        
        // Update the page object with processed content
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