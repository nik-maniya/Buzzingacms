import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    createPageTemplate,
    deletePageTemplate,
    getAllPageTemplates,
    getPageTemplateById,
    renderTemplateWithItem,
    updatePageTemplate,
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

export default router;

