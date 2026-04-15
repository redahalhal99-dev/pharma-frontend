'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { PlusLg, Calculator, GraphUpArrow, GraphDownArrow, CurrencyDollar, ArrowCounterclockwise } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { ExpenseModal } from './components/ExpenseModal';

type Expense = {
  id: number;
  description: string;
  amount: number;
  date: string;
};

export default function AccountingPage() {
  const { language } = useAppStore();
  const t = translations[language];

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reportSummary, setReportSummary] = useState({
    total_revenue: 0,
    total_cost: 0,
    gross_profit: 0,
    total_refunds: 0,
    total_expenses: 0,
    net_profit: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const expenseRes = await axiosInstance.get('/expenses');
      setExpenses(expenseRes.data.data || expenseRes.data || []);

      const reportRes = await axiosInstance.get('/reports/profit');
      if (reportRes.data?.summary) {
        setReportSummary(reportRes.data.summary);
      }
    } catch (error) {
      toast.error('Failed to load accounting data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real values from advanced accounting API
  const netIncome = reportSummary.total_revenue - reportSummary.total_refunds;
  const grossProfit = reportSummary.gross_profit;
  const netProfit = reportSummary.net_profit;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary-600" />
          {t.accounting}
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusLg className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30`}>
              <GraphUpArrow className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">{language === 'ar' ? 'صافي المبيعات' : 'Net Sales'}</p>
              <h3 className="text-xl font-bold text-textMain">${netIncome.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30`}>
              <ArrowCounterclockwise className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Returns</p>
              <h3 className="text-xl font-bold text-orange-600">-${reportSummary.total_refunds.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30`}>
              <GraphDownArrow className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Expenses</p>
              <h3 className="text-xl font-bold text-textMain">-${reportSummary.total_expenses.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Cost of Goods Sold */}
        <Card className="border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800`}>
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Cost of Goods</p>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">-${reportSummary.total_cost.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30`}>
              <CurrencyDollar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted">Net Profit</p>
              <h3 className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${netProfit.toFixed(2)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold">Expenses Ledger</h2>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="text-xs text-textMuted uppercase bg-slate-50 dark:bg-slate-800 border-b border-border">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border">
                    <td className="px-6 py-4 text-textMuted">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium">{expense.description}</td>
                    <td className="px-6 py-4 text-right text-red-500 font-bold">
                      -${Number(expense.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-textMuted">
                      No expenses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
