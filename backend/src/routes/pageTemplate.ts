import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    createPageTemplate,
    deletePageTemplate,
    getAllPageTemplates,
    getPageTemplateById,
    renderTemplateWithItem,
    updatePageTemplate,
    renderCollectionItems,
    renderCollectionItem,
    renderPublicCollectionItem,
} from '../controller/pageTemplateController.js';

const router = Router();

// GET /api/page-templates/:collectionId - Get all page templates for a collection
router.get('/getAllPageTemplates/:collectionId', authenticate, getAllPageTemplates);

// GET /api/page-templates/:id - Get page template by id
router.get('/getPageTemplateById/:id', authenticate, getPageTemplateById);

// POST /api/page-templates - Create new page template
router.post('/createPageTemplate', authenticate, createPageTemplate);

// PUT /api/page-templates/:id - Update page template
router.put('/updatePageTemplate/:id', authenticate, updatePageTemplate);

// DELETE /api/page-templates/:id - Delete page template
router.delete('/deletePageTemplate/:id', authenticate, deletePageTemplate);

// GET /api/page-templates/:templateId/render/:itemId - Render template with item data
router.get('/renderTemplate/:templateId/:itemId', authenticate, renderTemplateWithItem);

// GET /api/page-templates/renderCollection/:collectionId - Render all items in a collection using latest template
router.get('/renderCollection/:collectionId', authenticate, renderCollectionItems);

// GET /api/page-templates/renderItem/:collectionId/:itemId - Render a single item using latest template
router.get('/renderItem/:collectionId/:itemId', authenticate, renderCollectionItem);

// Public route - GET /api/page-templates/public/renderItem/:collectionId/:itemId - Render published item (no auth)
router.get('/public/renderItem/:collectionId/:itemId', renderPublicCollectionItem);

export default router;

