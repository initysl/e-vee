'use client';

export const SESSION_KEY = 'shophub_session_id';

// Check if user has an active session

export const hasSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(SESSION_KEY);
};

// Get session ID
export const getSession = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
};

// Create new session
export const createSession = (sessionId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, sessionId);
};

/**
 * Clear session (logout)
 */
export const clearSession = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
};
