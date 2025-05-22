// src/index.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from './generated/prisma';
import fs from 'fs';
import multer from 'multer';

// Import types for our game data
interface GameInput {
  title: string;
  releaseDate: string | Date;
  platform: string;
  metascore: number;
  summary?: string;
  userscore?: number;
}

// Initialize the Prisma client
const prisma = new PrismaClient();

// Initialize Express
const app = express();
const port = 3002;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware for parsing JSON
app.use(express.json());

// Health check endpoint that tests database connection
app.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({
      status: 'up',
      database: 'connected',
      timestamp: (result as any)[0].now,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get all games
app.get('/games', async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Create a single game
app.post('/games', async (req: Request, res: any) => {
  try {
    const { title, releaseDate, platform, metascore } = req.body;
    console.log('Parsed request body:', { title, releaseDate, platform, metascore });

    // Validate required fields
    if (!title || !releaseDate || !platform || metascore === undefined) {
      return res.status(400).json({
        error:
          'Missing required fields. Please provide title, releaseDate, platform, and metascore.',
      });
    }

    const result = await prisma.game.create({
      data: {
        title,
        releaseDate: new Date(releaseDate),
        platform,
        metascore,
      },
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating game:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Bulk operations endpoint for games
app.post('/games/bulk', upload.single('file'), async (req: Request, res: any) => {
  try {
    const { source } = req.body;

    if (!source || !['json', 'request'].includes(source)) {
      return res.status(400).json({
        error: "Please specify a valid 'source' parameter ('json' or 'request')",
      });
    }

    let games: GameInput[] = [];

    // Load games from JSON file
    if (source === 'json') {
      if (!req.file) {
        return res.status(400).json({
          error: 'Please upload a JSON file',
        });
      }

      try {
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        const jsonData = JSON.parse(fileContent);

        // Handle both array format and object with games array property
        games = Array.isArray(jsonData) ? jsonData : jsonData.games || [];
        fs.unlinkSync(req.file.path);

        if (!games.length) {
          return res.status(400).json({
            error: 'No games found in the provided JSON file',
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: `Failed to read or parse JSON file: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    } else if (source === 'request') {
      // Load games from request body
      if (!req.body.games || !Array.isArray(req.body.games) || !req.body.games.length) {
        return res.status(400).json({
          error: "Please provide a 'games' array in the request body",
        });
      }
      games = req.body.games;
    }

    // Validate and prepare games data
    const validGames = games
      .filter((game) => {
        const isValid =
          game.title && game.platform && game.releaseDate && typeof game.metascore === 'number';
        if (!isValid) {
          console.warn(`Skipping invalid game: ${JSON.stringify(game)}`);
        }
        return isValid;
      })
      .map((game) => ({
        title: game.title,
        platform: game.platform,
        releaseDate: new Date(game.releaseDate),
        metascore: game.metascore,
        summary: game.summary || null,
        userscore: Number(game.userscore) || null,
      }));

    if (!validGames.length) {
      return res.status(400).json({
        error: 'No valid games found in the provided data',
      });
    }

    // Create many games at once
    const result = await prisma.$transaction(async (tx) => {
      // Using createMany for bulk insertion
      const createResult = await tx.game.createMany({
        data: validGames,
        skipDuplicates: true, // Skip records that would violate unique constraints
      });

      return createResult;
    });

    return res.status(201).json({
      success: true,
      imported: result.count,
      total: games.length,
      skipped: games.length - result.count,
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Add an endpoint to view a specific game by ID
app.get('/games/:id', async (req: Request, res: any) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const game = await prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    return res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
