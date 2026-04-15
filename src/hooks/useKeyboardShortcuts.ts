import { useEffect } from 'react';

type ShortcutKeys = string;

interface ShortcutConfig {
  key: ShortcutKeys;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: (e?: KeyboardEvent) => void;
  description: string;
}

export const shortcutsList: ShortcutConfig[] = [
  { key: 'F2', action: () => {}, description: 'بحث في المنتجات (البدء)' },
  { key: 'F4', action: () => {}, description: 'إضافة عميل جديد' },
  { key: 'F7', action: () => {}, description: 'تبديل نافذة الدفع المتعدد' },
  { key: 'F8', action: () => {}, description: 'إدخال خصم على السلة' },
  { key: 'F9', action: () => {}, description: 'تعليق الفاتورة (حفظ مؤقت)' },
  { key: 'F10', action: () => {}, description: 'استرجاع الفواتير المعلقة (الديون/الآجل)' },
  { key: 'F12', action: () => {}, description: 'إتمام البيع فوراً (دفع نقدي)' },
  { key: 'Escape', action: () => {}, description: 'إغلاق النوافذ / إلغاء بحث' },
  { key: 'k', ctrl: true, action: () => {}, description: 'بحث شامل' },
  { key: 'Enter', ctrl: true, action: () => {}, description: 'تأكيد العملية من أي مكان' },
  { key: '?', ctrl: true, action: () => {}, description: 'إظهار اختصارات لوحة المفاتيح' },
];

export function useKeyboardShortcuts(configs: Omit<ShortcutConfig, 'description'>[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow keydowns in inputs unless it's an F-key or Escape or explicit modifier combinations
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
      const isFKeyOrEsc = e.key.startsWith('F') || e.key === 'Escape' || (e.ctrlKey && e.key === '?') || (e.ctrlKey && e.key === 'Enter');

      if (isInput && !isFKeyOrEsc && !e.ctrlKey && !e.altKey) {
        return;
      }

      for (const config of configs) {
        const matchesKey = e.key.toLowerCase() === config.key.toLowerCase();
        const matchesCtrl = !!config.ctrl === e.ctrlKey;
        const matchesAlt = !!config.alt === e.altKey;
        const matchesShift = !!config.shift === e.shiftKey;

        if (matchesKey && matchesCtrl && matchesAlt && matchesShift) {
          e.preventDefault(); 
          config.action(e);
          return; 
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [configs]);
}
