import { useState, useEffect } from 'react';
import { LocalDBService } from '../utils/localdb';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => 
    LocalDBService.getTheme()
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    LocalDBService.setTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme };
}