import type { AuthUser, FriendDto, FriendRequestDto, GameState, HighscoreEntryDto, Screen } from './types';
import { createInitialState, checkGuess, advanceRound, saveHighscoreIfNeeded, preloadImage, preloadAllImages, resolveImagePath } from './game';
import {
  login as apiLogin,
  register as apiRegister,
  isLoggedIn,
  clearToken,
  getStoredUser,
  submitScore,
  getGlobalLeaderboard,
  getFriendsLeaderboard,
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from './api';
import { t, getLanguage, setLanguage } from './i18n';
import type { Language } from './i18n';
import './style.css';

let state: GameState = createInitialState();
let isGameOver = false;
let feedback: 'correct' | 'wrong' | null = null;
let isTransitioning = false;
let currentScreen: Screen = 'game';
let authUser: AuthUser | null = null;
let authError: string | null = null;
let isAuthLoading = false;

let leaderboardTab: 'global' | 'friends' = 'global';
let leaderboardEntries: HighscoreEntryDto[] = [];
let isLeaderboardLoading = false;

let friendsList: FriendDto[] = [];
let pendingRequests: FriendRequestDto[] = [];
let friendUsernameInput = '';
let friendActionError: string | null = null;
let friendActionMessage: string | null = null;
let isFriendsLoading = false;


const app = document.querySelector<HTMLDivElement>('#app')!;

function showLoadingScreen(): void {
  app.innerHTML = `
    <div class="loading-screen">
      <p>${t('game.loading')}</p>
    </div>
  `;
}

async function init(): Promise<void> {
  showLoadingScreen();

  if (isLoggedIn()) {
    authUser = getStoredUser();
  }

  await preloadAllImages();
  document.addEventListener('keydown', handleKeydown);
  render();
}

init();

function renderGame(): void {
  const currentImagePath = resolveImagePath(state.currentPirate.image);
  const nextImagePath = resolveImagePath(state.nextPirate.image);

  const currentBg = currentImagePath || 'linear-gradient(135deg, #1b2a4a, #0a1128)';
  const nextBg = nextImagePath || 'linear-gradient(135deg, #1b2a4a, #0a1128)';

  const currentPosition = state.currentPirate.imagePosition || 'center';
  const nextPosition = state.nextPirate.imagePosition || 'center';

  const feedbackClass = feedback ? ` feedback-${feedback}` : '';

app.innerHTML = `
  <div class="game">
    ${renderNav()}

    <div class="cards-row">
      <div class="card card-left" style="view-transition-name: pirate-${slugify(state.currentPirate.name)}; background-image: ${
        currentImagePath ? `url('${currentImagePath}')` : currentBg
      }; background-position: ${currentPosition};">
        <div class="card-overlay">
          <h2 class="pirate-name">"${state.currentPirate.name}"</h2>
          <p class="label">${t('game.hasBounty')}</p>
          <p class="bounty">${formatBounty(state.currentPirate.bounty)}</p>
        </div>
      </div>

      <div class="vs-badge">VS</div>

      <div class="card card-right${feedbackClass}" style="view-transition-name: pirate-${slugify(state.nextPirate.name)}; background-image: ${
        nextImagePath ? `url('${nextImagePath}')` : nextBg
      }; background-position: ${nextPosition};">
        <div class="card-overlay">
          <h2 class="pirate-name">"${state.nextPirate.name}"</h2>
          <p class="label">${t('game.has')}</p>
          ${
            isGameOver
              ? `<div class="game-over">
                   <p class="result">${t('game.gameOver')} ${state.score} ${t('game.points')}</p>
                   <button id="restart-btn">${t('game.playAgain')}</button>
                 </div>`
              : `<div class="controls">
                   <button id="higher-btn" ${isTransitioning ? 'disabled' : ''}>${t('game.higher')}</button>
                   <button id="lower-btn" ${isTransitioning ? 'disabled' : ''}>${t('game.lower')}</button>
                 </div>`
          }
          <p class="hint">${t('game.hint')} ${state.currentPirate.name}</p>
        </div>
      </div>

      <div class="score score-left">${t('game.highScore')}: ${state.highscore}</div>
      <div class="score score-right">${t('game.score')}: ${state.score}</div>
    </div>
  </div>
`;

  attachEventListeners();
  attachEventListeners();
  attachNavListeners();
}

function formatBounty(bounty: number): string {
  const locale = getLanguage() === 'de' ? 'de-DE' : 'en-US';
  return bounty.toLocaleString(locale) + ' Berry';
}

function render(): void {
  switch (currentScreen) {
    case 'game':
      renderGame();
      break;
    case 'login':
      renderLogin();
      break;
    case 'register':
      renderRegister();
      break;
    case 'leaderboard':
      renderLeaderboard();
      break;
    case 'friends':
      renderFriends();
      break;
    default:
      renderGame();
  }
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

  document.querySelector('#show-login-btn')?.addEventListener('click', () => {
    authError = null;
    currentScreen = 'login';
    render();
  });

  document.querySelector('#logout-btn')?.addEventListener('click', () => {
    clearToken();
    authUser = null;
    renderGame();
  });

  document.querySelector('#show-leaderboard-btn')?.addEventListener('click', () => {
  currentScreen = 'leaderboard';
  loadLeaderboard();
  });

  document.querySelector('#show-friends-btn')?.addEventListener('click', () => {
  currentScreen = 'friends';
  loadFriendsData();
  });
}

function handleGuess(guess: 'higher' | 'lower'): void {
  if (isTransitioning) return;

  const wasCorrect = checkGuess(state, guess);
  feedback = wasCorrect ? 'correct' : 'wrong';
  isTransitioning = true;
  renderGame();

setTimeout(() => {
  const updateAndRender = () => {
    if (wasCorrect) {
      state = advanceRound(state);
      preloadImage(resolveImagePath(state.currentPirate.image));
      preloadImage(resolveImagePath(state.nextPirate.image));
    } else {
      state.highscore = saveHighscoreIfNeeded(state.score);
      isGameOver = true;

      if (isLoggedIn()) {
        submitScore(state.score).catch(() => {
          console.warn('Score konnte nicht an den Server übermittelt werden');
        });
      }
    }

    feedback = null;
    isTransitioning = false;
    renderGame();
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
  renderGame();
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

function renderLogin(): void {
  app.innerHTML = `
    <div class="auth-screen">
      ${renderLanguageSwitcher()}

      <h1>${t('app.title')}</h1>
      <h2>${t('auth.login')}</h2>

      ${authError ? `<p class="auth-error">${authError}</p>` : ''}

      <form id="login-form" class="auth-form">
        <input type="text" id="login-username" placeholder="${t('auth.username')}" autocomplete="username" required />
        <input type="password" id="login-password" placeholder="${t('auth.password')}" autocomplete="current-password" required />
        <button type="submit" ${isAuthLoading ? 'disabled' : ''}>${isAuthLoading ? t('auth.loadingButton') : t('auth.loginButton')}</button>
      </form>

      <p class="auth-switch">${t('auth.noAccount')} <a href="#" id="go-to-register">${t('auth.registerNow')}</a></p>
      <p class="auth-switch"><a href="#" id="skip-auth">${t('auth.skipAuth')}</a></p>
    </div>
  `;

  attachAuthListeners();
  attachLanguageSwitcherListeners();
}

function renderRegister(): void {
  app.innerHTML = `
    <div class="auth-screen">
      ${renderLanguageSwitcher()}

      <h1>${t('app.title')}</h1>
      <h2>${t('auth.register')}</h2>

      ${authError ? `<p class="auth-error">${authError}</p>` : ''}

      <form id="register-form" class="auth-form">
        <input type="text" id="register-username" placeholder="${t('auth.username')}" autocomplete="username" required />
        <input type="password" id="register-password" placeholder="${t('auth.passwordHint')}" autocomplete="new-password" required />
        <button type="submit" ${isAuthLoading ? 'disabled' : ''}>${isAuthLoading ? t('auth.loadingButton') : t('auth.registerButton')}</button>
      </form>

      <p class="auth-switch">${t('auth.hasAccount')} <a href="#" id="go-to-login">${t('auth.loginNow')}</a></p>
      <p class="auth-switch"><a href="#" id="skip-auth">${t('auth.skipAuth')}</a></p>
    </div>
  `;

  attachAuthListeners();
  attachLanguageSwitcherListeners();
}

function attachAuthListeners(): void {
  const loginForm = document.querySelector<HTMLFormElement>('#login-form');
  loginForm?.addEventListener('submit', handleLoginSubmit);

  const registerForm = document.querySelector<HTMLFormElement>('#register-form');
  registerForm?.addEventListener('submit', handleRegisterSubmit);

  document.querySelector('#go-to-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    authError = null;
    currentScreen = 'register';
    render();
  });

  document.querySelector('#go-to-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    authError = null;
    currentScreen = 'login';
    render();
  });

  document.querySelector('#skip-auth')?.addEventListener('click', (e) => {
    e.preventDefault();
    authError = null;
    currentScreen = 'game';
    render();
  });
}

async function handleLoginSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const username = (document.querySelector<HTMLInputElement>('#login-username'))!.value;
  const password = (document.querySelector<HTMLInputElement>('#login-password'))!.value;

  authError = null;
  isAuthLoading = true;
  render();

  try {
    authUser = await apiLogin(username, password);
    currentScreen = 'game';
  } catch (error) {
    authError = error instanceof Error ? error.message : t('error.generic');
  } finally {
    isAuthLoading = false;
    render();
  }
}

async function handleRegisterSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const username = (document.querySelector<HTMLInputElement>('#register-username'))!.value;
  const password = (document.querySelector<HTMLInputElement>('#register-password'))!.value;

  authError = null;
  isAuthLoading = true;
  render();

  try {
    await apiRegister(username, password);
    authUser = await apiLogin(username, password);
    currentScreen = 'game';
  } catch (error) {
    authError = error instanceof Error ? error.message : t('error.generic');
  } finally {
    isAuthLoading = false;
    render();
  }
}

async function renderLeaderboard(): Promise<void> {
  app.innerHTML = `
    <div class="sub-screen">
      ${renderNav()}

      <div class="sub-screen-content">
        <h1 class="page-title">${t('leaderboard.title')}</h1>

        <div class="tabs">
          <button class="tab-btn ${leaderboardTab === 'global' ? 'active' : ''}" id="tab-global">${t('leaderboard.global')}</button>
          <button class="tab-btn ${leaderboardTab === 'friends' ? 'active' : ''}" id="tab-friends">${t('leaderboard.friends')}</button>
        </div>

        ${isLeaderboardLoading ? `<p class="info-text">${t('auth.loadingButton')}</p>` : renderLeaderboardList()}
      </div>
    </div>
  `;

  attachLeaderboardListeners();
  attachNavListeners();
}

function renderLeaderboardList(): string {
  if (leaderboardTab === 'friends' && !authUser) {
    return `<p class="info-text">${t('leaderboard.loginForFriends')}</p>`;
  }

  if (leaderboardEntries.length === 0) {
    return `<p class="info-text">${t('leaderboard.empty')}</p>`;
  }

  const topEntry = leaderboardEntries[0];
  const restEntries = leaderboardEntries.slice(1);

  const spotlight = `
    <div class="spotlight-card">
      <span class="spotlight-label">${t('leaderboard.topScore')}</span>
      <div class="spotlight-score">${topEntry.score}</div>
      <span class="spotlight-name">${topEntry.username}</span>
    </div>
  `;

  const rows = restEntries
    .map(
      (entry, index) => `
        <li class="leaderboard-row">
          <span class="leaderboard-rank">#${index + 2}</span>
          <span class="leaderboard-name">${entry.username}</span>
          <span class="leaderboard-score">${entry.score}</span>
        </li>
      `
    )
    .join('');

  return `${spotlight}<ol class="leaderboard-list">${rows}</ol>`;
}

async function loadLeaderboard(): Promise<void> {
  isLeaderboardLoading = true;
  render();

  try {
    leaderboardEntries =
      leaderboardTab === 'global'
        ? await getGlobalLeaderboard()
        : await getFriendsLeaderboard();
  } catch (error) {
    leaderboardEntries = [];
  } finally {
    isLeaderboardLoading = false;
    render();
  }
}

function attachLeaderboardListeners(): void {
  document.querySelector('#tab-global')?.addEventListener('click', () => {
    leaderboardTab = 'global';
    loadLeaderboard();
  });

  document.querySelector('#tab-friends')?.addEventListener('click', () => {
    leaderboardTab = 'friends';
    loadLeaderboard();
  });
}

function renderFriends(): void {
  app.innerHTML = `
    <div class="sub-screen">
      ${renderNav()}

      <div class="sub-screen-content">
        <h1 class="page-title">${t('friends.title')}</h1>

        <form id="add-friend-form" class="friend-form">
          <input type="text" id="friend-username-input" placeholder="${t('friends.usernamePlaceholder')}" value="${friendUsernameInput}" required />
          <button type="submit" ${isFriendsLoading ? 'disabled' : ''}>${t('friends.sendRequest')}</button>
        </form>

        ${friendActionError ? `<p class="auth-error">${friendActionError}</p>` : ''}
        ${friendActionMessage ? `<p class="info-text success">${friendActionMessage}</p>` : ''}

        <h2>${t('friends.pendingRequests')}</h2>
        ${
          pendingRequests.length === 0
            ? `<p class="info-text">${t('friends.noPendingRequests')}</p>`
            : `<ul class="request-list">
                ${pendingRequests
                  .map(
                    (req) => `
                      <li class="request-row">
                        <span>${req.fromUsername}</span>
                        <div class="request-actions">
                          <button class="accept-btn" data-request-id="${req.requestId}">${t('friends.accept')}</button>
                          <button class="decline-btn" data-request-id="${req.requestId}">${t('friends.decline')}</button>
                        </div>
                      </li>
                    `
                  )
                  .join('')}
              </ul>`
        }

        <h2>${t('friends.myFriends')}</h2>
        ${
          friendsList.length === 0
            ? `<p class="info-text">${t('friends.noFriends')}</p>`
            : `<ul class="friend-list">
                ${friendsList.map((friend) => `<li class="friend-row">${friend.username}</li>`).join('')}
              </ul>`
        }
      </div>
    </div>
  `;

  attachFriendsListeners();
  attachNavListeners();
}

async function loadFriendsData(): Promise<void> {
  isFriendsLoading = true;
  render();

  try {
    [friendsList, pendingRequests] = await Promise.all([getFriends(), getPendingRequests()]);
  } catch (error) {
    friendActionError = error instanceof Error ? error.message : t('error.generic');
  } finally {
    isFriendsLoading = false;
    render();
  }
}

function attachFriendsListeners(): void {
  const addFriendForm = document.querySelector<HTMLFormElement>('#add-friend-form');
  addFriendForm?.addEventListener('submit', handleAddFriendSubmit);

  document.querySelectorAll<HTMLButtonElement>('.accept-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleFriendRequestAction(btn.dataset.requestId!, 'accept'));
  });

  document.querySelectorAll<HTMLButtonElement>('.decline-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleFriendRequestAction(btn.dataset.requestId!, 'decline'));
  });
}

async function handleAddFriendSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const input = document.querySelector<HTMLInputElement>('#friend-username-input')!;
  const username = input.value.trim();

  if (!username) return;

  friendActionError = null;
  friendActionMessage = null;
  isFriendsLoading = true;
  render();

  try {
    await sendFriendRequest(username);
    friendActionMessage = `${t('friends.requestSent')} (${username})`;
    friendUsernameInput = '';
  } catch (error) {
    friendActionError = error instanceof Error ? error.message : t('error.generic');
  } finally {
    isFriendsLoading = false;
    render();
  }
}

async function handleFriendRequestAction(requestId: string, action: 'accept' | 'decline'): Promise<void> {
  friendActionError = null;
  friendActionMessage = null;
  isFriendsLoading = true;
  render();

  try {
    if (action === 'accept') {
      await acceptFriendRequest(requestId);
      friendActionMessage = t('friends.requestAccepted');
    } else {
      await declineFriendRequest(requestId);
      friendActionMessage = t('friends.requestDeclined');
    }
    await loadFriendsData();
  } catch (error) {
    friendActionError = error instanceof Error ? error.message : t('error.generic');
    isFriendsLoading = false;
    render();
  }
}

function renderLanguageSwitcher(): string {
  const current = getLanguage();
  return `
    <div class="lang-switcher">
      <button class="lang-btn ${current === 'de' ? 'active' : ''}" id="lang-de" type="button" aria-label="Deutsch">${iconFlagDE()}</button>
      <button class="lang-btn ${current === 'en' ? 'active' : ''}" id="lang-en" type="button" aria-label="English">${iconFlagGB()}</button>
    </div>
  `;
}

function attachLanguageSwitcherListeners(): void {
  document.querySelector('#lang-de')?.addEventListener('click', () => {
    setLanguage('de');
    render();
  });

  document.querySelector('#lang-en')?.addEventListener('click', () => {
    setLanguage('en');
    render();
  });
}

function iconSkull(): string {
  return `<svg class="nav-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M61.09,30.3c0.06,0.55-0.34,1.04-0.89,1.1h-0.1c-0.51,0-0.94-0.38-1-0.89c-0.09-0.94-0.37-1.66-0.81-2.13c-0.38-0.41-0.35-1.04,0.05-1.42c0.41-0.37,1.04-0.35,1.41,0.05C60.5,27.82,60.95,28.92,61.09,30.3z"/>
    <path fill="currentColor" d="M65.37,31.53c-0.09,0.03-0.18,0.04-0.27,0.04c-0.44,0-0.84-0.29-0.96-0.74c-0.48-1.74-1.2-3.02-2.15-3.8c-0.43-0.35-0.5-0.98-0.15-1.4c0.35-0.43,0.98-0.5,1.41-0.15c1.3,1.06,2.22,2.64,2.82,4.83C66.21,30.84,65.9,31.39,65.37,31.53z"/>
    <ellipse fill="currentColor" transform="matrix(0.1602 -0.9871 0.9871 0.1602 -1.1081 101.3376)" cx="59" cy="51.32" rx="5.9" ry="5.9"/>
    <path fill="currentColor" d="M87.39,30.97c0,0,0,0,0.01,0c1.64,0,3.19-0.65,4.35-1.81c1.16-1.16,1.8-2.71,1.81-4.35c0-1.64-0.64-3.19-1.8-4.36c-1.1-1.09-2.56-1.72-4.08-1.79c-0.07-1.52-0.7-2.98-1.79-4.07c-2.4-2.4-6.31-2.4-8.71,0c-2.14,2.14-2.39,5.42-0.73,7.83l-6.46,6.45C65.76,21.9,58.23,17.61,50,17.61S34.24,21.9,30.01,28.87l-6.46-6.45c1.66-2.41,1.41-5.69-0.73-7.83c-2.4-2.4-6.31-2.4-8.71,0c-1.09,1.09-1.73,2.55-1.79,4.07c-1.52,0.07-2.98,0.7-4.08,1.79c-1.16,1.17-1.8,2.72-1.8,4.36S7.09,28,8.25,29.16c1.16,1.16,2.71,1.81,4.35,1.81h0.01c1.35,0,2.63-0.43,3.69-1.23l8.94,8.93H14.37c-1.66,0-3,1.35-3,3c0,0.79,0.32,1.57,0.88,2.13c0.55,0.56,1.31,0.88,2.12,0.88h12.56c0.97,6.17,4.36,11.65,9.46,15.31l-11.2,11.2c-2.41-1.66-5.69-1.41-7.83,0.73c-2.4,2.4-2.4,6.31,0,8.71c1.09,1.09,2.55,1.72,4.07,1.79c0.07,1.52,0.7,2.98,1.79,4.08c1.17,1.16,2.71,1.8,4.35,1.8h0.01c1.64-0.01,3.19-0.65,4.35-1.82c1.16-1.15,1.81-2.7,1.81-4.34c0-1.35-0.43-2.64-1.23-3.7l2.14-2.15c1.86,6.95,7.58,11.19,15.35,11.19s13.49-4.24,15.35-11.19l2.14,2.15c-0.8,1.06-1.23,2.35-1.23,3.7c0,1.64,0.65,3.19,1.81,4.34c1.16,1.17,2.71,1.81,4.35,1.82c0,0,0,0,0.01,0c1.64,0,3.18-0.64,4.35-1.8c1.09-1.1,1.72-2.56,1.79-4.08c1.52-0.07,2.98-0.7,4.07-1.79c2.4-2.4,2.4-6.31,0-8.71c-2.14-2.14-5.42-2.39-7.83-0.73l-11.2-11.2c5.1-3.66,8.49-9.14,9.46-15.31h12.56c0.81,0,1.57-0.32,2.12-0.88c0.56-0.56,0.88-1.34,0.88-2.13c0-1.65-1.35-3-3-3H74.76l8.94-8.93C84.76,30.54,86.04,30.97,87.39,30.97z M31.11,30.97C34.83,23.96,42.07,19.61,50,19.61s15.17,4.35,18.89,11.36c0.15,0.29,0.28,0.6,0.42,0.89H30.69C30.83,31.57,30.95,31.26,31.11,30.97z M29.51,34.87c0.1-0.34,0.23-0.67,0.35-1.01h40.28c0.12,0.34,0.25,0.67,0.35,1.01c0.07,0.25,0.13,0.51,0.2,0.77c0.1,0.43,0.21,0.85,0.29,1.28c0.06,0.28,0.09,0.57,0.14,0.86c0.04,0.3,0.08,0.59,0.11,0.89H28.77c0.03-0.3,0.07-0.59,0.11-0.89c0.04-0.29,0.08-0.58,0.13-0.86c0.09-0.43,0.2-0.85,0.3-1.28C29.38,35.38,29.44,35.12,29.51,34.87z M16.23,26.83l-0.69,0.92c-0.78,0.79-1.82,1.22-2.93,1.22c0,0,0,0-0.01,0c-1.1,0-2.15-0.44-2.93-1.23H9.66c-0.78-0.78-1.22-1.82-1.22-2.93s0.43-2.16,1.22-2.94c0.93-0.94,2.26-1.37,3.56-1.16l1.36,0.22l-0.21-1.37c-0.21-1.3,0.22-2.63,1.15-3.55c1.63-1.62,4.26-1.62,5.88,0c1.6,1.6,1.64,4.15,0.08,5.79l-0.67,0.71l8.2,8.18c-0.03,0.06-0.05,0.11-0.08,0.17c-0.23,0.48-0.45,0.96-0.65,1.46c-0.01,0-0.01,0.01-0.01,0.02c-0.2,0.49-0.37,0.98-0.53,1.48c-0.04,0.13-0.08,0.26-0.12,0.39c-0.13,0.44-0.26,0.9-0.37,1.35c-0.01,0.07-0.03,0.14-0.05,0.21c-0.12,0.52-0.21,1.05-0.29,1.58c-0.01,0.04-0.02,0.08-0.03,0.13L16.23,26.83z M36.58,66.47c1.59,1.3,3.34,2.35,5.2,3.13l-0.57,3.32c-1.81-0.69-3.54-1.6-5.16-2.73C36.12,68.97,36.29,67.73,36.58,66.47z M37.17,64.34c0.34-1.02,0.73-2.04,1.2-3.07c0.03,0.01,0.05,0.02,0.08,0.04c0.53,0.3,1.08,0.58,1.64,0.84c0.13,0.06,0.25,0.12,0.38,0.18c0.58,0.25,1.16,0.5,1.76,0.7c0.21,0.08,0.43,0.14,0.64,0.21l-0.74,4.32C40.34,66.76,38.67,65.68,37.17,64.34z M34.19,73.92l-4.58,4.58l0.91,0.7c0.79,0.78,1.22,1.83,1.22,2.93c0,1.11-0.44,2.16-1.23,2.94c-0.78,0.79-1.82,1.22-2.93,1.23h-0.01c-1.1,0-2.15-0.44-2.94-1.22c-0.93-0.93-1.36-2.26-1.15-3.56l0.22-1.37l-1.37,0.22c-1.3,0.21-2.63-0.22-3.55-1.15c-1.62-1.63-1.62-4.26,0-5.88c1.6-1.61,4.14-1.64,5.79-0.08l0.71,0.66l9.9-9.9C34.11,67.43,33.77,70.79,34.19,73.92z M63.77,74.13c-0.55,3.5-2.15,6.34-4.53,8.3S53.7,85.48,50,85.48c-7.39,0-12.66-4.35-13.77-11.35c-0.08-0.5-0.14-1.02-0.18-1.53c4.19,2.59,8.97,3.96,13.95,3.96s9.76-1.37,13.95-3.96C63.91,73.11,63.85,73.63,63.77,74.13z M49,71.21v3.31c-2.01-0.08-3.98-0.4-5.87-0.95l0.56-3.27C45.4,70.83,47.18,71.13,49,71.21z M44.03,68.3l0.78-4.52c0.12,0.03,0.24,0.05,0.36,0.08l0.06,0.01c0.03,0.01,0.07,0.01,0.11,0.02c0.48,0.1,0.97,0.18,1.46,0.25c0,0,0.01,0,0.02,0c0.21,0.04,0.45,0.07,0.69,0.09c0.26,0.02,0.53,0.04,0.8,0.06c0.21,0.02,0.44,0.04,0.68,0.05H49v4.87C47.29,69.12,45.63,68.82,44.03,68.3z M56.31,70.3l0.56,3.27c-1.9,0.55-3.86,0.87-5.87,0.95v-3.31C52.82,71.13,54.6,70.83,56.31,70.3z M51,69.21v-4.87h0.01c0.24-0.01,0.47-0.03,0.68-0.05c0.27-0.02,0.54-0.04,0.8-0.06c0.24-0.02,0.48-0.05,0.69-0.09c0.01,0,0.02,0,0.02,0c0.49-0.07,0.98-0.15,1.46-0.25c0.04-0.01,0.07-0.01,0.11-0.02l0.06-0.01c0.12-0.03,0.24-0.05,0.36-0.08l0.78,4.52C54.37,68.82,52.71,69.12,51,69.21z M57.13,63.24c0.21-0.07,0.43-0.13,0.64-0.21c0.6-0.2,1.18-0.45,1.76-0.7c0.12-0.06,0.25-0.12,0.38-0.18c0.56-0.26,1.11-0.54,1.64-0.84c0.03-0.02,0.05-0.03,0.08-0.04c0.47,1.03,0.86,2.05,1.2,3.07c-1.5,1.34-3.17,2.42-4.96,3.22L57.13,63.24z M74.72,73.92l0.71-0.66c1.65-1.56,4.19-1.53,5.79,0.08c1.62,1.62,1.62,4.25,0,5.88c-0.93,0.93-2.25,1.36-3.55,1.15l-1.37-0.22l0.22,1.37c0.21,1.3-0.22,2.63-1.16,3.56c-0.78,0.78-1.83,1.22-2.93,1.22c-0.01,0-0.01,0-0.01,0c-1.11-0.01-2.15-0.44-2.93-1.23c-0.79-0.78-1.23-1.83-1.23-2.94c0-1.1,0.43-2.15,1.22-2.93l0.91-0.7l-4.58-4.58c0.41-3.13,0.07-6.49-1-9.9L74.72,73.92z M63.95,70.19c-1.62,1.13-3.35,2.04-5.16,2.73l-0.57-3.32c1.86-0.78,3.61-1.83,5.2-3.13C63.71,67.73,63.88,68.97,63.95,70.19z M61.51,59c-3.45,2.21-7.48,3.31-11.51,3.31s-8.06-1.1-11.51-3.31c-5.09-3.27-8.53-8.44-9.54-14.32c0,0,10.52,0,21.05,0s21.05,0,21.05,0C70.04,50.56,66.6,55.73,61.51,59z M85.63,40.67c0.55,0,1,0.45,1,1c0,0.26-0.11,0.52-0.31,0.72c-0.18,0.19-0.42,0.29-0.69,0.29H14.37c-0.27,0-0.51-0.1-0.69-0.29c-0.2-0.2-0.31-0.46-0.31-0.72c0-0.55,0.45-1,1-1L50,40.68L85.63,40.67z M73.12,37.48c-0.01-0.05-0.02-0.09-0.03-0.13c-0.08-0.53-0.18-1.06-0.29-1.58c-0.02-0.07-0.04-0.14-0.06-0.21c-0.1-0.45-0.23-0.91-0.36-1.35c-0.04-0.13-0.08-0.26-0.12-0.39c-0.16-0.5-0.33-0.99-0.53-1.48c0-0.01-0.01-0.02-0.01-0.02c-0.2-0.5-0.42-0.98-0.65-1.46c-0.03-0.06-0.05-0.11-0.08-0.17l8.2-8.18l-0.67-0.71c-1.56-1.64-1.53-4.19,0.08-5.79c1.62-1.62,4.25-1.62,5.88,0c0.93,0.92,1.36,2.25,1.15,3.55l-0.22,1.37l1.37-0.22c1.3-0.21,2.63,0.22,3.56,1.16c0.79,0.78,1.22,1.83,1.22,2.94s-0.44,2.15-1.23,2.93c-0.78,0.79-1.83,1.23-2.94,1.23s-2.15-0.43-2.93-1.22l-0.69-0.92L73.12,37.48z"/>
    <ellipse fill="currentColor" transform="matrix(0.1602 -0.9871 0.9871 0.1602 -16.2248 83.57)" cx="41" cy="51.32" rx="5.9" ry="5.9"/>
    <path fill="currentColor" d="M52.55,58.55c0,0.97-1.14,1.76-2.55,1.76s-2.55-0.79-2.55-1.76c0-0.98,1.14-1.77,2.55-1.77S52.55,57.57,52.55,58.55z"/>
    <path fill="currentColor" d="M35.692,30.417c-0.151,0-0.306-0.035-0.45-0.107c-0.493-0.25-0.69-0.851-0.441-1.344c0.931-1.841,2.198-3.388,3.766-4.598c0.436-0.337,1.064-0.256,1.402,0.181c0.337,0.437,0.257,1.065-0.181,1.402c-1.33,1.027-2.407,2.345-3.202,3.917C36.41,30.216,36.058,30.417,35.692,30.417z"/>
    <path fill="currentColor" d="M39.648,31.191c-0.087,0-0.175-0.012-0.264-0.036c-0.533-0.145-0.847-0.695-0.702-1.228c0.425-1.558,1.182-2.933,2.25-4.086c0.375-0.405,1.008-0.43,1.414-0.054c0.405,0.375,0.429,1.008,0.054,1.414c-0.859,0.927-1.444,1.991-1.788,3.253C40.491,30.898,40.088,31.191,39.648,31.191z"/>
    <path fill="currentColor" d="M43.519,30.528c-0.117,0-0.235-0.021-0.351-0.064c-0.517-0.194-0.779-0.771-0.585-1.288c0.263-0.7,0.696-1.398,1.29-2.077c0.364-0.416,0.997-0.457,1.411-0.095c0.416,0.364,0.458,0.995,0.095,1.411c-0.435,0.497-0.745,0.989-0.922,1.463C44.304,30.28,43.923,30.528,43.519,30.528z"/>
  </svg>`;
}

function iconTrophy(): string {
  return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M7 5H4v1a4 4 0 0 0 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M17 5h3v1a4 4 0 0 1-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M12 13v3" stroke="currentColor" stroke-width="1.5"/>
    <path d="M9 20h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M10 16.5h4l.6 3.5H9.4l.6-3.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;
}

function iconFriends(): string {
  return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="8" r="2.6" stroke="currentColor" stroke-width="1.5"/>
    <path d="M4 19c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="17" cy="9" r="2.1" stroke="currentColor" stroke-width="1.5"/>
    <path d="M14.5 12.5c.5-.3 1.1-.5 1.7-.5 2.3 0 4 1.7 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

function iconFlagDE(): string {
  return `<svg class="flag-icon" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="20" fill="#000000"/>
    <rect y="6.67" width="30" height="13.33" fill="#DD0000"/>
    <rect y="13.33" width="30" height="6.67" fill="#FFCE00"/>
  </svg>`;
}

function iconFlagGB(): string {
  return `<svg class="flag-icon" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="20" fill="#00247D"/>
    <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" stroke-width="4"/>
    <path d="M0,0 L30,20 M30,0 L0,20" stroke="#CF142B" stroke-width="1.5"/>
    <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" stroke-width="6"/>
    <path d="M15,0 V20 M0,10 H30" stroke="#CF142B" stroke-width="3.5"/>
  </svg>`;
}

function renderNav(): string {
  return `
    <nav class="main-nav">
      <div class="nav-left">
        <picture>
          <source srcset="${import.meta.env.BASE_URL}logo.webp" type="image/webp" />
          <img src="${import.meta.env.BASE_URL}logo.png" alt="${t('app.title')}" class="nav-logo" />
        </picture>
<button class="nav-link ${currentScreen === 'game' ? 'active' : ''}" id="nav-game">${iconSkull()}<span>${t('nav.game')}</span></button>
<button class="nav-link ${currentScreen === 'leaderboard' ? 'active' : ''}" id="nav-leaderboard">${iconTrophy()}<span>${t('nav.leaderboard')}</span></button>
${authUser
      ? `<button class="nav-link ${currentScreen === 'friends' ? 'active' : ''}" id="nav-friends">${iconFriends()}<span>${t('nav.friends')}</span></button>`
      : ''
    }
      </div>
      <div class="nav-right">
        ${renderLanguageSwitcher()}
        ${authUser
      ? `<span class="user-info">${t('nav.loggedInAs')} ${authUser.username}</span>
               <button id="logout-btn" class="link-btn">${t('nav.logout')}</button>`
      : `<button id="show-login-btn" class="link-btn">${t('nav.login')}</button>`
    }
      </div>
    </nav>
  `;
}

function attachNavListeners(): void {
  document.querySelector('#nav-game')?.addEventListener('click', () => {
    currentScreen = 'game';
    renderGame();
  });

  document.querySelector('#nav-leaderboard')?.addEventListener('click', () => {
    currentScreen = 'leaderboard';
    loadLeaderboard();
  });

  document.querySelector('#nav-friends')?.addEventListener('click', () => {
    currentScreen = 'friends';
    loadFriendsData();
  });

  document.querySelector('#show-login-btn')?.addEventListener('click', () => {
    authError = null;
    currentScreen = 'login';
    render();
  });

  document.querySelector('#logout-btn')?.addEventListener('click', () => {
    clearToken();
    authUser = null;
    currentScreen = 'game';
    renderGame();
  });

  document.querySelector('#lang-de')?.addEventListener('click', () => {
    setLanguage('de');
    render();
  });

  document.querySelector('#lang-en')?.addEventListener('click', () => {
    setLanguage('en');
    render();
  });
}