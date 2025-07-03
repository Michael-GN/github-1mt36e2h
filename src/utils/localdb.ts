import type { SyncStatus } from '../types';

export class LocalDBService {
  private static readonly STORAGE_KEYS = {
    THEME: 'rollcall_theme',
  } as const;

  // Disabled sync status (no longer used)
  static getSyncStatus(): SyncStatus {
    return {
      lastSync: new Date().toISOString(),
      pendingCount: 0,
      isOnline: navigator.onLine,
      isSyncing: false,
    };
  }

  static updateSyncStatus(updates: Partial<SyncStatus>): void {
    // Disabled - no sync functionality
    console.log('Sync disabled - no status updates');
  }

  // Theme Management
  static getTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.THEME);
      return (stored as 'light' | 'dark') || 'light';
    } catch (error) {
      console.error('LocalDB Error - getTheme:', error);
      return 'light';
    }
  }

  static setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('LocalDB Error - setTheme:', error);
    }
  }

  // Cache Management
  static cacheData(key: string, data: any): void {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 60 * 1000), // 30 minutes
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('LocalDB Error - cacheData:', error);
    }
  }

  static getCachedData(key: string): any | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const cacheItem = JSON.parse(stored);
      if (Date.now() > cacheItem.expires) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('LocalDB Error - getCachedData:', error);
      return null;
    }
  }

  static clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('rollcall_cached_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('LocalDB Error - clearCache:', error);
    }
  }
}