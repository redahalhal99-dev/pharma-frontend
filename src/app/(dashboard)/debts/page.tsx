'use client';

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { PeopleFill, CashStack, CheckCircleFill, Search, Trash, TelephoneFill, CalendarDate } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';

export default function DebtsPage() {
  const { language } = useAppStore();
  const t = translations[language];
  const isAr = language === 'ar';

  const [debtors, setDebtors] = useState<any[]>([]);
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [debts, setDebts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDebtors();
  }, []);

  const fetchDebtors = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/debtors');
      setDebtors(res.data);
    } catch (e) {
      toast.error('Failed to load debtors');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDebts = async (debtorId: number) => {
    try {
      const res = await axiosInstance.get(`/debts?debtor_id=${debtorId}`);
      setDebts(res.data);
    } catch (e) {
      toast.error('Failed to load debts');
    }
  };

  const handlePayDebt = async (debtId: number) => {
    try {
      await axiosInstance.post(`/debts/${debtId}/pay`);
      toast.success(isAr ? 'تم سداد الدين' : 'Debt paid');
      if (selectedDebtor) fetchDebts(selectedDebtor.id);
      fetchDebtors();
    } catch (e) {
      toast.error('Payment failed');
    }
  };

  const filteredDebtors = debtors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    (d.phone && d.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-textMain flex items-center gap-3">
          <PeopleFill className="h-8 w-8 text-primary-600" />
          {t.debtors || 'سجل العملاء والشكك'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Debtors List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted rtl:right-3 rtl:left-auto" />
                <Input 
                  placeholder={t.search} 
                  className="pl-10 rtl:pr-10" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <p className="text-center text-textMuted py-4">Loading...</p>
                ) : filteredDebtors.length === 0 ? (
                  <p className="text-center text-textMuted py-4">No debtors found</p>
                ) : (
                  filteredDebtors.map(debtor => (
                    <div 
                      key={debtor.id}
                      onClick={() => { setSelectedDebtor(debtor); fetchDebts(debtor.id); }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedDebtor?.id === debtor.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm' : 'border-border hover:border-primary-300 bg-surface'}`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-textMain">{debtor.name}</h4>
                        <span className="text-xs font-black text-primary-600">
                          {Number(debtor.total_debt || 0).toFixed(2)}
                        </span>
                      </div>
                      {debtor.phone && (
                        <div className="flex items-center gap-1 text-[10px] text-textMuted mt-1">
                          <TelephoneFill className="h-3 w-3" />
                          {debtor.phone}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Debts Detail */}
        <div className="lg:col-span-2">
          {selectedDebtor ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-textMain">{selectedDebtor.name}</h2>
                  <p className="text-textMuted">{isAr ? 'إجمالي المديونية الحالية' : 'Current total debt'}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-red-600 font-mono tracking-tighter">
                    {Number(selectedDebtor.total_debt || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {debts.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-textMuted">No debt records found.</CardContent></Card>
                ) : (
                  debts.map(debt => (
                    <Card key={debt.id} className={`${debt.status === 'paid' ? 'opacity-60 bg-slate-50' : 'border-l-4 border-l-red-500'}`}>
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${debt.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {debt.status === 'paid' ? <CheckCircleFill className="h-5 w-5" /> : <CashStack className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-textMain">{Number(debt.amount).toFixed(2)}</p>
                            <div className="flex items-center gap-3 text-xs text-textMuted mt-1">
                              <span className="flex items-center gap-1 uppercase font-bold"><CalendarDate className="h-3 w-3" /> {new Date(debt.created_at).toLocaleDateString()}</span>
                              <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded capitalize">{debt.shift}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {debt.status === 'pending' && (
                            <Button 
                              className="flex-1 sm:flex-none h-10 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
                              onClick={() => handlePayDebt(debt.id)}
                            >
                              {t.paid || 'سداد'}
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            className="h-10 px-4 text-red-500 hover:bg-red-50"
                            onClick={async () => {
                              if (confirm('Delete this record?')) {
                                await axiosInstance.delete(`/debts/${debt.id}`);
                                fetchDebts(selectedDebtor.id);
                                fetchDebtors();
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a]/20 border border-dashed border-border rounded-3xl text-textMuted">
              <PeopleFill className="h-16 w-16 opacity-20 mb-4" />
              <p className="text-xl font-bold">{isAr ? 'اختر عميلاً لعرض مديونيته' : 'Select a debtor to view details'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
