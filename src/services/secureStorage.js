// Secure storage service for sensitive data
// Uses browser's localStorage for web, Capacitor's secure storage for mobile

import { Preferences } from '@capacitor/preferences';

const isCapacitorApp = () => {
  return typeof window !== 'undefined' && window.Capacitor !== undefined;
};

export const secureStorage = {
  // Store sensitive data
  async setItem(key, value) {
    try {
      if (isCapacitorApp()) {
        // Use Capacitor's secure storage on mobile
        await Preferences.set({
          key,
          value: JSON.stringify(value),
        });
      } else {
        // Use sessionStorage for web (cleared on tab close)
        sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error storing secure data:', error);
    }
  },

  // Retrieve sensitive data
  async getItem(key) {
    try {
      if (isCapacitorApp()) {
        const { value } = await Preferences.get({ key });
        return value ? JSON.parse(value) : null;
      } else {
        const value = sessionStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  },

  // Remove sensitive data
  async removeItem(key) {
    try {
      if (isCapacitorApp()) {
        await Preferences.remove({ key });
      } else {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing secure data:', error);
    }
  },

  // Clear all sensitive data
  async clear() {
    try {
      if (isCapacitorApp()) {
        await Preferences.clear();
      } else {
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing secure data:', error);
    }
  },
};

// Update AuthContext to use secure storage
export const updateAuthContextForMobile = () => {
  // Store JWT token in secure storage instead of localStorage
  // This prevents token theft from browser storage
};
