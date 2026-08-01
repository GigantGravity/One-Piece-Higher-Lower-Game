import type { GameState } from './types';
import { createInitialState, checkGuess, advanceRound, saveHighscoreIfNeeded, preloadImage, preloadAllImages, resolveImagePath } from './game';
import './style.css';

let state: GameState = createInitialState();
let isGameOver = false;
let feedback: 'correct' | 'wrong' | null = null;
let isTransitioning = false;
let justAdvanced = false;

const app = document.querySelector<HTMLDivElement>('#app')!;

function showLoadingScreen(): void {
  app.innerHTML = `
    <div class="loading-screen">
      <p>Piraten werden geladen ...</p>
    </div>
  `;
}

async function init(): Promise<void> {
  showLoadingScreen();
  await preloadAllImages();
  document.addEventListener('keydown', handleKeydown);
  render();
}

init();

function formatBounty(bounty: number): string {
  return bounty.toLocaleString('de-DE') + ' Berry';
}

function render(): void {
  console.log('render() aufgerufen, justAdvanced:', justAdvanced);
  const currentImagePath = resolveImagePath(state.currentPirate.image);
  const nextImagePath = resolveImagePath(state.nextPirate.image);

  const currentBg = currentImagePath || 'linear-gradient(135deg, #1b2a4a, #0a1128)';
  const nextBg = nextImagePath || 'linear-gradient(135deg, #1b2a4a, #0a1128)';

  const currentPosition = state.currentPirate.imagePosition || 'center';
  const nextPosition = state.nextPirate.imagePosition || 'center';

  const feedbackClass = feedback ? ` feedback-${feedback}` : '';

  app.innerHTML = `
    <div class="game">
      <div class="card card-left" style="view-transition-name: pirate-${slugify(state.currentPirate.name)}; 
      background-image: ${currentImagePath ? `url('${currentImagePath}')` : currentBg
    }; background-position: ${currentPosition};">
        <div class="card-overlay">
          <h2 class="pirate-name">"${state.currentPirate.name}"</h2>
          <p class="label">hat ein Kopfgeld von</p>
          <p class="bounty">${formatBounty(state.currentPirate.bounty)}</p>
        </div>
      </div>

      <div class="vs-badge">VS</div>

      <div class="card card-right${feedbackClass}" style="view-transition-name: pirate-${slugify(state.nextPirate.name)}; 
      background-image: ${nextImagePath ? `url('${nextImagePath}')` : nextBg
    }; background-position: ${nextPosition};">
        <div class="card-overlay">
          <h2 class="pirate-name">"${state.nextPirate.name}"</h2>
          <p class="label">hat ein</p>
          ${
            isGameOver
              ? `<div class="game-over">
                   <p class="result">Game Over! ${state.score} Punkte.</p>
                   <button id="restart-btn">Nochmal spielen</button>
                 </div>`
              : `<div class="controls">
                   <button id="higher-btn" ${isTransitioning ? 'disabled' : ''}>Höheres Kopfgeld ▲</button>
                   <button id="lower-btn" ${isTransitioning ? 'disabled' : ''}>Niedrigeres Kopfgeld ▼</button>
                 </div>`
          }
          <p class="hint">Kopfgeld als ${state.currentPirate.name}</p>
        </div>
      </div>

      <div class="score score-left">High Score: ${state.highscore}</div>
      <div class="score score-right">Score: ${state.score}</div>
    </div>
  `;

  attachEventListeners();
}

function attachEventListeners(): void {
  if (isGameOver) {
    const restartBtn = document.querySelector<HTMLButtonElement>('#restart-btn');
    restartBtn?.addEventListener('click', handleRestart);
  } else {
    const higherBtn = document.querySelector<HTMLButtonElement>('#higher-btn');
    const lowerBtn = document.querySelector<HTMLButtonElement>('#lower-btn');
    higherBtn?.addEventListener('click', () => handleGuess('higher'));
    lowerBtn?.addEventListener('click', () => handleGuess('lower'));
  }
}

function handleGuess(guess: 'higher' | 'lower'): void {
  if (isTransitioning) return;

  const wasCorrect = checkGuess(state, guess);
  feedback = wasCorrect ? 'correct' : 'wrong';
  isTransitioning = true;
  render();

setTimeout(() => {
  const updateAndRender = () => {
    if (wasCorrect) {
      state = advanceRound(state);
      preloadImage(resolveImagePath(state.currentPirate.image));
      preloadImage(resolveImagePath(state.nextPirate.image));
    } else {
      state.highscore = saveHighscoreIfNeeded(state.score);
      isGameOver = true;
    }

    feedback = null;
    isTransitioning = false;
    render();
  };

  if (document.startViewTransition) {
    document.startViewTransition(updateAndRender);
  } else {
    updateAndRender();
  }
}, 800);
}

function handleRestart(): void {
  state = createInitialState();
  isGameOver = false;
  render();
}

function handleKeydown(event: KeyboardEvent): void {
  if (isGameOver) {
    if (event.key === 'Enter') {
      handleRestart();
    }
    return;
  }

  if (isTransitioning) return;

  if (event.key === 'ArrowUp') {
    handleGuess('higher');
  } else if (event.key === 'ArrowDown') {
    handleGuess('lower');
  }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}