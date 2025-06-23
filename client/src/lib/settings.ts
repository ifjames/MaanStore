// Settings utility for managing user preferences
export interface UserSettings {
  lowStockThreshold: number;
  theme: string;
  currency: string;
  notifications: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  lowStockThreshold: 10,
  theme: 'system',
  currency: 'PHP',
  notifications: true,
};

const SETTINGS_KEY = 'maans-store-settings';

export const settingsService = {
  // Get all settings
  getSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  },

  // Save all settings
  saveSettings(settings: Partial<UserSettings>): void {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
      throw error;
    }
  },

  // Get a specific setting
  getSetting<K extends keyof UserSettings>(key: K): UserSettings[K] {
    return this.getSettings()[key];
  },

  // Save a specific setting
  saveSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    this.saveSettings({ [key]: value } as Partial<UserSettings>);
  },

  // Get low stock threshold specifically
  getLowStockThreshold(): number {
    return this.getSetting('lowStockThreshold');
  },

  // Save low stock threshold specifically
  saveLowStockThreshold(threshold: number): void {
    this.saveSetting('lowStockThreshold', threshold);
  },

  // Reset to defaults
  resetSettings(): void {
    localStorage.removeItem(SETTINGS_KEY);
  },
};

// Legacy support for existing localStorage keys
export const migrateLegacySettings = () => {
  try {
    // Migrate old lowStockThreshold if it exists
    const oldThreshold = localStorage.getItem('lowStockThreshold');
    if (oldThreshold && !localStorage.getItem(SETTINGS_KEY)) {
      settingsService.saveLowStockThreshold(parseInt(oldThreshold));
      localStorage.removeItem('lowStockThreshold');
    }

    // Migrate old currency if it exists
    const oldCurrency = localStorage.getItem('currency');
    if (oldCurrency && !localStorage.getItem(SETTINGS_KEY)) {
      settingsService.saveSetting('currency', oldCurrency);
      localStorage.removeItem('currency');
    }
  } catch (error) {
    console.warn('Failed to migrate legacy settings:', error);
  }
};
