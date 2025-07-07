import crypto from 'crypto';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const generateApiKey = (): string => {
  // Generate a secure random API key
  return 'gis_' + crypto.randomBytes(32).toString('hex');
};

export const createApiKey = async (name: string) => {
  const key = generateApiKey();

  return await prisma.apiKey.create({
    data: {
      key,
      name,
    },
  });
};

export const listApiKeys = async () => {
  return await prisma.apiKey.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      lastUsed: true,
      // Don't return the actual key for security
    },
  });
};

export const revokeApiKey = async (keyId: number) => {
  return await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });
};
