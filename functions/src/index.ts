import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';

// Initialize Firebase Admin
admin.initializeApp();

// Import your existing server code (adapted for Firebase Functions)
import { createExpressApp } from './app';

// Create Express app
const app = createExpressApp();

// Export the API as a Firebase Function
export const api = functions.https.onRequest(app);
