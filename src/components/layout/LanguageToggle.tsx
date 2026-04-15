'use client';

import { useAppStore } from '@/store/useAppStore';
import { Button } from '../ui/Button';
import { Translate } from 'react-bootstrap-icons';

export function LanguageToggle() {
  const { language, toggleLanguage } = useAppStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 text-textMuted hover:text-textMain"
      onClick={toggleLanguage}
    >
      <Translate className="h-4 w-4" />
      <span className="hidden sm:inline text-xs font-bold uppercase">
        {language === 'ar' ? 'EN' : 'AR'}
      </span>
    </Button>
  );
}
