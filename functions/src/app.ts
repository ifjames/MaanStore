import express from 'express';
import cors from 'cors';

// Since we're using Firebase Functions, we'll use Firebase Admin SDK for storage
// This is a simplified version - you may need to adapt your storage layer
import { initializeStorage } from './storage';
import { registerRoutes } from './routes';

export function createExpressApp() {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: true, // Allow all origins in production, or specify your domain
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize storage
  initializeStorage();

  // Register routes
  registerRoutes(app);

  return app;
}
