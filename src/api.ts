import type { AuthUser, FriendDto, FriendRequestDto, HighscoreEntryDto } from './types';
import { t } from './i18n';

const API_URL = import.meta.env.VITE_API_URL;

function getToken(): string | null {
  return localStorage.getItem('authToken');
}

function setToken(token: string): void {
  localStorage.setItem('authToken', token);
}

export function clearToken(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

function getFriendlyErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return t('error.badRequest');
    case 401:
      return t('error.unauthorized');
    case 403:
      return t('error.forbidden');
    case 404:
      return t('error.notFound');
    case 409:
      return t('error.conflict');
    case 500:
    case 502:
    case 503:
      return t('error.server');
    default:
      return t('error.generic');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
        });
    } catch {
        throw new Error(t('error.network'));
    }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || getFriendlyErrorMessage(response.status);
    throw new Error(message);
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function register(username: string, password: string): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const result = await request<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  setToken(result.token);
  setStoredUser(result.user);
  return result.user;
}

export async function submitScore(score: number): Promise<void> {
  await request('/api/highscores', {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

export async function getGlobalLeaderboard(): Promise<HighscoreEntryDto[]> {
  return request<HighscoreEntryDto[]>('/api/highscores/global');
}

export async function getFriendsLeaderboard(): Promise<HighscoreEntryDto[]> {
  return request<HighscoreEntryDto[]>('/api/highscores/friends');
}

export async function sendFriendRequest(username: string): Promise<void> {
  await request('/api/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function getPendingRequests(): Promise<FriendRequestDto[]> {
  return request<FriendRequestDto[]>('/api/friends/requests');
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await request(`/api/friends/requests/${requestId}/accept`, { method: 'POST' });
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await request(`/api/friends/requests/${requestId}/decline`, { method: 'POST' });
}

export async function getFriends(): Promise<FriendDto[]> {
  return request<FriendDto[]>('/api/friends');
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

function setStoredUser(user: AuthUser): void {
  localStorage.setItem('authUser', JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('authUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}