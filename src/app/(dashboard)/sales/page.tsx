'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { Input } from '@/components/ui/Input';
import { FileEarmarkText, Search, BoxSeam, Person, Calendar, X } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

type Sale = {
  id: number;
  product_id: number;
  user_id: number;
  quantity: number;
  quantity_type: 'box' | 'strip';
  date: string;
  profit: number;
  received_amount?: string | number | null;
  payment_method?: string | null;
  global_discount?: string | number | null;
  shift?: string;
  product: { id: number; name: string; price: number; barcode: string; strip_price?: number; cost_price: number };
  user: { id: number; name: string };
};

export default function SalesHistoryPage() {
  const { language } = useAppStore();
  const t = translations[language];
  const isAr = language === 'ar';

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/sales', {
          params: { month: selectedMonth, year: selectedYear }
        });
        setSales(res.data);
      } catch {
        toast.error(isAr ? 'فشل تحميل المبيعات' : 'Failed to load sales');
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, [isAr, selectedMonth, selectedYear]);

  const filtered = sales.filter(s => {
    const term = search.toLowerCase();
    return (
      s.product?.name?.toLowerCase().includes(term) ||
      s.product?.barcode?.includes(term) ||
      s.user?.name?.toLowerCase().includes(term) ||
      s.date?.includes(term)
    );
  });

  const getPrice = (s: Sale) => {
    if (s.quantity_type === 'strip' && s.product?.strip_price) {
      return Number(s.product.strip_price);
    }
    return Number(s.product?.price || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
            <FileEarmarkText className="h-6 w-6 text-primary-600" />
            {t.salesHistory}
          </h1>
          <p className="text-sm text-textMuted mt-1">
            {isAr ? `${filtered.length} عملية بيع` : `${filtered.length} sale(s)`}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
        <Input
          placeholder={t.searchSales}
          className="ltr:pl-10 rtl:pr-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="h-10 rounded-xl border border-border bg-white dark:bg-slate-900 px-3 text-sm font-bold text-textMain outline-none focus:ring-2 focus:ring-primary-500"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString(isAr ? 'ar-EG' : 'en-US', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="h-10 rounded-xl border border-border bg-white dark:bg-slate-900 px-3 text-sm font-bold text-textMain outline-none focus:ring-2 focus:ring-primary-500"
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const year = currentDate.getFullYear() - i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-textMuted">
          <FileEarmarkText className="h-12 w-12 opacity-20 mb-3" />
          <p>{isAr ? 'لا توجد مبيعات مسجلة' : 'No sales found'}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-textMuted text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-start">#</th>
                  <th className="px-4 py-3 text-start">{t.name}</th>
                  <th className="px-4 py-3 text-start">{t.quantity}</th>
                  <th className="px-4 py-3 text-start">{t.total}</th>
                  <th className="px-4 py-3 text-start">{t.profit}</th>
                  <th className="px-4 py-3 text-start">{t.seller}</th>
                  <th className="px-4 py-3 text-start">{t.sellDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((sale, i) => (
                  <tr 
                    key={sale.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedSale(sale)}
                  >
                    <td className="px-4 py-3 text-textMuted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 p-1.5 rounded-lg shrink-0">
                          <BoxSeam className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-textMain line-clamp-1">{sale.product?.name || '—'}</p>
                          <p className="text-xs text-textMuted font-mono">{sale.product?.barcode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold">
                        {sale.quantity} <span className="text-xs text-textMuted font-normal">{sale.quantity_type === 'strip' ? t.unitStrip : t.unitBox}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-bold text-primary-600 font-mono">
                        {(sale.quantity * getPrice(sale)).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-bold font-mono ${sale.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {sale.profit > 0 ? '+' : ''}{Number(sale.profit).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Person className="h-4 w-4 text-textMuted shrink-0" />
                        <span className="text-textMain">{sale.user?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-textMuted whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {sale.date}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border sm:scale-in-center">
            <div className="flex justify-between items-center p-4 border-b border-border bg-primary-50 dark:bg-primary-900/20">
              <h3 className="font-bold text-primary-700 dark:text-primary-300">
                {isAr ? 'تفاصيل المبيعة / الفاتورة' : 'Sale Receipt'}
              </h3>
              <button onClick={() => setSelectedSale(null)} className="text-primary-500 hover:bg-primary-100 hover:text-red-500 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-textMuted">{isAr ? 'المنتج' : 'Product'}</span>
                <span className="font-bold">{selectedSale.product?.name}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-textMuted">{isAr ? 'الكمية' : 'Quantity'}</span>
                <span className="font-bold">{selectedSale.quantity} {selectedSale.quantity_type === 'strip' ? t.unitStrip : t.unitBox}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-textMuted">{isAr ? 'الإجمالي (الفاتورة)' : 'Total Cost'}</span>
                <span className="font-bold text-primary-600 font-mono">{(selectedSale.quantity * getPrice(selectedSale)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-textMuted">{isAr ? 'المُحصل / المستلم' : 'Received Amount'}</span>
                <span className="font-bold font-mono">{selectedSale.received_amount != null ? Number(selectedSale.received_amount).toFixed(2) : '—'}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-textMuted">{isAr ? 'الخصم المطبق' : 'Global Discount'}</span>
                <span className="font-bold text-emerald-500 font-mono">{selectedSale.global_discount != null ? Number(selectedSale.global_discount).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-textMuted">{isAr ? 'طريقة الدفع' : 'Payment Method'}</span>
                <span className="font-bold capitalize">{selectedSale.payment_method || 'Cash'}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-textMuted">{isAr ? 'الوردية' : 'Shift'}</span>
                <span className="font-bold">{selectedSale.shift === 'evening' ? (isAr ? 'مسائي' : 'Evening') : (isAr ? 'صباحي' : 'Morning')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
