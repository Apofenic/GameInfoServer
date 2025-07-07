// src/index.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from './generated/prisma';
import fs from 'fs';
import multer from 'multer';
import { GameInput, AuthenticatedRequest, UserSignupInput } from './types';
import { authenticateApiKey, rateLimitByApiKey } from './middleware/auth';
import { authenticateJWT, rateLimitByUser } from './middleware/jwtAuth';
import { createApiKey, listApiKeys, revokeApiKey } from './utils/keyManager';
import { createUser, userExists } from './utils/userAuth';
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

app.post('/admin/api-keys', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'API key name is required' });
      return;
    }

    const apiKey = await createApiKey(name);
    res.json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Only show the key once upon creation
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

app.get('/admin/api-keys', async (req: Request, res: Response) => {
  try {
    const keys = await listApiKeys();
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

app.delete('/admin/api-keys/:id', async (req: Request, res: Response) => {
  try {
    const keyId = parseInt(req.params.id);
    await revokeApiKey(keyId);
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// User signup endpoint
app.post('/auth/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: UserSignupInput = req.body;

    // Validate email and password
    if (!userData.email || !userData.password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Check password length
    if (userData.password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    // Check if user already exists
    const exists = await userExists(userData.email);
    if (exists) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    // Create the user
    const user = await createUser(userData);

    // Return the user data without password
    const { password, ...userWithoutPassword } = user;
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// User login endpoint
app.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Verify user credentials
    const { verifyUserCredentials } = await import('./utils/userAuth');
    const user = await verifyUserCredentials(email, password);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const { generateToken } = await import('./utils/jwt');
    const token = generateToken({ userId: user.id, email: user.email });

    // Return token and user data
    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get(
  '/users',
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const game = await prisma.user.findUnique({
        where: { id },
      });

      if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      res.json(game);
    } catch (error) {
      console.error('Error fetching game:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

app.get(
  '/users/:id',
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const game = await prisma.user.findUnique({
        where: { id },
      });

      if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      res.json(game);
    } catch (error) {
      console.error('Error fetching game:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Get all games
app.get(
  '/games',
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const games = await prisma.game.findMany();
      res.json(games);
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Create a single game
app.post(
  '/games',
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { title, releaseDate, platform, metascore } = req.body;
      console.log('Parsed request body:', { title, releaseDate, platform, metascore });

      // Validate required fields
      if (!title || !releaseDate || !platform || metascore === undefined) {
        res.status(400).json({
          error:
            'Missing required fields. Please provide title, releaseDate, platform, and metascore.',
        });
        return;
      }

      const result = await prisma.game.create({
        data: {
          title,
          releaseDate: new Date(releaseDate),
          platform,
          metascore,
        },
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating game:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Bulk operations endpoint for games
app.post(
  '/games/bulk',
  upload.single('file'),
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { source } = req.body;

      if (!source || !['json', 'request'].includes(source)) {
        res.status(400).json({
          error: "Please specify a valid 'source' parameter ('json' or 'request')",
        });
        return;
      }

      let games: GameInput[] = [];

      // Load games from JSON file
      if (source === 'json') {
        if (!req.file) {
          res.status(400).json({
            error: 'Please upload a JSON file',
          });
          return;
        }

        try {
          const fileContent = fs.readFileSync(req.file.path, 'utf8');
          const jsonData = JSON.parse(fileContent);

          // Handle both array format and object with games array property
          games = Array.isArray(jsonData) ? jsonData : jsonData.games || [];
          fs.unlinkSync(req.file.path);

          if (!games.length) {
            res.status(400).json({
              error: 'No games found in the provided JSON file',
            });
            return;
          }
        } catch (error) {
          res.status(400).json({
            error: `Failed to read or parse JSON file: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });
          return;
        }
      } else if (source === 'request') {
        // Load games from request body
        if (!req.body.games || !Array.isArray(req.body.games) || !req.body.games.length) {
          res.status(400).json({
            error: "Please provide a 'games' array in the request body",
          });
          return;
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
        res.status(400).json({
          error: 'No valid games found in the provided data',
        });
        return;
      }

      // Create many games at once
      const result = await prisma.game.createMany({
        data: validGames,
        skipDuplicates: true, // Skip records that would violate unique constraints
      });

      res.status(201).json({
        success: true,
        imported: result.count,
        total: games.length,
        skipped: games.length - result.count,
      });
    } catch (error) {
      console.error('Error in bulk operation:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Add an endpoint to view a specific game by ID
app.get(
  '/games/:id',
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const game = await prisma.game.findUnique({
        where: { id },
      });

      if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      res.json(game);
    } catch (error) {
      console.error('Error fetching game:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

//return a random game
app.get(
  '/games/random',
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Get the min and max IDs from the games table
      const result = await prisma.game.aggregate({
        _min: { id: true },
        _max: { id: true },
      });

      if (!result._min.id || !result._max.id) {
        res.status(404).json({ error: 'No games found in database' });
        return;
      }

      // Generate random ID between min and max
      const minId = result._min.id;
      const maxId = result._max.id;
      const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;

      // Try to find the game with the random ID, if not found, get the first game after that ID
      let game = await prisma.game.findUnique({
        where: { id: randomId },
      });

      // If no game found at that exact ID, find the first game with ID >= randomId
      if (!game) {
        game = await prisma.game.findFirst({
          where: { id: { gte: randomId } },
        });
      }

      // If still no game found, get the first game in the database
      if (!game) {
        game = await prisma.game.findFirst();
      }

      if (!game) {
        res.status(404).json({ error: 'No games found' });
        return;
      }

      res.json(game);
    } catch (error) {
      console.error('Error fetching random game:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Move these middleware registrations after all routes are defined!
// This ensures that routes are defined before being protected

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
