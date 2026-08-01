import type { Pirate, GameState } from './types';
import { pirates } from './data';

const MAX_HISTORY = Math.max(1, Math.floor(pirates.length / 2));
let recentlyShown: string[] = [];

function addToHistory(name: string): void {
  recentlyShown.push(name);
  if (recentlyShown.length > MAX_HISTORY) {
    recentlyShown.shift();
  }
}

export function resolveImagePath(path: string): string {
  if (!path) return '';
  return import.meta.env.BASE_URL + path;
}

export function preloadAllImages(): Promise<void[]> {
  const withImages = pirates.filter((pirate) => pirate.image);
  console.log(`Preloading ${withImages.length} von ${pirates.length} Piraten-Bildern`);

  const promises = withImages.map((pirate) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn(`Bild konnte nicht geladen werden: ${pirate.name} (${pirate.image})`);
        resolve();
      };
      img.src = resolveImagePath(pirate.image);
    });
  });

  return Promise.all(promises);
}

export function getRandomPirate(exclude?: Pirate): Pirate {
  if (pirates.length < 2) {
    throw new Error('Es werden mindestens 2 Piraten benötigt, um das Spiel zu spielen.');
  }

  const excludedNames = new Set(recentlyShown);
  if (exclude) {
    excludedNames.add(exclude.name);
  }

  let pool = pirates.filter((p) => !excludedNames.has(p.name));

  if (pool.length === 0) {
    pool = pirates.filter((p) => !exclude || p.name !== exclude.name);
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const candidate = pool[randomIndex];
  addToHistory(candidate.name);
  return candidate;
}

export function createInitialState(): GameState {
  const currentPirate = getRandomPirate();
  const nextPirate = getRandomPirate(currentPirate);

  return {
    currentPirate,
    nextPirate,
    score: 0,
    highscore: loadHighscore(),
  };
}

export function checkGuess(state: GameState, guess: 'higher' | 'lower'): boolean {
  if (state.nextPirate.bounty === state.currentPirate.bounty) {
    return true;
  }

  const isHigher = state.nextPirate.bounty > state.currentPirate.bounty;
  return (guess === 'higher') === isHigher;
}

export function advanceRound(state: GameState): GameState {
  const newCurrentPirate = state.nextPirate;
  const newNextPirate = getRandomPirate(newCurrentPirate);

  return {
    currentPirate: newCurrentPirate,
    nextPirate: newNextPirate,
    score: state.score + 1,
    highscore: state.highscore,
  };
}

function loadHighscore(): number {
  const stored = localStorage.getItem('highscore');
  return stored ? parseInt(stored, 10) : 0;
}

export function saveHighscoreIfNeeded(score: number): number {
  const current = loadHighscore();
  if (score > current) {
    localStorage.setItem('highscore', score.toString());
    return score;
  }
  return current;
}

export function preloadImage(url: string): void {
  if (!url) return;
  const img = new Image();
  img.src = url;
}