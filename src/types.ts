export interface GameInput {
  title: string;
  releaseDate: string | Date;
  platform: string;
  metascore: number;
  summary?: string;
  userscore?: number;
}
