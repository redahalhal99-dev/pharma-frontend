'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { PlusLg, ArrowRepeat, ArrowCounterclockwise, CashStack, Calendar2Event } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { AddReturnModal } from './components/AddReturnModal';

type ReturnItem = {
  id: number;
  quantity: number;
  amount_refunded: number;
  reason: string;
  created_at: string;
  product: { id: number; name: string; barcode: string };
  user: { id: number; name: string };
};

export default function ReturnsPage() {
  const { language } = useAppStore();
  const t = translations[language];

  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/returns', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setReturns(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load returns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المرتجع؟ سيتم إنقاص المخزون مرة ثانية.' : 'Delete this return? Stock will be reduced back.')) {
      try {
        await axiosInstance.delete(`/returns/${id}`);
        toast.success(language === 'ar' ? 'تم حذف المرتجع بنجاح' : 'Return deleted successfully');
        fetchReturns();
      } catch {
        toast.error('Failed to delete return');
      }
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [selectedMonth, selectedYear]);

  const totalReturns = returns.length;
  const totalRefunded = returns.reduce((sum, r) => sum + Number(r.amount_refunded), 0);
  const today = new Date().toDateString();
  const todayReturnsCount = returns.filter(r => new Date(r.created_at).toDateString() === today).length;

  const statCards = [
    { title: language === 'ar' ? 'إجمالي المرتجعات' : 'Total Returns', value: totalReturns, icon: ArrowCounterclockwise, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { title: language === 'ar' ? 'إجمالي المبالغ المستردة' : 'Total Refunded', value: `$${totalRefunded.toFixed(2)}`, icon: CashStack, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
    { title: language === 'ar' ? 'مرتجعات اليوم' : 'Returns Today', value: todayReturnsCount, icon: Calendar2Event, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
          <ArrowCounterclockwise className="h-6 w-6 text-primary-600" />
          {t.returns || 'Returns'}
        </h1>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <PlusLg className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t.add || 'Add'} Return
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <Card key={idx}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-textMuted">{card.title}</p>
                <h3 className="text-2xl font-bold text-textMain">{card.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="h-10 rounded-xl border border-border bg-white dark:bg-slate-900 px-3 text-sm font-bold text-textMain outline-none focus:ring-2 focus:ring-primary-500"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' })}
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

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <ArrowRepeat className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="text-xs text-textMuted uppercase bg-slate-50 dark:bg-slate-800 border-b border-border">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">{t.name || 'Product'}</th>
                    <th className="px-4 py-3">{t.barcode || 'Barcode'}</th>
                    <th className="px-4 py-3">{t.quantity || 'Quantity'}</th>
                    <th className="px-4 py-3">Refund Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Processed By</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((ret) => (
                    <tr key={ret.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-xs">#{ret.id}</td>
                      <td className="px-4 py-3 font-medium">{ret.product?.name}</td>
                      <td className="px-4 py-3 text-xs">{ret.product?.barcode || '-'}</td>
                      <td className="px-4 py-3">{ret.quantity}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">
                        ${Number(ret.amount_refunded).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-textMuted">{ret.reason || '-'}</td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(ret.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs">{ret.user?.name}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleDelete(ret.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Return"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {returns.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-textMuted">
                        No returns found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <AddReturnModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchReturns}
        />
      )}
    </div>
  );
}
