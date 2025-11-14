import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import pagesRouter from './routes/pages.js';
import collectionsRouter from './routes/collections.js';
import mediaRouter from './routes/media.js';
import menusRouter from './routes/menus.js';
import formsRouter from './routes/forms.js';
import authRouter from './routes/auth.js';
import collectionFieldRouter from './routes/collectionField.js';
import collectionItemRouter from './routes/collectionItem.js';
import pageTemplateRouter from './routes/pageTemplate.js';
import domainRouter from './routes/domain.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Connect to Database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost',
      'http://localhost:80',
      'http://127.0.0.1',
      'http://127.0.0.1:80',
      'http://mycms.test',
      'http://mycms.test:80',
      'http://192.168.29.150',
      'http://192.168.29.150:80',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
}));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/menus', menusRouter);
app.use('/api/forms', formsRouter);
app.use('/api/collection-fields', collectionFieldRouter);
app.use('/api/collection-items', collectionItemRouter);
app.use('/api/page-templates', pageTemplateRouter);
app.use('/api/domain', domainRouter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Buzzinga CMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api`);
});

export default app;


