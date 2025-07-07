import { Request } from 'express';

export interface GameInput {
  title: string;
  releaseDate: string | Date;
  platform: string;
  metascore: number;
  summary?: string;
  userscore?: number;
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
