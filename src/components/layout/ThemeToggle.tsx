'use client';

import { useAppStore } from '@/store/useAppStore';
import { Button } from '../ui/Button';
import { MoonStarsFill, SunFill } from 'react-bootstrap-icons';

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <SunFill className="h-5 w-5 text-yellow-500" />
      ) : (
        <MoonStarsFill className="h-4 w-4 text-primary-600" />
      )}
    </Button>
  );
}
