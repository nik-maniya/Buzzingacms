import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';

import { createMenu, deleteMenu, getAllMenus, getMenuById, updateMenu, getPublicMenus } from '../controller/menuController.js';

const router = Router();

// Public route - Get public menus (no authentication)
router.get('/public', getPublicMenus);

// GET /api/menus - Get all menus
router.get('/getAllmenu', authenticate, getAllMenus)

// GET /api/menus/:id - Get single menu
router.get('/getMenuById/:id', authenticate, getMenuById); 


// POST /api/menus - Create menu
router.post('/cerateMenu', authenticate, createMenu);

// PUT /api/menus/:id - Update menu
router.put('/updateMenu/:id', authenticate, updateMenu)
  
// DELETE /api/menus/:id - Delete menu
router.delete('/deleteMenu/:id', authenticate, deleteMenu)
 


export default router;
