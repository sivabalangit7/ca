const STORAGE_PREFIX = 'nutritrack_india_';
const PIN_STORAGE_KEY = `security_pin_hash`;
const PIN_ENABLED_KEY = `security_pin_enabled`;

// Keys that are global (device-wide settings, shared across user accounts)
const GLOBAL_KEYS = new Set([
  'color_theme',
  'nutritrack_custom_api_url',
  'nutritrack_custom_api_key',
  'nutritrack_auth_user',
  'nutritrack_local_accounts',
]);

// Current active user ID for storage partitioning
let activeUserId: string | null = null;

// Initialize activeUserId from cached auth user if available
if (typeof window !== 'undefined') {
  try {
    const rawAuth = localStorage.getItem('nutritrack_auth_user');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      if (parsed && (parsed.email || parsed.uid)) {
        activeUserId = (parsed.email || parsed.uid).trim().toLowerCase();
      }
    }
  } catch {
    /* ignore */
  }
}

export function setStorageUserId(userId: string | null): void {
  activeUserId = userId ? userId.trim().toLowerCase() : null;
}

export function getStorageUserId(): string | null {
  return activeUserId;
}

export function getStorageKey(key: string): string {
  // If key is a device-wide global key, keep global prefix
  if (GLOBAL_KEYS.has(key)) {
    return `${STORAGE_PREFIX}${key}`;
  }

  // If a user is logged in, partition all user data by user's email/id
  if (activeUserId) {
    const safeUser = activeUserId.replace(/[^a-z0-9_.-]/g, '_');
    return `nutritrack_u_${safeUser}_${key}`;
  }

  // Fallback for guest or pre-login state
  return `nutritrack_guest_${key}`;
}

// Simple deterministic hash for integrity verification
function computeChecksum(dataStr: string): string {
  let hash = 5381;
  for (let i = 0; i < dataStr.length; i++) {
    hash = (hash * 33) ^ dataStr.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// Simple salted hash for local passcode lock
function hashPin(pin: string): string {
  const salt = 'nutri_secure_';
  let hash = 0x811c9dc5;
  const str = salt + pin;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

export const storageService = {
  setUserId(userId: string | null): void {
    setStorageUserId(userId);
  },

  getUserId(): string | null {
    return getStorageUserId();
  },

  hasKey(key: string): boolean {
    try {
      return localStorage.getItem(getStorageKey(key)) !== null;
    } catch (err) {
      console.error(`Failed to check key existence: ${key}`, err);
      return false;
    }
  },

  saveData<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      const envelope = {
        payload: serialized,
        v: 1,
        cs: computeChecksum(serialized),
        ts: Date.now()
      };
      localStorage.setItem(getStorageKey(key), JSON.stringify(envelope));
    } catch (err) {
      console.error(`Failed to save data for key: ${key}`, err);
    }
  },

  getData<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(getStorageKey(key));
      if (raw === null || raw === undefined) return fallback;

      // Handle both legacy un-enveloped and new enveloped formats
      let parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && 'payload' in parsed && 'cs' in parsed) {
        // Enveloped format: verify integrity checksum
        const calculatedCs = computeChecksum(parsed.payload);
        if (calculatedCs !== parsed.cs) {
          console.warn(`Tamper or corruption detected for key ${key}!`);
        }
        return JSON.parse(parsed.payload) as T;
      }
      return parsed as T;
    } catch (err) {
      console.warn(`Corrupted or missing data for key: ${key}. Falling back to default.`, err);
      return fallback;
    }
  },

  updateData<T>(key: string, updater: (prev: T) => T, fallback: T): T {
    try {
      const current = storageService.getData<T>(key, fallback);
      const updated = updater(current);
      storageService.saveData(key, updated);
      return updated;
    } catch (err) {
      console.error(`Failed to update data for key: ${key}`, err);
      return fallback;
    }
  },

  deleteData(key: string): void {
    try {
      localStorage.removeItem(getStorageKey(key));
    } catch (err) {
      console.error(`Failed to delete key: ${key}`, err);
    }
  },

  clearAllData(preserveKeys: string[] = []): void {
    try {
      const preservedFullKeys = new Set(preserveKeys.map(getStorageKey));
      const keysToRemove: string[] = [];
      const userPrefix = activeUserId
        ? `nutritrack_u_${activeUserId.replace(/[^a-z0-9_.-]/g, '_')}_`
        : 'nutritrack_guest_';

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (preservedFullKeys.has(k)) continue;

        // Only remove current user partition or old legacy unpartitioned keys
        if (k.startsWith(userPrefix) || (k.startsWith(STORAGE_PREFIX) && !k.includes('nutritrack_u_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.error('Failed to clear app storage data', err);
    }
  },

  // Security & Passcode Lock Functions
  isPinLockEnabled(): boolean {
    try {
      return localStorage.getItem(PIN_ENABLED_KEY) === 'true';
    } catch {
      return false;
    }
  },

  setSecurityPin(pin: string | null): void {
    try {
      if (pin && pin.trim().length >= 4) {
        localStorage.setItem(PIN_STORAGE_KEY, hashPin(pin.trim()));
        localStorage.setItem(PIN_ENABLED_KEY, 'true');
      } else {
        localStorage.removeItem(PIN_STORAGE_KEY);
        localStorage.setItem(PIN_ENABLED_KEY, 'false');
      }
    } catch (err) {
      console.error('Failed to update PIN', err);
    }
  },

  verifyPin(inputPin: string): boolean {
    try {
      const stored = localStorage.getItem(PIN_STORAGE_KEY);
      if (!stored) return true;
      return stored === hashPin(inputPin.trim());
    } catch {
      return false;
    }
  },

  // Complete Local Data Export & Restore (for offline / client-only mode)
  exportFullClientBackup(): string {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX) && !k.includes('security_pin')) {
        backup[k] = localStorage.getItem(k);
      }
    }
    return JSON.stringify({
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      data: backup
    }, null, 2);
  },

  restoreFullClientBackup(jsonString: string): { success: boolean; keyCount: number } {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;
      if (typeof data !== 'object') throw new Error('Invalid backup format');

      let count = 0;
      for (const [k, v] of Object.entries(data)) {
        if (typeof k === 'string' && k.startsWith(STORAGE_PREFIX) && typeof v === 'string') {
          localStorage.setItem(k, v);
          count++;
        }
      }
      return { success: true, keyCount: count };
    } catch (err) {
      console.error('Failed to restore backup', err);
      return { success: false, keyCount: 0 };
    }
  }
};

