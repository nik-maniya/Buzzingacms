import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import multer from 'multer';
import path from 'path';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    cb(null, true);
  },
});

// GET /api/media - Get all media files
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { mimeType, limit = 50, offset = 0 } = req.query;

    const where = mimeType ? { mimeType: mimeType as string } : {};

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.media.count({ where }),
    ]);

    res.json({
      success: true,
      data: media,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/media/:id - Get single media file
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new ApiError('Media file not found', 404);
    }

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/media/upload - Upload media file
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    const media = await prisma.media.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url,
        alt: req.body.alt || null,
        caption: req.body.caption || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: media,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/media/:id - Update media metadata
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { alt, caption } = req.body;

    const existingMedia = await prisma.media.findUnique({
      where: { id },
    });

    if (!existingMedia) {
      throw new ApiError('Media file not found', 404);
    }

    const media = await prisma.media.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(caption !== undefined && { caption }),
      },
    });

    res.json({
      success: true,
      message: 'Media updated successfully',
      data: media,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/media/:id - Delete media file
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingMedia = await prisma.media.findUnique({
      where: { id },
    });

    if (!existingMedia) {
      throw new ApiError('Media file not found', 404);
    }

    // TODO: Delete physical file from disk
    // fs.unlinkSync(existingMedia.path);

    await prisma.media.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
