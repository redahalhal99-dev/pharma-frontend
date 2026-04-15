'use client';

import { List, WifiOff, CloudUpload } from 'react-bootstrap-icons';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useAuthStore } from '@/store/useAuth';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePathname } from 'next/navigation';
import { translations } from '@/locales/translations';
import { Sun, Moon, FileEarmarkText } from 'react-bootstrap-icons';
import { ShiftClosureModal } from './ShiftClosureModal';

// Map pathnames to page titles
function usePageTitle(language: string) {
  const pathname = usePathname();
  const t = translations[language as keyof typeof translations];

  const titles: Record<string, string> = {
    '/':           language === 'ar' ? 'لوحة القيادة' : 'Dashboard',
    '/pos':        language === 'ar' ? 'نقطة البيع' : 'Point of Sale',
    '/products':   language === 'ar' ? 'المنتجات' : 'Products',
    '/returns':    language === 'ar' ? 'المرتجعات' : 'Returns',
    '/accounting': language === 'ar' ? 'المحاسبة' : 'Accounting',
    '/users':      language === 'ar' ? 'المستخدمون' : 'Users',
    '/ai-chat':    language === 'ar' ? 'المساعد الذكي' : 'AI Assistant',
    '/profile':    language === 'ar' ? 'حسابي' : 'My Profile',
    '/pharmacies': language === 'ar' ? 'الصيدليات' : 'Pharmacies',
    '/settings':   language === 'ar' ? 'الإعدادات' : 'Settings',
    '/branches':   language === 'ar' ? 'الفروع' : 'Branches',
    '/suppliers':  language === 'ar' ? 'الموردون' : 'Suppliers',
    '/purchases':  language === 'ar' ? 'أوامر الشراء' : 'Purchase Orders',
    '/sales':      language === 'ar' ? 'سجل المبيعات' : 'Sales History',
  };

  // Find matching title (handle sub-routes)
  for (const [path, title] of Object.entries(titles)) {
    if (path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/')) {
      return title;
    }
  }
  return 'Pharma.M';
}

export function TopNav() {
  const { user, isSubscriptionExpired } = useAuthStore();
  const { toggleSidebar, language, currentShift, setShift } = useAppStore();
  const { isOffline, isSyncing, pendingSales, setOfflineStatus, syncPendingSales } = useOfflineStore();
  const pageTitle = usePageTitle(language);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Monitor online status + auto-sync on reconnect
  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus(false);
      setTimeout(() => syncPendingSales(language), 1500);
    };
    const handleOffline = () => setOfflineStatus(true);

    setOfflineStatus(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus, language]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          <List className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-textMain leading-none">{pageTitle}</h1>
          {isSubscriptionExpired && (
            <span className="text-xs font-medium text-red-500 mt-0.5 block">
              ⚠️ {language === 'ar' ? 'الاشتراك منتهي' : 'Subscription Expired'}
            </span>
          )}
        </div>
      </div>

      {/* Right: Controls + User */}
      <div className="flex items-center gap-1.5">
        
        {/* Offline & Sync Status */}
        {isOffline && (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-lg text-xs font-bold whitespace-nowrap">
            <WifiOff className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'ar' ? 'غير متصل' : 'Offline'}</span>
          </div>
        )}
        
        {!isOffline && pendingSales.length > 0 && (
          <button
            onClick={() => syncPendingSales(language)}
            disabled={isSyncing}
            className={`flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 rounded-lg text-xs font-bold transition-all hover:bg-primary-200 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Sync offline data"
          >
            <CloudUpload className={`h-4 w-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span>{pendingSales.length}</span>
          </button>
        )}

        <NotificationBell />
        <ThemeToggle />
        <LanguageToggle />

        {/* Shift Management */}
        {user?.role !== 'admin' && (
          <div className="hidden sm:flex items-center gap-1 border-l border-border ltr:pl-3 rtl:pr-3 ltr:ml-1 rtl:mr-1">
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FileEarmarkText className="h-4 w-4" />
              <span className="hidden lg:inline">{language === 'ar' ? 'تقفيل' : 'Close'}</span>
            </button>
            <button
              onClick={() => setShift(currentShift === 'morning' ? 'evening' : 'morning')}
              title={language === 'ar' ? 'تغيير الشيفت' : 'Change Shift'}
              className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                currentShift === 'morning' 
                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
            >
              {currentShift === 'morning' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <ShiftClosureModal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} />
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 border-l border-border ltr:pl-3 rtl:pr-3 ltr:ml-1 rtl:mr-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-bold text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold leading-none text-textMain">{user?.name || 'User'}</span>
            <span className="text-[11px] text-textMuted mt-0.5 capitalize">{user?.role || 'Guest'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
