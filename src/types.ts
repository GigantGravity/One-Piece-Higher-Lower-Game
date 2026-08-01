export interface Pirate {
  name: string;
  bounty: number;
  image: string;
  imagePosition?: string;
}

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