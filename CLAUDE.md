# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean accident KPI management system (사고 KPI 관리 시스템) built with Next.js frontend and Express.js backend. The system tracks workplace accidents, generates investigation reports, and provides safety analytics and dashboards.

## Architecture

- **Frontend**: Next.js 15 with TypeScript, TailwindCSS, and React 19
- **Backend**: Express.js with TypeScript, Drizzle ORM, and PostgreSQL
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Deployment**: Docker Compose for containerized development

## Development Commands

### Root Level
```bash
# Start all services in development mode
docker-compose up -d

# Stop all services  
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

### Backend (Port 6002)
```bash
cd backend
npm run dev          # Development server with hot reload
npm run build        # Compile TypeScript
npm run start        # Production server
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes to database
```

### Frontend (Port 4001)
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checks
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Test coverage report
```

## Key Database Concepts

- **occurrence_report**: Main accident occurrence data
- **investigation**: Investigation reports linked to occurrences
- **victims**: Casualty information for each accident
- **property_damage**: Material damage tracking
- **annual_working_hours**: Used for safety KPI calculations (LTIR, TRIR)
- **company**: Organization management

## Important File Locations

### Configuration
- `docker-compose.yml`: Container orchestration
- `backend/drizzle.config.ts`: Database configuration
- `frontend/next.config.js`: Next.js configuration

### Database Schema
- `backend/orm/schema/`: All Drizzle schema definitions
- `backend/orm/migrations/`: Database migration files

### Type Definitions
- `frontend/types/`: Centralized TypeScript type definitions
- `frontend/types/common.ts`: Shared types across components

### Key Components
- `frontend/components/investigation/`: Investigation report components (modular structure)
- `frontend/components/occurrence/`: Accident occurrence form components
- `frontend/components/charts/`: Data visualization components

## Testing

The project uses Jest and React Testing Library:
- Test files: `frontend/__tests__/`
- Global test setup: `frontend/jest.setup.js`
- Test utilities: `frontend/__tests__/utils/test-utils.tsx`

## Development Notes

- The system supports both employee (임직원) and contractor (협력업체) accident tracking
- KPI calculations follow Korean safety standards (LTIR, TRIR, severity rates)
- Investigation reports can reference and modify original occurrence data
- The codebase has been recently refactored for better TypeScript safety and component modularity
- UI text and comments are primarily in Korean

## Recent Improvements

As documented in `docs/code-quality-improvement-plan.md`, the codebase has undergone comprehensive improvements including:
- TypeScript type safety enhancements
- Performance optimizations with React.memo, useCallback, useMemo
- Component structure refactoring for better modularity
- Error handling and logging improvements
- Jest testing framework implementation
- Accurate dashboard KPI calculations aligned with lagging indicators

## API Structure

Backend follows RESTful conventions:
- Controllers: `backend/controllers/`
- Services: `backend/services/`
- Routes: `backend/routes.ts`

Frontend API integration:
- Services: `frontend/services/`
- Custom hooks for data management: `frontend/hooks/`