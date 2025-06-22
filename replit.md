# Maans' Store - Inventory Management System

## Overview

Maans' Store is a modern inventory management system built with React and Express. The application provides a comprehensive dashboard for managing store inventory, tracking stock levels, and displaying product information. The system features both administrative and public interfaces, with real-time inventory tracking and low stock alerts.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and building
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Simple in-memory session storage
- **API Design**: RESTful API with JSON responses

## Key Components

### Database Schema
The application uses two main tables:
- **Users**: Stores admin credentials (email, password, admin status)
- **Inventory**: Stores product information (item name, price, stock quantity)

### Authentication System
- Simple session-based authentication
- Admin-only access to management features
- Public access to inventory viewing
- Login/logout functionality with form validation

### Inventory Management
- CRUD operations for inventory items
- Stock level tracking with low stock alerts
- Search and sorting capabilities
- Real-time updates and synchronization
- Public inventory display for customers

### UI Components
- Consistent design system using shadcn/ui
- Responsive layout with mobile support
- Dashboard with statistics and alerts
- Data tables with sorting and filtering
- Toast notifications for user feedback

## Data Flow

1. **Authentication Flow**:
   - User submits login credentials
   - Server validates against database
   - Session created on successful authentication
   - Protected routes check authentication status

2. **Inventory Operations**:
   - Admin users can create, read, update, delete inventory items
   - Public users can view inventory with search capabilities
   - Real-time updates through TanStack Query
   - Low stock alerts generated automatically

3. **Data Synchronization**:
   - Inventory data can be synced from external sources
   - Background sync operations with progress tracking
   - Automatic cache invalidation after updates

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Hook Form)
- UI framework (Tailwind CSS, Radix UI primitives)
- State management (TanStack Query)
- Form validation (Zod, Hookform Resolvers)
- Date handling (date-fns)
- Icons (Lucide React)

### Backend Dependencies
- Express.js for server framework
- Drizzle ORM for database operations
- Neon Database for PostgreSQL hosting
- Zod for schema validation
- TypeScript for type safety

### Development Dependencies
- Vite for build tooling
- ESBuild for server bundling
- TSX for TypeScript execution
- Various Replit-specific plugins

## Deployment Strategy

### Development Environment
- Uses Vite dev server for hot reloading
- TSX for running TypeScript server code
- Concurrent frontend and backend development
- Replit-specific optimizations and plugins

### Production Build
- Vite builds the React frontend to static files
- ESBuild bundles the Express server
- Static files served from Express server
- Environment-based configuration

### Database Setup
- Drizzle migrations for schema management
- Environment variable for database connection
- Automatic schema generation from TypeScript types
- Production-ready PostgreSQL via Neon

### Hosting Configuration
- Replit deployment with autoscale
- Port 5000 for local development
- Port 80 for production access
- Automatic deployments on code changes

## Changelog

- June 22, 2025: Initial setup with basic inventory management system
- June 22, 2025: Major modernization update with glassmorphism design, PHP currency support, mobile compatibility, theme system, and enhanced notifications

## Recent Changes

### Major Modernization (June 22, 2025)
- **Design System**: Implemented glassmorphism design with liquid glass effects
- **Color Scheme**: Updated to modern purple/blue gradient palette (easier on eyes)
- **Currency**: Changed to Philippine Peso (₱) as primary currency with multi-currency support
- **Authentication**: Simplified admin credentials to admin/admin123
- **Mobile Support**: Added full mobile responsiveness with animated sidebar
- **Theme System**: Integrated light/dark theme support with system preference detection
- **Notifications**: Replaced basic toasts with SweetAlert2 for modern glass-styled notifications
- **Settings Page**: Added comprehensive settings with theme, currency, and system preferences
- **Animations**: Enhanced UX with Framer Motion animations and floating background shapes
- **Modern Libraries**: Integrated SweetAlert2, Framer Motion, and enhanced icon system

## User Preferences

- Preferred communication style: Simple, everyday language
- Design preference: Modern, glassmorphism effects with soft colors
- Currency: Philippine Peso (₱) 
- Theme: Light mode with dark mode support
- Mobile-first responsive design approach