import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => profileService.getTheme());

  useEffect(() => {
    profileService.saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
