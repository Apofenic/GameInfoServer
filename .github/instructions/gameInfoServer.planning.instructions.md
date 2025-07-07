---
applyTo: '**'
---

# GameInfoServer Planning Instructions

## Project Overview

The GameInfoServer (gbdserver) is a Node.js Express server for managing comprehensive video game information with PostgreSQL database integration. It provides a RESTful API for storing, retrieving, and managing video game data including titles, release dates, platforms, metascores, and more. The server supports user authentication, list management, and bulk data operations.

## Architecture Overview

- **Technology Stack**:

  - Backend: Node.js, Express.js, TypeScript
  - Database: PostgreSQL with Prisma ORM
  - Authentication: JWT + API Keys
  - Testing: Jest
  - Development: Docker Compose, ts-node-dev
  - Code Quality: ESLint, Prettier

- **Design Patterns**:

  - RESTful API architecture
  - Middleware-based authentication
  - Repository pattern via Prisma ORM
  - Modular utility functions

- **Key Components**:
  - Express server with middleware stack
  - Prisma client for database operations
  - Authentication middleware (JWT & API Key)
  - File upload handling (Multer)
  - Data scraping utilities
  - JSON key transformation tools

## Current Focus Areas

- [x] **Phase 1**: Core API Development

  - RESTful endpoints for games CRUD
  - PostgreSQL database with Prisma ORM
  - Basic authentication system

- [x] **Phase 2**: Authentication & Security

  - JWT-based user authentication
  - API key management system
  - Rate limiting and security middleware

- [ ] **Phase 3**: Advanced Features

  - Enhanced list management
  - Advanced search and filtering
  - Data validation and sanitization
  - Performance optimization

- [ ] **Phase 4**: Production Readiness
  - Monitoring and logging
  - Error handling improvements
  - API documentation (OpenAPI/Swagger)
  - Deployment automation

## Key Architectural Decisions

1. **Database Choice**: PostgreSQL selected for ACID compliance, complex queries, and robust data integrity for game collections
2. **ORM Selection**: Prisma chosen for type safety, migrations, and excellent TypeScript integration
3. **Authentication Strategy**: Dual authentication (JWT for users, API keys for services) to support both web and API clients
4. **File Structure**: Modular organization with separate middleware, utils, and types directories for maintainability
5. **Data Import Strategy**: JSON bulk upload functionality to support large-scale data migration from various sources

## Integration Points

- **External APIs**:
  - Wikipedia scraping for game data
  - Potential future integrations with IGDB, Steam, or other game databases
- **Internal Services**:
  - MCP (Model Context Protocol) server for database access
  - JSON transformation utilities for data processing
- **Data Flow**:
  - Client → Express middleware → Authentication → Route handlers → Prisma → PostgreSQL
  - Bulk uploads: JSON files → Multer → Validation → Batch insert via Prisma

## Security Considerations

- **Authentication**: JWT tokens with configurable expiration + API key system for service access
- **Authorization**: Role-based access through middleware with rate limiting
- **Data Protection**: Input validation, SQL injection prevention via Prisma, password hashing with bcrypt
- **API Security**: Rate limiting per user/API key, environment variable protection
- **File Upload Security**: Controlled file upload destination and type validation

## Performance Requirements

- **Expected Load**: Development/small production scale (hundreds of concurrent users)
- **Performance Targets**:
  - API response times < 200ms for standard queries
  - Bulk upload processing for 10k+ game records
  - Database connection pooling via Prisma
- **Optimization Priorities**:
  1. Database query optimization and indexing
  2. Pagination for large result sets
  3. Caching strategy for frequently accessed data
  4. Rate limiting to prevent abuse

## Database Schema Design

- **Core Entities**: Game, User, List, ApiKey
- **Relationships**:
  - Users can create multiple Lists
  - Lists can contain multiple Games (many-to-many)
  - Games have unique constraints on title+platform combination
- **Data Integrity**: Foreign key constraints, unique indexes, timestamp tracking

## Development Workflow

- **Local Development**: Docker Compose for PostgreSQL, ts-node-dev for hot reloading
- **Testing Strategy**: Jest for unit and integration tests, separate test database
- **Code Quality**: ESLint + Prettier for consistent formatting, TypeScript for type safety
- **Database Management**: Prisma migrations for schema changes, seed scripts for test data

## Future Considerations

- **Scalability**: Consider database sharding for large game collections
- **API Versioning**: Implement versioning strategy for breaking changes
- **Real-time Features**: WebSocket support for live updates to shared lists
- **Analytics**: Usage tracking and performance monitoring
- **Deployment**: CI/CD pipeline, containerization for production deployment
