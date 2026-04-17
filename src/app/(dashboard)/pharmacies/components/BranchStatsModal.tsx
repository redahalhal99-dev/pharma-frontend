import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { X, ArrowRepeat, Shop, GraphUpArrow, CashStack, Hash } from 'react-bootstrap-icons';

type BranchStat = {
  id: number | null;
  name: string;
  sales_count: number;
  revenue: number;
  profit: number;
  expenses: number;
};

export function BranchStatsModal({
  isOpen,
  onClose,
  pharmacyId,
  pharmacyName
}: {
  isOpen: boolean;
  onClose: () => void;
  pharmacyId: number;
  pharmacyName: string;
}) {
  const { language } = useAppStore();
  const [stats, setStats] = useState<BranchStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAr = language === 'ar';

  useEffect(() => {
    if (isOpen && pharmacyId) {
      setIsLoading(true);
      axiosInstance.get(`/admin/pharmacies/${pharmacyId}/branch-stats`)
        .then(res => setStats(res.data))
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, pharmacyId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-border sm:scale-in-center flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-border bg-slate-50 dark:bg-white/5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg text-textMain flex items-center gap-2">
              <GraphUpArrow className="h-5 w-5 text-primary-500" />
              {isAr ? 'التقارير المالية للفروع' : 'Branch Financial Reports'}
            </h3>
            <p className="text-xs text-textMuted mt-1">{pharmacyName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <ArrowRepeat className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12 text-textMuted">
              {isAr ? 'لا توجد بيانات للفروع' : 'No branch data available'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between border-b border-border pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${stat.id ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'}`}>
                        <Shop className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm text-textMain">{stat.name}</h4>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" /> {isAr ? 'عدد المبيعات' : 'Sales Count'}
                      </p>
                      <p className="text-lg font-black text-textMain">{stat.sales_count}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <CashStack className="h-3 w-3" /> {isAr ? 'الإيرادات' : 'Revenue'}
                      </p>
                      <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{stat.revenue}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <GraphUpArrow className="h-3 w-3" /> {isAr ? 'الأرباح' : 'Profit'}
                      </p>
                      <p className="text-lg font-black text-blue-700 dark:text-blue-400">{stat.profit}</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-lg p-3">
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Shop className="h-3 w-3" /> {isAr ? 'المصروفات' : 'Expenses'}
                      </p>
                      <p className="text-lg font-black text-rose-700 dark:text-rose-400">{stat.expenses}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
