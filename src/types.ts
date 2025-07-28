import { Request } from 'express';

export interface GameInput {
  title: string;
  releaseDate: string | Date;
  platform: string;
  metascore: number;
  developer?: string;
  publisher?: string;
  genre?: string;
  summary?: string;
  userscore?: number;
  coverArtUrls?: string;
  screenShotUrls?: string;
  notes?: string;
}

export interface AuthenticatedRequest extends Request {
  apiKey?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    email: string;
    name?: string;
  };
}

export interface UserSignupInput {
  email: string;
  password: string;
  name?: string;
}

export interface UserLoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name?: string;
  };
}
