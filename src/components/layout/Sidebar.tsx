'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import {
  Speedometer2,
  Cart4,
  BoxSeam,
  Calculator,
  Shop,
  PeopleFill,
  Robot,
  BoxArrowRight,
  ArrowCounterclockwise,
  PersonCircle,
  GearFill,
  FileEarmarkText,
  Download,
} from 'react-bootstrap-icons';
import { useAuthStore } from '@/store/useAuth';
import { usePWA } from '@/hooks/usePWA';

export function Sidebar() {
  const pathname = usePathname();
  const { language, isSidebarOpen, setSidebarOpen } = useAppStore();
  const t = translations[language];
  const { logout, user } = useAuthStore();
  const { isInstallable, installApp } = usePWA();

  const navItems: { href: string; label: string; icon: any }[] = [];

  if (user?.role === 'admin') {
    navItems.push(
      { href: '/',               label: t.dashboard,    icon: Speedometer2 },
      { href: '/pharmacies',     label: t.pharmacies,   icon: Shop },
      { href: '/users',          label: t.users,        icon: PeopleFill },
      { href: '/admin-support',  label: language === 'ar' ? 'رسائل الدعم' : 'Support Inbox', icon: Robot } // Use an appropriate icon
    );
  } else {
    navItems.push(
      { href: '/',           label: t.dashboard,               icon: Speedometer2 },
      { href: '/pos',        label: t.pos,                     icon: Cart4 },
      { href: '/products',   label: t.products,                icon: BoxSeam },
      { href: '/sales',      label: t.salesHistory,            icon: FileEarmarkText },
      { href: '/debts',      label: language === 'ar' ? 'الشكك (الديون)' : 'Debts', icon: Calculator },
      { href: '/returns',    label: t.returns || 'المرتجعات',  icon: ArrowCounterclockwise },
    );

    if (user?.role === 'doctor') {
      navItems.push(
        { href: '/accounting', label: t.accounting, icon: Calculator },
        { href: '/users',      label: t.users,      icon: PeopleFill },
      );
    }

    if (!user?.pharmacy || user.pharmacy.ai_enabled) {
      navItems.push({ href: '/ai-chat', label: t.aiAssistant, icon: Robot });
    }

    navItems.push({ href: '/support', label: language === 'ar' ? 'الدعم الفني' : 'Support', icon: Robot });
  }

  navItems.push(
    { href: '/profile',  label: language === 'ar' ? 'حسابي' : 'My Profile', icon: PersonCircle },
    { href: '/settings', label: t.settings, icon: GearFill }
  );

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 ltr:left-0 rtl:right-0 z-50 w-64 flex-col bg-surface border-border ltr:border-r rtl:border-l">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-5 gap-3 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-md">
            <img src="/logo.png" alt="Pharma.M" className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div>
            <h1 className="text-base font-bold text-textMain leading-none">Pharma.M</h1>
            <p className="text-[11px] text-textMuted mt-0.5 leading-none capitalize">
              {user?.role === 'admin' ? (language === 'ar' ? 'مدير النظام' : 'Admin') :
               user?.role === 'doctor' ? (language === 'ar' ? 'طبيب' : 'Doctor') :
               (language === 'ar' ? 'كاشير' : 'Cashier')}
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4 gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive(item.href)
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'text-textMuted hover:bg-slate-100 hover:text-textMain dark:hover:bg-white/5'
              )}
            >
              <item.icon className="h-[1.1rem] w-[1.1rem] shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 shrink-0">
              <PersonCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-textMain truncate">{user?.name}</p>
              <p className="text-[11px] text-textMuted truncate">{user?.email}</p>
            </div>
          </div>

          {isInstallable && (
            <button
              onClick={installApp}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 mb-1 text-sm font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100 dark:border-primary-800"
            >
              <Download className="h-4 w-4 shrink-0" />
              {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <BoxArrowRight className="h-4 w-4 shrink-0" />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* ── Mobile Backdrop ───────────────────────────────────────── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Slide-in Sidebar (hamburger) ───────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex w-72 flex-col bg-surface border-border shadow-2xl lg:hidden sidebar-transition',
          'ltr:left-0 rtl:right-0 ltr:border-r rtl:border-l',
          isSidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-5 gap-3 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-md">
            <img src="/logo.png" alt="Pharma.M" className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div>
            <h1 className="text-base font-bold text-textMain leading-none">Pharma.M</h1>
            <p className="text-[11px] text-textMuted mt-0.5 leading-none capitalize">
              {user?.role === 'admin' ? (language === 'ar' ? 'مدير النظام' : 'Admin') :
               user?.role === 'doctor' ? (language === 'ar' ? 'طبيب' : 'Doctor') :
               (language === 'ar' ? 'كاشير' : 'Cashier')}
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4 gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                isActive(item.href)
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'text-textMuted hover:bg-slate-100 hover:text-textMain dark:hover:bg-white/5'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 shrink-0">
              <PersonCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-textMain truncate">{user?.name}</p>
              <p className="text-[11px] text-textMuted truncate">{user?.email}</p>
            </div>
          </div>

          {isInstallable && (
            <button
              onClick={installApp}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 mb-1 text-sm font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100 dark:border-primary-800"
            >
              <Download className="h-4 w-4 shrink-0" />
              {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <BoxArrowRight className="h-4 w-4 shrink-0" />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────── */}
      <nav className="bottom-nav fixed bottom-0 inset-x-0 z-40 lg:hidden bg-surface/95 backdrop-blur-md border-t border-border px-2 pt-2 pb-3">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[3rem]',
                  active
                    ? 'text-primary-600'
                    : 'text-textMuted hover:text-textMain'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center rounded-full p-1.5 transition-all',
                  active ? 'bg-primary-100 dark:bg-primary-900/40' : ''
                )}>
                  <item.icon className={cn('h-5 w-5', active ? 'text-primary-600' : '')} />
                </div>
                <span className={cn('text-[10px] font-medium leading-none', active ? 'text-primary-600' : '')}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
