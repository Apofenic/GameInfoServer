import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export const authenticateApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        message: 'Please provide an API key in the X-API-Key header',
      });
      return;
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    });

    if (!keyRecord || !keyRecord.isActive) {
      res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or inactive',
      });
      return;
    }

    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() },
    });

    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
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

export const rateLimitByApiKey = (requestsPerMinute: number = 60) => {
  const requestCounts = new Map<number, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      return next();
    }

    const now = Date.now();
    const keyId = req.apiKey.id;
    const windowMs = 60 * 1000;

    const current = requestCounts.get(keyId);

    if (!current || now > current.resetTime) {
      requestCounts.set(keyId, { count: 1, resetTime: now + windowMs });
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
