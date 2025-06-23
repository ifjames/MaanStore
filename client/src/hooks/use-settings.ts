import { useState, useEffect } from 'react';
import { settingsService, type UserSettings } from '@/lib/settings';

/**
 * Hook to manage user settings with reactive updates
 */
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(settingsService.getSettings());

  // Reload settings when localStorage changes (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'maans-store-settings') {
        setSettings(settingsService.getSettings());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    settingsService.saveSettings(newSettings);
    setSettings(settingsService.getSettings());
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    settingsService.saveSetting(key, value);
    setSettings(settingsService.getSettings());
  };

  return {
    settings,
    updateSettings,
    updateSetting,
    lowStockThreshold: settings.lowStockThreshold,
    theme: settings.theme,
    currency: settings.currency,
    notifications: settings.notifications,
  };
}

/**
 * Hook specifically for low stock threshold
 */
export function useLowStockThreshold() {
  const { lowStockThreshold, updateSetting } = useSettings();
  
  const setLowStockThreshold = (threshold: number) => {
    updateSetting('lowStockThreshold', threshold);
  };

  return {
    lowStockThreshold,
    setLowStockThreshold,
  };
}
