import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Please provide a valid JWT token in the Authorization header (Bearer token)',
      });
      return;
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the token
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found',
      });
      return;
    }

    // Set the user on the request
    req.user = {
      ...user,
      name: user.name ?? undefined,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication',
    });
  }
};

export const rateLimitByUser = (requestsPerMinute: number = 100) => {
  const requestCounts = new Map<number, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next();
    }

    const now = Date.now();
    const userId = req.user.id;
    const windowMs = 60 * 1000;

    const current = requestCounts.get(userId);

    if (!current || now > current.resetTime) {
      requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (current.count >= requestsPerMinute) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Maximum ${requestsPerMinute} requests per minute allowed`,
      });
      return;
    }

    current.count++;
    next();
  };
};
