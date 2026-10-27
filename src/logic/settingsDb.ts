/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameSettings {
  isMuted: boolean;
  soundVolume: number; // 0 - 100
  combatSpeed: 'normal' | 'fast';
  orientationMode: 'auto' | 'landscape' | 'portrait';
  autoSkipAnimations: boolean;
  language: 'ru' | 'en';
}

const STORAGE_KEY_SETTINGS = 'quantum_sparks_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  isMuted: false,
  soundVolume: 80,
  combatSpeed: 'normal',
  orientationMode: 'auto',
  autoSkipAnimations: false,
  language: 'ru',
};

export class SettingsDatabase {
  public static loadSettings(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      console.error('Failed to load settings from storage', e);
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: Partial<GameSettings>): GameSettings {
    try {
      const current = this.loadSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save settings to storage', e);
      return DEFAULT_SETTINGS;
    }
  }

  public static resetSettings(): GameSettings {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }
}
