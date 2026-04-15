import React from 'react';
import { translations } from '@/locales/translations';
import { useAppStore } from '@/store/useAppStore';
import { shortcutsList } from '@/hooks/useKeyboardShortcuts';
import { X, Keyboard } from 'react-bootstrap-icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  const { language } = useAppStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border">
        <div className="flex justify-between items-center p-5 border-b border-border bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-xl font-bold text-textMain flex items-center gap-2">
            <Keyboard className="h-6 w-6 text-primary-600" />
            {language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
          </h3>
          <button
            onClick={onClose}
            className="text-textMuted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 max-h-[65vh] overflow-y-auto w-full">
          <div className="grid grid-cols-1 gap-3">
            {shortcutsList.map((sc, i) => (
              <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                <span className="text-sm font-medium text-textMain">
                  {sc.description}
                </span>
                <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono font-bold shadow-inner flex items-center gap-1.5 text-primary-600 dark:text-primary-400 min-w-10 justify-center">
                  {sc.ctrl && <span>Ctrl + </span>}
                  {sc.alt && <span>Alt + </span>}
                  {sc.shift && <span>Shift + </span>}
                  <span>{sc.key === 'Escape' ? 'Esc' : sc.key.toUpperCase()}</span>
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-100/50 dark:bg-gray-900/80 border-t border-border text-center text-sm font-medium text-textMuted">
          {language === 'ar' ? 'يمكنك فتح هذه القائمة في أي وقت بالضغط على Ctrl + ?' : 'Press Ctrl + ? anywhere to open this menu'}
        </div>
      </div>
    </div>
  );
}
