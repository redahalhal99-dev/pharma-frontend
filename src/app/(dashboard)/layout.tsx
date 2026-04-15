'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuth';
import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { ArrowRepeat, Tools } from 'react-bootstrap-icons';
import axiosInstance from '@/lib/axios';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { language } = useAppStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  useEffect(() => {
    setIsMounted(true);
    if (!token || !user) {
      router.push('/login');
      return;
    }

    // Check maintenance mode (skip for admin)
    if (user.role !== 'admin') {
      axiosInstance.get('/settings/maintenance').then(res => {
        if (res.data.is_maintenance) {
          setIsMaintenance(true);
          setMaintenanceMsg(res.data.message);
        }
      }).catch(() => {});
    }
  }, [token, user, router]);

  if (!isMounted || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <ArrowRepeat className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Show maintenance page for non-admin when maintenance is active
  if (isMaintenance && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-amber-500/20 border border-amber-500/30">
            <Tools className="h-14 w-14 text-amber-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">🛠️ { language === 'ar' ? 'تحت الصيانة' : 'Under Maintenance'}</h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">{maintenanceMsg}</p>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-1.5 w-6 rounded-full bg-amber-500/60 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">Pharma.M System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Sidebar />
      <div className="flex flex-col ltr:lg:pl-64 rtl:lg:pr-64 min-h-screen">
        <TopNav />
        <main className="main-content flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
