'use client';

import { useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { PlusLg, Trash, Diagram2 } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

export function PharmacyModal({
  isOpen,
  onClose,
  pharmacy,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  pharmacy: any | null;
  onSuccess: () => void;
}) {
  const { language } = useAppStore();
  const t = translations[language];
  const isEdit = !!pharmacy;

  const [activeTab, setActiveTab] = useState<'info' | 'branches'>('info');
  const [formData, setFormData] = useState({
    name: pharmacy?.name || '',
    address: pharmacy?.address || '',
    phone: pharmacy?.phone || '',
    subscription_ends_at: pharmacy?.subscription_ends_at ? pharmacy.subscription_ends_at.split('T')[0] : '',
    subscription_type: pharmacy?.subscription_type || 'monthly',
    doctor_name: '',
    doctor_email: '',
    doctor_password: '',
    ai_enabled: pharmacy?.ai_enabled ?? true,
    daily_ai_limit: pharmacy?.daily_ai_limit ?? 50,
    daily_sales_limit: pharmacy?.daily_sales_limit ?? '',
  });

  const [isLoading, setIsLoading] = useState(false);

  // Branch management (for edit mode)
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '' });
  const [isBranchSaving, setIsBranchSaving] = useState(false);
  const [branches, setBranches] = useState<any[]>(pharmacy?.branches || []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/pharmacies/${pharmacy.id}`, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          subscription_ends_at: formData.subscription_ends_at || null,
          subscription_type: formData.subscription_type,
          ai_enabled: formData.ai_enabled,
          daily_ai_limit: formData.daily_ai_limit || 0,
          daily_sales_limit: formData.daily_sales_limit || null,
        });
        toast.success(language === 'ar' ? 'تم تحديث الصيدلية ✅' : 'Pharmacy updated ✅');
      } else {
        const payload = {
          ...formData,
          daily_ai_limit: formData.daily_ai_limit || 0,
          daily_sales_limit: formData.daily_sales_limit || null,
        };
        const res = await axiosInstance.post('/pharmacies', payload);
        toast.success(language === 'ar' ? `تم إنشاء الصيدلية! دكتور: ${res.data.doctor?.email}` : `Pharmacy created! Doctor: ${res.data.doctor?.email}`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (language === 'ar' ? 'خطأ في الحفظ' : 'Error saving pharmacy'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim()) return;
    setIsBranchSaving(true);
    try {
      const res = await axiosInstance.post(`/pharmacies/${pharmacy.id}/branches`, branchForm);
      setBranches(prev => [...prev, res.data]);
      setBranchForm({ name: '', address: '', phone: '' });
      toast.success(language === 'ar' ? 'تمت إضافة الفرع ✅' : 'Branch added ✅');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setIsBranchSaving(false);
    }
  };

  const tabs = [
    { id: 'info', label: language === 'ar' ? 'البيانات' : 'Info' },
    ...(isEdit ? [{ id: 'branches', label: language === 'ar' ? 'الفروع' : 'Branches' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl border border-border max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-textMain">
            {isEdit ? `${t.edit} "${pharmacy.name}"` : (language === 'ar' ? 'إضافة صيدلية جديدة' : 'Add New Pharmacy')}
          </h2>
          {isEdit && (
            <div className="flex gap-1 mt-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-textMuted hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6">
          {/* ── Info Tab ── */}
          {activeTab === 'info' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-textMain mb-1.5 block">{t.name} *</label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-textMain mb-1.5 block">{language === 'ar' ? 'العنوان' : 'Address'}</label>
                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-textMain mb-1.5 block">{language === 'ar' ? 'الهاتف' : 'Phone'}</label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-textMain mb-1.5 block">{language === 'ar' ? 'انتهاء الاشتراك' : 'Subscription End'}</label>
                  <Input type="date" value={formData.subscription_ends_at} onChange={e => setFormData({ ...formData, subscription_ends_at: e.target.value })} />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-border">
                <div>
                  <label className="text-sm font-bold text-textMain">{language === 'ar' ? 'تفعيل الذكاء الاصطناعي' : 'Enable AI Assistant'}</label>
                  <p className="text-xs text-textMuted">{language === 'ar' ? 'السماح لهذه الصيدلية باستخدام المساعد' : 'Allow this pharmacy to use AI chat'}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.ai_enabled} onChange={e => setFormData({ ...formData, ai_enabled: e.target.checked })} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-textMain mb-1.5 block">{language === 'ar' ? 'حد أسئلة الذكاء الاصطناعي/يوم' : 'Daily AI Chat Limit'}</label>
                  <Input type="number" min="0" value={formData.daily_ai_limit} onChange={e => setFormData({ ...formData, daily_ai_limit: e.target.value })} disabled={!formData.ai_enabled} />
                </div>
                <div>
                  <label className="text-sm font-medium text-textMain mb-1.5 block">{language === 'ar' ? 'حد فواتير المبيعات/يوم' : 'Daily Sales Registrations Limit'}</label>
                  <Input type="number" min="0" placeholder={language === 'ar' ? 'غير محدود (فارغ)' : 'Unlimited (empty)'} value={formData.daily_sales_limit} onChange={e => setFormData({ ...formData, daily_sales_limit: e.target.value })} />
                </div>
              </div>

              {/* Subscription Type */}
              <div>
                <label className="text-sm font-medium text-textMain mb-1.5 block">
                  {language === 'ar' ? 'نوع الاشتراك' : 'Subscription Type'}
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'monthly', labelAr: '📅 شهري', labelEn: '📅 Monthly' },
                    { value: 'yearly',  labelAr: '📆 سنوي',  labelEn: '📆 Yearly' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
                        formData.subscription_type === opt.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'border-border text-textMuted hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="subscription_type"
                        value={opt.value}
                        checked={formData.subscription_type === opt.value}
                        onChange={() => setFormData({ ...formData, subscription_type: opt.value })}
                      />
                      {language === 'ar' ? opt.labelAr : opt.labelEn}
                    </label>
                  ))}
                </div>
              </div>

              {/* Doctor Account (only when creating) */}
              {!isEdit && (
                <>
                  <hr className="border-border my-2" />
                  <h3 className="font-bold text-primary-600 text-sm">{language === 'ar' ? '👨‍⚕️ حساب الدكتور' : '👨‍⚕️ Doctor Account'}</h3>
                  <div>
                    <label className="text-sm font-medium text-textMain mb-1.5 block">{t.doctorName} *</label>
                    <Input required value={formData.doctor_name} onChange={e => setFormData({ ...formData, doctor_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-textMain mb-1.5 block">{t.doctorEmail} *</label>
                    <Input type="email" required value={formData.doctor_email} onChange={e => setFormData({ ...formData, doctor_email: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-textMain mb-1.5 block">{t.doctorPassword} *</label>
                    <Input type="password" required minLength={6} value={formData.doctor_password} onChange={e => setFormData({ ...formData, doctor_password: e.target.value })} />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>{t.cancel}</Button>
                <Button type="submit" isLoading={isLoading}>{t.save}</Button>
              </div>
            </form>
          )}

          {/* ── Branches Tab ── */}
          {activeTab === 'branches' && isEdit && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-textMuted">
                <Diagram2 className="h-4 w-4" />
                {language === 'ar' ? `فروع صيدلية "${pharmacy.name}"` : `Branches of "${pharmacy.name}"`}
              </div>

              {branches.length === 0 && (
                <p className="text-center text-textMuted text-sm py-4">
                  {language === 'ar' ? 'لا توجد فروع بعد.' : 'No branches yet.'}
                </p>
              )}

              <div className="space-y-2">
                {branches.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-border">
                    <Diagram2 className="h-4 w-4 text-primary-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-textMain truncate">{b.name}</p>
                      {b.address && <p className="text-xs text-textMuted truncate">{b.address}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-border" />
              <h3 className="text-sm font-bold">{language === 'ar' ? 'إضافة فرع جديد:' : 'Add New Branch:'}</h3>
              <form onSubmit={handleAddBranch} className="space-y-3">
                <Input
                  required
                  placeholder={language === 'ar' ? 'اسم الفرع *' : 'Branch name *'}
                  value={branchForm.name}
                  onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                />
                <Input
                  placeholder={language === 'ar' ? 'العنوان' : 'Address'}
                  value={branchForm.address}
                  onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                />
                <Input
                  placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                  value={branchForm.phone}
                  onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                />
                <Button type="submit" isLoading={isBranchSaving} className="w-full">
                  <PlusLg className="h-4 w-4 mr-1" />
                  {language === 'ar' ? 'إضافة الفرع' : 'Add Branch'}
                </Button>
              </form>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
