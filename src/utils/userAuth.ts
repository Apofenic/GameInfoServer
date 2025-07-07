import { PrismaClient } from '../generated/prisma';
import { UserSignupInput } from '../types';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * Create a new user with hashed password
 */
export const createUser = async (userData: UserSignupInput) => {
  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  // Create the user with hashed password
  return await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name || null,
    },
  });
};

/**
 * Verify if a user exists with the given email
 */
export const userExists = async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user !== null;
};

/**
 * Verify user credentials and return user if valid
 */
export const verifyUserCredentials = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return null;
  }

  // Return user without the password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
