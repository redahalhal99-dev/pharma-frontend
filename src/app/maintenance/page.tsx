'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { useAppStore } from '@/store/useAppStore';
import { Tools, Clock } from 'react-bootstrap-icons';

export default function MaintenancePage() {
  const { language } = useAppStore();
  const [message, setMessage] = useState(
    language === 'ar' ? 'النظام تحت الصيانة حالياً. سنعود قريباً.' : 'System is under maintenance. We\'ll be back soon.'
  );

  useEffect(() => {
    axiosInstance.get('/settings/maintenance').then(res => {
      if (res.data?.message) setMessage(res.data.message);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
          <Tools className="h-14 w-14 text-amber-400 animate-pulse" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-3">
          {language === 'ar' ? '🛠️ تحت الصيانة' : '🛠️ Under Maintenance'}
        </h1>
        <p className="text-slate-300 text-lg mb-8 leading-relaxed">{message}</p>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Clock className="h-4 w-4" />
          <span>{language === 'ar' ? 'يرجى المحاولة لاحقاً' : 'Please try again later'}</span>
        </div>

        <div className="mt-10">
          <div className="flex gap-1 justify-center">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="h-1.5 w-6 rounded-full bg-amber-500/60 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">Pharma.M System</p>
        </div>
      </div>
    </div>
  );
}
