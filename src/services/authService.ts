// Authentication Service - Normal Database Login & Registration with Robust Offline Support
import { apiService } from './apiService';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

const AUTH_STORAGE_KEY = 'nutritrack_auth_user';
const LOCAL_USERS_KEY = 'nutritrack_local_accounts';

/**
 * Checks whether the error was caused by a network disconnection or the server returning HTML
 * (such as a 404/SPA index.html fallback) instead of JSON.
 */
function isNetworkOrHtmlError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('doctype') ||
    msg.includes('unexpected token') ||
    msg.includes('valid json') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('backend_unreachable') ||
    err.name === 'SyntaxError' ||
    err.name === 'TypeError'
  );
}

function getLocalAccounts(): Record<string, { email: string; name: string; password?: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccount(email: string, name: string, password?: string) {
  try {
    const accs = getLocalAccounts();
    accs[email.toLowerCase()] = { email: email.toLowerCase(), name, password };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accs));
  } catch {
    /* ignore */
  }
}

/**
 * Normal Login with Email and Password
 * Connects to SQLite backend when available; seamlessly falls back to offline storage otherwise.
 */
export async function loginWithCredentials(email: string, password: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address (e.g. user@gmail.com)');
  }
  if (!password || password.length < 1) {
    throw new Error('Please enter your password');
  }

  try {
    const res = await apiService.loginUser(cleanEmail, password);
    const authUser: AuthUser = {
      uid: res.user.email,
      email: res.user.email,
      displayName: res.user.name || res.user.email.split('@')[0],
      photoURL: null,
    };
    cacheAuthUser(authUser);
    saveLocalAccount(cleanEmail, authUser.displayName, password);
    apiService.setUserId(authUser.email);
    return authUser;
  } catch (err: any) {
    // If backend returns a real error like "Incorrect password" or "No account found", throw it!
    if (!isNetworkOrHtmlError(err)) {
      throw err;
    }

    // Backend is unreachable or running offline: use local account storage
    const accounts = getLocalAccounts();
    const localUser = accounts[cleanEmail];
    if (localUser && localUser.password && localUser.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    const displayName = localUser?.name || cleanEmail.split('@')[0];
    const authUser: AuthUser = {
      uid: cleanEmail,
      email: cleanEmail,
      displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      photoURL: null,
    };

    cacheAuthUser(authUser);
    saveLocalAccount(cleanEmail, authUser.displayName, password);
    apiService.setUserId(cleanEmail);
    return authUser;
  }
}

/**
 * Normal Registration with Email, Password and Name
 * Creates a new user row in the database and initializes their profile.
 */
export async function registerWithCredentials(email: string, password: string, name?: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address (e.g. user@gmail.com)');
  }
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters long');
  }

  const rawName = name?.trim() || cleanEmail.split('@')[0];
  const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  try {
    const res = await apiService.registerUser(cleanEmail, password, cleanName);
    const authUser: AuthUser = {
      uid: res.user.email,
      email: res.user.email,
      displayName: res.user.name,
      photoURL: null,
    };
    cacheAuthUser(authUser);
    saveLocalAccount(cleanEmail, cleanName, password);
    apiService.setUserId(authUser.email);
    return authUser;
  } catch (err: any) {
    // If backend reports an actual duplicate account, propagate that error
    if (!isNetworkOrHtmlError(err)) {
      throw err;
    }

    // If offline / network error / HTML fallback, register locally so the user is never blocked
    const authUser: AuthUser = {
      uid: cleanEmail,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: null,
    };
    cacheAuthUser(authUser);
    saveLocalAccount(cleanEmail, cleanName, password);
    apiService.setUserId(cleanEmail);
    return authUser;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  cacheAuthUser(null);
  apiService.setUserId(null);
}

/**
 * Save auth user data to localStorage
 */
export function cacheAuthUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Get cached auth user from localStorage
 */
export function getCachedAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignore */
  }
  return null;
}
