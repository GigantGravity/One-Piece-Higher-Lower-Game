export interface Pirate {
  name: string;
  bounty: number;
  image: string;
  imagePosition?: string;
}

export interface GameState {
  currentPirate: Pirate;
  nextPirate: Pirate;
  score: number;
  highscore: number;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface HighscoreEntryDto {
  username: string;
  score: number;
  achievedAt: string;
}

export interface FriendRequestDto {
  requestId: string;
  fromUsername: string;
  createdAt: string;
}

export interface FriendDto {
  userId: string;
  username: string;
}

export type Screen = 'game' | 'login' | 'register' | 'leaderboard' | 'friends';