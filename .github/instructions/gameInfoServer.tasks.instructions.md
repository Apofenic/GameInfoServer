---
applyTo: '**'
---

# GameInfoServer Tasks Instructions

## Current Sprint/Iteration

**Sprint Goal**: Finalize Phase 2 features and prepare for Phase 3 advanced functionality

## Active Tasks

### High Priority

- [ ] **API Documentation**: Generate OpenAPI/Swagger documentation for all endpoints

  - **Files**: Add swagger setup to `src/index.ts`, create API docs
  - **Approach**: Use swagger-jsdoc and swagger-ui-express
  - **Testing**: Verify all endpoints are documented and examples work

- [ ] **Enhanced Error Handling**: Implement comprehensive error handling and logging
  - **Files**: Create `src/middleware/errorHandler.ts`, update routes
  - **Approach**: Custom error classes, structured logging
  - **Testing**: Test error scenarios and log output

### Medium Priority

- [ ] **Advanced Search & Filtering**: Implement complex search capabilities for games

  - **Files**: Update game routes, add search utilities
  - **Approach**: Full-text search, multiple filter combinations
  - **Testing**: Performance testing with large datasets

- [ ] **Enhanced List Management**: Improve list sharing and collaboration features
  - **Files**: Update List model, add sharing endpoints
  - **Approach**: Permission-based sharing, public/private lists
  - **Testing**: Multi-user scenarios and permissions

### Low Priority

- [ ] **Performance Optimization**: Database query optimization and caching
  - **Files**: Review all Prisma queries, add caching layer
  - **Approach**: Query analysis, Redis caching implementation
  - **Testing**: Load testing and performance benchmarks

## Implementation Guidelines

### Current Focus

When helping with code, prioritize:

1. TypeScript type safety and proper error handling
2. Prisma best practices for database operations
3. JWT and API key authentication consistency
4. Comprehensive testing coverage

### Code Patterns to Follow

- Use middleware for cross-cutting concerns (auth, logging, validation)
- Separate business logic into utility functions
- Follow Prisma naming conventions for models and fields
- Use proper HTTP status codes and structured error responses
- Implement proper input validation and sanitization

### Testing Strategy

- Unit tests for utility functions and middleware
- Integration tests for API endpoints
- Database testing with separate test database
- Authentication testing for all protected routes

## Recently Completed

- [x] **JWT Authentication System**: Implemented complete user authentication with refresh tokens (July 7, 2025)
- [x] **API Key Management**: Created API key generation, validation, and management system (July 7, 2025)
- [x] **Testing Infrastructure**: Set up Jest testing framework with comprehensive test coverage (July 7, 2025)
- [x] **MCP Server Setup**: Configured DBHub MCP server for database access (July 7, 2025)
- [x] **Project Documentation**: Created planning instructions and project structure documentation (July 7, 2025)

## Blocked/Waiting

- [ ] **Production Deployment**: Waiting for deployment environment and CI/CD pipeline setup

## Technical Debt

- [ ] **Database Indexing**: Add proper indexes for common query patterns (games by platform, release date)
- [ ] **Rate Limiting Configuration**: Make rate limiting configurable per API key type
- [ ] **Environment Configuration**: Centralize all configuration in a config service
- [ ] **Logging Standardization**: Implement structured logging with consistent format across all modules

## Discovered During Work

- Need to add proper CORS configuration for frontend integration
- Consider implementing WebSocket support for real-time list updates
- Add database connection health checks and automatic reconnection
- Implement proper file upload size limits and type validation
