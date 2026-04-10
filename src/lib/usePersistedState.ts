import { useState, useEffect } from 'react';

/**
 * A state persistence hook to protect user data from network drops or accidental tab closures.
 * Syncs standard React state directly with browser HTML5 localStorage.
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Try reading initial state from localstorage, fallback to initialValue
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Sync back to localstorage whenever the state updates
  useEffect(() => {
    try {
      if (state === undefined || state === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}
