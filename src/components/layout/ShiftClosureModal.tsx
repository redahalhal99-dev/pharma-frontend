'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import axiosInstance from '@/lib/axios';
import { ArrowRepeat, FileEarmarkText, Printer, X } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

interface ShiftSummary {
  shift: string;
  date: string;
  total_revenue: number;
  total_expenses: number;
  total_refunds: number;
  net_cash: number;
}

export function ShiftClosureModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language, currentShift, setShift } = useAppStore();
  const isAr = language === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [password, setPassword] = useState('');
  const [summary, setSummary] = useState<ShiftSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSummary = async () => {
        setIsLoading(true);
        try {
          const res = await axiosInstance.get(`/reports/shift-summary?shift=${currentShift}`);
          setSummary(res.data);
        } catch {
          toast.error(isAr ? 'فشل جلب أرقام الشيفت' : 'Failed to fetch shift summary');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
      setPassword('');
    }
  }, [isOpen, currentShift, isAr]);

  const handleCloseShift = async () => {
    if (!password) {
      toast.error(isAr ? 'برجاء إدخال كلمة المرور' : 'Please enter password');
      return;
    }

    setIsClosing(true);
    try {
      await axiosInstance.post('/reports/close-shift', {
        password,
        shift: currentShift,
        date: summary?.date || new Date().toISOString().split('T')[0],
      });

      toast.success(isAr ? 'تم قفل الوردية بنجاح ✅' : 'Shift closed successfully ✅');
      setShift(null); // Clear the shift state
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || (isAr ? 'كلمة مرور خاطئة' : 'Invalid password'));
    } finally {
      setIsClosing(false);
    }
  };

  const printSummary = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border">
        <div className="flex justify-between items-center p-5 border-b border-border bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-xl font-bold text-textMain flex items-center gap-2">
            <FileEarmarkText className="h-6 w-6 text-primary-600" />
            {isAr ? 'تقفيل الشيفت: ' : 'Shift Closure: '}
            <span className={currentShift === 'morning' ? 'text-amber-500' : 'text-indigo-500'}>
              {currentShift === 'morning' ? (isAr ? 'صباحي' : 'Morning') : (isAr ? 'مسائي' : 'Evening')}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-textMuted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors no-print"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
               <ArrowRepeat className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div className="space-y-2 font-mono">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-border">
                  <span className="font-bold text-textMain font-sans text-sm">{isAr ? 'إجمالي المبيعات' : 'Total Revenue'}</span>
                  <span className="text-primary-600 font-bold text-lg">{summary.total_revenue.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-border">
                  <span className="font-bold text-textMain font-sans text-sm">{isAr ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
                  <span className="text-red-500 font-bold text-lg">-{summary.total_expenses.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-border">
                  <span className="font-bold text-textMain font-sans text-sm">{isAr ? 'المرتجعات' : 'Total Refunds'}</span>
                  <span className="text-orange-500 font-bold text-lg">-{summary.total_refunds.toFixed(2)}</span>
                </div>
                
                <div className="pt-2 border-t border-border border-dashed">
                  <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-200 dark:border-primary-800">
                    <span className="font-black text-textMain text-xs uppercase tracking-wide font-sans">
                      {isAr ? 'صافي الكاش (المتوقع)' : 'Expected Cash'}
                    </span>
                    <span className="text-primary-600 font-black text-2xl tracking-tighter">
                      {summary.net_cash.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 no-print">
                <label className="text-sm font-bold text-textMain">
                  {isAr ? 'كلمة مرور القفل' : 'Closure Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-border rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 p-5 border-t border-border bg-slate-50 dark:bg-slate-900/50 no-print">
          <Button variant="outline" onClick={printSummary} className="flex-1 gap-2 border-border">
            <Printer className="w-4 h-4" />
            {isAr ? 'طباعة' : 'Print'}
          </Button>
          <Button 
            onClick={handleCloseShift} 
            isLoading={isClosing}
            disabled={!password || isLoading}
            className="flex-[2] gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {isAr ? 'تأكيد وقفل الوردية' : 'Confirm & Close Shift'}
          </Button>
        </div>
      </div>
    </div>
  );
}
