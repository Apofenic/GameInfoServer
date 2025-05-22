# Game Database Server

A Node.js Express server for managing video game information with PostgreSQL database integration. This server provides a RESTful API for storing and retrieving video game data including titles, release dates, platforms, metascores, and more.

## Features

- **RESTful API**: Full CRUD operations for game data
- **PostgreSQL Database**: Robust data storage via Prisma ORM
- **Docker Support**: Easy local development and deployment
- **Data Import**: Bulk upload functionality via JSON
- **Data Scraping**: Tools for scraping game data from sources like Wikipedia

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Yarn](https://yarnpkg.com/) package manager

## Setup Instructions

### 1. Environment Setup

Create a `.env` file in the root directory with the following content:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gbdserver"
```

### 2. Development with Docker (Recommended)

The easiest way to start development is using Docker Compose, which sets up both the server and database:

```bash
# Start the server and database containers
docker compose up -d

# View logs
docker compose logs -f
```

The server will be available at http://localhost:3002 with hot-reloading enabled.

To stop the containers:

```bash
docker compose down
```

### 3. Local Development (Without Docker)

If you prefer to run the server locally:

```bash
# Install dependencies
yarn install

# Initialize the database (if first time)
yarn prisma migrate dev

# Start development server with hot reloading
yarn dev
```

The server will be available at http://localhost:3002.

## Project Structure

```plaintext
gameInfoServer/
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Prisma schema definition
│   └── migrations/        # Database migrations
├── src/                   # Source code
│   ├── index.ts           # Server entry point with API endpoints
│   └── generated/         # Generated Prisma client
├── scripts/               # Utility scripts
│   ├── datascraper.ts     # Wikipedia game data scraper
│   ├── JSONKeySwapper.js  # JSON data transformation utility
│   └── ScrapingSources.js # Data sources for scraping
├── uploads/               # Temporary storage for uploaded files
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Docker container definition
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── .gitignore             # Git ignore rules
```

## Available Scripts

- `yarn dev`: Start development server with hot reloading
- `yarn build`: Build the TypeScript project
- `yarn start`: Start the production server
- `yarn prisma generate`: Generate Prisma client
- `yarn prisma migrate dev`: Apply database migration

## Database Management

The project uses Prisma ORM to interact with PostgreSQL.

To create a new migration after changing the schema:

```bash
yarn prisma migrate dev --name <migration-name>
```

To reset the database:

```bash
yarn prisma migrate reset
```

To open Prisma Studio (database GUI):

```bash
yarn prisma studio
```

## API Reference

### Endpoints

| Method | Endpoint        | Description                      | Request Body                                      | Response                                    |
|--------|----------------|----------------------------------|--------------------------------------------------|---------------------------------------------|
| GET    | /health        | Check server and database status | None                                             | `{ status, database, timestamp }`           |
| GET    | /games         | Get all games                    | None                                             | Array of game objects                       |
| GET    | /games/:id     | Get a specific game by ID        | None                                             | Game object or 404 error                    |
| POST   | /games         | Create a single game             | `{ title, releaseDate, platform, metascore }`    | Created game object                         |
| POST   | /games/bulk    | Bulk import games                | Form data with `source` and optional file upload | `{ success, imported, total, skipped }`     |

### Data Model

The Game model contains the following fields:

```typescript
interface Game {
  id: number;           // Auto-incremented unique identifier
  title: string;        // Game title
  releaseDate: Date;    // Release date
  platform: string;     // Platform (e.g., "PlayStation 5", "PC", "Xbox Series X")
  metascore: number;    // Metacritic score (0-100)
  summary?: string;     // Optional game description/summary
  userscore?: number;   // Optional user score
  createdAt: Date;      // Record creation timestamp
  updatedAt: Date;      // Record update timestamp
}
```

### Example Requests

#### Creating a game

```bash
curl -X POST http://localhost:3002/games \
  -H "Content-Type: application/json" \
  -d '{"title":"The Legend of Zelda: Tears of the Kingdom","releaseDate":"2023-05-12","platform":"Nintendo Switch","metascore":96}'
```

#### Bulk importing games from JSON

```bash
curl -X POST http://localhost:3002/games/bulk \
  -H "Content-Type: multipart/form-data" \
  -F "source=json" \
  -F "file=@games.json"
```

## Data Scraping

The project includes a data scraper utility for collecting game information from Wikipedia. To use it:

```bash
# Compile TypeScript
yarn build

# Run the scraper
node dist/scripts/datascraper.js
```

You can customize the scraping sources in the `scripts/ScrapingSources.js` file.

## Production Deployment

To build and run the server for production:

```bash
# Build the Docker image
docker build -t gbdserver:latest .

# Run the container
docker run -p 3002:3002 -d gbdserver:latest
```

Make sure to set up proper environment variables for production use.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

- **Database Connection Errors**: Verify that PostgreSQL is running and the `DATABASE_URL` environment variable is set correctly
- **Prisma Client Generation**: If you encounter Prisma client errors, try running `yarn prisma generate` to regenerate the client
- **Docker Port Conflicts**: If port 3002 or 5433 is already in use, modify the port mappings in the `docker-compose.yml` file

## Security Considerations

For production deployments, consider implementing the following security measures:

- **API Authentication**: Add JWT or API key authentication for all endpoints
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Input Validation**: Enhance input validation beyond the basic checks
- **HTTPS**: Always use HTTPS in production environments
- **Environment Variables**: Never commit sensitive information like database credentials
- **Database Access**: Use a database user with limited permissions for the application

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
