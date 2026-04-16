'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuth';
import { translations } from '@/locales/translations';
import { PlusLg, PencilSquare, Trash, ArrowRepeat, Snow, PlayFill, ExclamationTriangle, Robot } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { PharmacyModal } from './components/PharmacyModal';

type Pharmacy = {
  id: number;
  name: string;
  address: string;
  phone: string;
  subscription_ends_at: string | null;
  is_frozen: boolean;
  is_locked: boolean;
  is_subscription_expired: boolean;
  users: any[];
  branches: any[];
  ai_enabled?: boolean;
  daily_ai_limit?: number;
  daily_sales_limit?: number | null;
};

export default function PharmaciesPage() {
  const { language } = useAppStore();
  const t = translations[language];
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<any>(null);
  const [broadcastData, setBroadcastData] = useState({ title: '', body: '' });
  const [isSending, setIsSending] = useState(false);

  const fetchPharmacies = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/pharmacies');
      setPharmacies(res.data.data || res.data);
    } catch {
      toast.error('Failed to load pharmacies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPharmacies(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this pharmacy?')) return;
    try {
      await axiosInstance.delete(`/pharmacies/${id}`);
      toast.success('Pharmacy deleted');
      fetchPharmacies();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleFreeze = async (id: number) => {
    try {
      await axiosInstance.post(`/pharmacies/${id}/freeze`);
      toast.success('❄️ Pharmacy frozen');
      fetchPharmacies();
    } catch {
      toast.error('Failed to freeze');
    }
  };

  const handleUnfreeze = async (id: number) => {
    try {
      await axiosInstance.post(`/pharmacies/${id}/unfreeze`);
      toast.success('✅ Pharmacy unfrozen');
      fetchPharmacies();
    } catch {
      toast.error('Failed to unfreeze');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.body) {
      toast.error(language === 'ar' ? 'برجاء ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    setIsSending(true);
    try {
      await axiosInstance.post('/notifications/broadcast', broadcastData);
      toast.success(language === 'ar' ? '✅ تم إرسال التنبيه للجميع' : '✅ Broadcast sent');
      setIsBroadcastOpen(false);
      setBroadcastData({ title: '', body: '' });
    } catch {
      toast.error('Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-textMain">{t.pharmacies}</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary-500 text-primary-600" onClick={() => setIsBroadcastOpen(true)}>
            <PlayFill className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 rotate-180" />
            {language === 'ar' ? 'إرسال تنبيه للجميع' : 'Broadcast Message'}
          </Button>
          <Button onClick={() => { setEditingPharmacy(null); setIsModalOpen(true); }}>
            <PlusLg className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t.add}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><ArrowRepeat className="h-8 w-8 animate-spin text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className={`relative overflow-hidden ${pharmacy.is_locked ? 'border-red-300 dark:border-red-800 opacity-80' : ''}`}>
              {/* Frozen/Locked banner */}
              {pharmacy.is_locked && (
                <div className="bg-red-500 text-white text-center text-xs font-bold py-1">
                  {pharmacy.is_frozen ? '❄️ Frozen Manually' : '⚠️ Subscription Expired'}
                </div>
              )}
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-textMain">{pharmacy.name}</h3>
                    <div className="bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-lg border border-primary-100 dark:border-primary-800 mb-2 inline-block">
                      <p className="text-xs font-black text-primary-700 dark:text-primary-300">
                        👨‍⚕️ {pharmacy.users?.find(u => u.role === 'doctor')?.name || (language === 'ar' ? 'غير مسجل' : 'Unknown')}
                      </p>
                    </div>
                    <p className="text-sm text-textMuted">{pharmacy.address || 'No address'}</p>
                    <p className="text-xs text-textMuted mt-1">{pharmacy.phone || 'No phone'}</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    pharmacy.is_locked
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  }`}>
                    {pharmacy.is_locked ? (language === 'ar' ? 'مجمد' : 'Locked') : (language === 'ar' ? 'نشط' : 'Active')}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-textMuted flex-wrap mt-2">
                  <span>👥 {pharmacy.users?.length || 0} {t.users}</span>
                  <span>🏢 {pharmacy.branches?.length || 0} {t.branches}</span>
                  <span className="flex items-center gap-1" title={language === 'ar' ? `حد الذكاء الاصطناعي اليومي: ${pharmacy.daily_ai_limit}` : `Daily AI Limit: ${pharmacy.daily_ai_limit}`}>
                    <Robot className={`h-3.5 w-3.5 ${pharmacy.ai_enabled ? 'text-primary-500' : 'text-slate-400'}`} />
                    {pharmacy.ai_enabled ? (language === 'ar' ? 'الذكاء الاصطناعي مفعل' : 'AI Enabled') : (language === 'ar' ? 'معطل' : 'AI Disabled')}
                  </span>
                </div>

                {/* Subscription */}
                <div className="text-xs mb-2">
                  <span className="text-textMuted">Subscription: </span>
                  {pharmacy.subscription_ends_at ? (
                    <span className={pharmacy.is_subscription_expired ? 'text-red-500 font-bold' : 'text-green-600 font-medium'}>
                      {new Date(pharmacy.subscription_ends_at).toLocaleDateString()}
                      {pharmacy.is_subscription_expired && ' (Expired)'}
                    </span>
                  ) : (
                    <span className="text-textMuted">No date set</span>
                  )}
                </div>

                {/* Accounts List */}
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs font-bold text-textMain mb-2">{language === 'ar' ? 'الحسابات التابعة للصيدلية' : 'Associated Accounts'}</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar ltr:pr-1 rtl:pl-1">
                    {pharmacy.users?.map(user => (
                      <div key={user.id} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-border shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-textMain line-clamp-1">{user.name}</span>
                          <span className="text-textMuted text-[10px] truncate max-w-[120px] sm:max-w-[160px]">{user.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                          user.role === 'doctor' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                    {(!pharmacy.users || pharmacy.users.length === 0) && (
                      <span className="text-xs text-textMuted italic">{language === 'ar' ? 'لا يوجد حسابات' : 'No accounts'}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  {pharmacy.is_frozen ? (
                    <Button variant="outline" size="sm" className="text-green-600 border-green-300" onClick={() => handleUnfreeze(pharmacy.id)}>
                      <PlayFill className="h-3 w-3 mr-1" /> {language === 'ar' ? 'تشغيل' : 'Unfreeze'}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-300" onClick={() => handleFreeze(pharmacy.id)}>
                      <Snow className="h-3 w-3 mr-1" /> {language === 'ar' ? 'تجميد' : 'Freeze'}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => { setEditingPharmacy(pharmacy); setIsModalOpen(true); }}>
                    <PencilSquare className="h-4 w-4 text-primary-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(pharmacy.id)}>
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pharmacies.length === 0 && (
            <p className="col-span-full text-center text-textMuted py-8">No pharmacies yet.</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <PharmacyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} pharmacy={editingPharmacy} onSuccess={fetchPharmacies} />
      )}

      {isBroadcastOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border sm:scale-in-center">
            <div className="p-5 border-b border-border bg-primary-50 dark:bg-primary-900/20 flex justify-between items-center">
              <h3 className="font-bold text-primary-700 dark:text-primary-300 flex items-center gap-2">
                <PlayFill className="h-5 w-5 rotate-180" />
                {language === 'ar' ? 'إرسال تنبيه لجميع المستخدمين' : 'Global Broadcast'}
              </h3>
              <button onClick={() => setIsBroadcastOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold">{language === 'ar' ? 'عنوان الرسالة' : 'Title'}</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-border rounded-xl px-4 py-2"
                  placeholder={language === 'ar' ? 'تحديث جديد...' : 'New update...'}
                  value={broadcastData.title}
                  onChange={e => setBroadcastData({...broadcastData, title: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold">{language === 'ar' ? 'نص الرسالة' : 'Message Body'}</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-border rounded-xl px-4 py-2 h-32"
                  placeholder={language === 'ar' ? 'اكتب تفاصيل الرسالة هنا...' : 'Type message here...'}
                  value={broadcastData.body}
                  onChange={e => setBroadcastData({...broadcastData, body: e.target.value})}
                />
              </div>
              <Button className="w-full h-12 text-lg font-bold" onClick={handleBroadcast} isLoading={isSending}>
                {language === 'ar' ? 'إرسال للجميع الآن' : 'Send to All Users'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
