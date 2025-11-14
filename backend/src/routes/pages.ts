import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createPage, deletePage, getAllPages, getPageById, updatePage, getPublicPageBySlug } from '../controller/pagesController.js';

const router = Router();

// Public route - Get published page by slug (no authentication)
router.get('/public/:slug', getPublicPageBySlug);

// GET /api/pages - Get all pages
router.get('/', authenticate, getAllPages) 

// GET /api/pages/:id - Get single page (supports both ID and slug)
router.get('/:id', authenticate, getPageById)

// POST /api/pages - Create new page
router.post('/', authenticate, createPage)
  

// PUT /api/pages/:id - Update page
router.put('/:id', authenticate, updatePage)
  

// DELETE /api/pages/:id - Delete page
router.delete('/:id', authenticate, deletePage)

export default router;
