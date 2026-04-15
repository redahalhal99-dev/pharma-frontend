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

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/returns');
      setReturns(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load returns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

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
                    </tr>
                  ))}
                  {returns.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-textMuted">
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
