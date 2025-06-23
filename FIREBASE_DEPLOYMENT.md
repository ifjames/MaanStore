# Firebase Deployment Guide for Maans Store

## Prerequisites
Your Firebase project should be set up with:
- Firebase Hosting enabled
- Firebase Firestore enabled (for data storage)
- Firebase Storage enabled (for file uploads)

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

## Step 3: Initialize Firebase in your project (if not already done)

```bash
firebase init
```

Select:
- Hosting: Configure files for Firebase Hosting
- Choose your existing Firebase project
- Use `dist/public` as public directory
- Configure as single-page app: Yes
- Set up automatic builds and deploys with GitHub: No (for now)

## Step 4: Build and Deploy

```bash
# Build the frontend
npm run build:frontend

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Or use the combined command:

```bash
npm run deploy:firebase
```

## Step 5: Set up Environment Variables (if needed)

If your app needs environment variables in production, create them in your build process or Firebase config.

## Step 6: Update API Base URL

Since you're deploying frontend only, you'll need to update your API calls to point to your backend server. 

In `/client/src/lib/queryClient.ts`, update the base URL to point to your backend server (e.g., Railway, Heroku, or another hosting service).

## Alternative: Full Stack Deployment

If you want to deploy both frontend and backend to Firebase:
1. Use Firebase Functions for the backend
2. Update the firebase.json to include functions
3. Adapt your Express server to work with Firebase Functions

## Commands Summary:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Build and deploy
npm run deploy:firebase

# Or manually:
npm run build:frontend
firebase deploy --only hosting
```

## Important Notes:

1. **Backend**: This deployment only covers the frontend. Your backend (Express server) needs to be deployed separately to a service like Railway, Heroku, or Vercel.

2. **API URLs**: Update your API base URLs to point to your deployed backend.

3. **CORS**: Make sure your backend allows your Firebase Hosting domain in CORS settings.

4. **Environment Variables**: Set up any needed environment variables for production.

## Troubleshooting:

- If build fails, run `npm run build:frontend` first to check for errors
- If deployment fails, check Firebase project permissions
- If app doesn't work after deployment, check browser console for API connection errors
