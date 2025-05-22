# Game Database Server

A Node.js Express server for managing video game information with PostgreSQL database integration.

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Yarn](https://yarnpkg.com/) package manager

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gbdserver
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following content:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gbdserver"
```

### 3. Development with Docker (Recommended)

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

### 4. Local Development (Without Docker)

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

```
gbdserver/
├── prisma/            # Database schema and migrations
│   └── schema.prisma  # Prisma schema definition
├── src/               # Source code
│   └── index.ts       # Server entry point
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile         # Docker container definition
├── package.json       # Project dependencies and scripts
└── tsconfig.json      # TypeScript configuration
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

## Production Deployment

To build and run the server for production:

```bash
# Build the Docker image
docker build -t gbdserver:latest .

# Run the container
docker run -p 3002:3002 -d gbdserver:latest
```

Make sure to set up proper environment variables for production use.

## License

MIT