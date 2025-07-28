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
      const games = await prisma.game.findMany({
        include: {
          platform: true, // Include platform information
        },
      });
      res.json(games);
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Get all platforms
app.get(
  '/platforms',
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const platforms = await prisma.platform.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      res.json(platforms);
    } catch (error) {
      console.error('Error fetching platforms:', error);
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
      const {
        title,
        releaseDate,
        platform,
        metascore,
        developer,
        publisher,
        genre,
        summary,
        userscore,
        coverArtUrls,
        screenShotUrls,
        notes,
      } = req.body;
      console.log('Parsed request body:', { title, releaseDate, platform, metascore });

      // Validate required fields
      if (!title || !releaseDate || !platform || metascore === undefined) {
        res.status(400).json({
          error:
            'Missing required fields. Please provide title, releaseDate, platform, and metascore.',
        });
        return;
      }

      // Find or create platform
      let platformRecord = await prisma.platform.findUnique({
        where: { name: platform },
      });

      if (!platformRecord) {
        // Create new platform if it doesn't exist
        platformRecord = await prisma.platform.create({
          data: {
            name: platform,
          },
        });
      }

      const result = await prisma.game.create({
        data: {
          title,
          releaseDate: new Date(releaseDate),
          platformId: platformRecord.id,
          metascore,
          developer: developer || null,
          publisher: publisher || null,
          genre: genre || null,
          summary: summary || null,
          userscore: userscore ? Number(userscore) : null,
          coverArtUrls: coverArtUrls || null,
          screenShotUrls: screenShotUrls || null,
          notes: notes || null,
        },
        include: {
          platform: true, // Include platform information in response
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
      const validGames = games.filter((game) => {
        const isValid =
          game.title && game.platform && game.releaseDate && typeof game.metascore === 'number';
        if (!isValid) {
          console.warn(`Skipping invalid game: ${JSON.stringify(game)}`);
        }
        return isValid;
      });

      if (!validGames.length) {
        res.status(400).json({
          error: 'No valid games found in the provided data',
        });
        return;
      }

      // Get all unique platform names from the games
      const uniquePlatformNames = [...new Set(validGames.map((game) => game.platform))];

      // Find or create platforms
      const platformMap = new Map<string, number>();

      for (const platformName of uniquePlatformNames) {
        let platform = await prisma.platform.findUnique({
          where: { name: platformName },
        });

        if (!platform) {
          platform = await prisma.platform.create({
            data: { name: platformName },
          });
        }

        platformMap.set(platformName, platform.id);
      }

      // Transform games data to use platformId
      const gamesForDatabase = validGames.map((game) => ({
        title: game.title,
        platformId: platformMap.get(game.platform)!,
        releaseDate: new Date(game.releaseDate),
        metascore: game.metascore,
        developer: game.developer || null,
        publisher: game.publisher || null,
        genre: game.genre || null,
        summary: game.summary || null,
        userscore: Number(game.userscore) || null,
        coverArtUrls: game.coverArtUrls || null,
        screenShotUrls: game.screenShotUrls || null,
        notes: game.notes || null,
      }));

      // Create many games at once
      const result = await prisma.game.createMany({
        data: gamesForDatabase,
        skipDuplicates: true, // Skip records that would violate unique constraints
      });

      res.status(201).json({
        success: true,
        imported: result.count,
        total: games.length,
        skipped: games.length - result.count,
        platformsCreated: uniquePlatformNames.length,
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
        include: {
          platform: true, // Include platform information
        },
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

// Get a random game with optional filtering by platform or release year
app.get(
  '/games/random',
  authenticateJWT,
  rateLimitByUser(100),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { platform, releaseYear } = req.query;

      // Build where conditions based on provided filters
      const whereConditions: any = {};

      // Filter by platform name if provided
      if (platform && typeof platform === 'string') {
        whereConditions.platform = {
          name: {
            equals: platform,
            mode: 'insensitive', // Case-insensitive matching
          },
        };
      }

      // Filter by release year if provided
      if (releaseYear) {
        const year = parseInt(releaseYear as string, 10);
        if (isNaN(year)) {
          res
            .status(400)
            .json({ error: 'Invalid release year format. Please provide a valid year.' });
          return;
        }

        // Filter for games released in the specified year
        const startOfYear = new Date(year, 0, 1); // January 1st of the year
        const endOfYear = new Date(year + 1, 0, 1); // January 1st of the next year

        whereConditions.releaseDate = {
          gte: startOfYear,
          lt: endOfYear,
        };
      }

      // Get total count of games matching the criteria
      const totalCount = await prisma.game.count({
        where: whereConditions,
      });

      if (totalCount === 0) {
        const filterInfo = [];
        if (platform) filterInfo.push(`platform: ${platform}`);
        if (releaseYear) filterInfo.push(`release year: ${releaseYear}`);

        const filterMessage =
          filterInfo.length > 0
            ? ` matching the specified criteria (${filterInfo.join(', ')})`
            : '';

        res.status(404).json({
          error: `No games found${filterMessage}`,
        });
        return;
      }

      // Generate random offset
      const randomOffset = Math.floor(Math.random() * totalCount);

      // Get random game with filters applied
      const game = await prisma.game.findFirst({
        where: whereConditions,
        skip: randomOffset,
        include: {
          platform: true, // Include platform information in the response
        },
      });

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
