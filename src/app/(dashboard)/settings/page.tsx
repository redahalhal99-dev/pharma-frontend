'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuth';
import { translations } from '@/locales/translations';
import {
  GearFill, ArrowRepeat, Save, PlusLg, Trash, PencilSquare,
  StarFill, Cash, CameraFill, UpcScan, VolumeUpFill, PrinterFill,
  Download
} from 'react-bootstrap-icons';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { usePWA } from '@/hooks/usePWA';

type Plan = {
  id: number;
  title: string;
  title_ar: string;
  price: number;
  duration: 'monthly' | 'yearly';
  features: string;
  features_ar: string;
  payment_info: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
};

export default function SettingsPage() {
  const { 
    language, 
    barcodeInputSource, setBarcodeInputSource,
    enableSounds, setEnableSounds,
    autoPrintReceipt, setAutoPrintReceipt
  } = useAppStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { isInstallable, installApp } = usePWA();

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('النظام تحت الصيانة حالياً. سنعود قريباً.');
  const [isMaintenanceSaving, setIsMaintenanceSaving] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    title: '', title_ar: '', price: '', duration: 'monthly',
    features: '', features_ar: '', payment_info: '', is_popular: false, is_active: true, sort_order: 0,
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadMaintenance();
      loadPlans();
    }
  }, [isAdmin]);

  const loadMaintenance = async () => {
    try {
      const res = await axiosInstance.get('/settings/maintenance');
      setIsMaintenance(res.data.is_maintenance);
      if (res.data.message) setMaintenanceMsg(res.data.message);
    } catch {}
  };

  const saveMaintenance = async () => {
    setIsMaintenanceSaving(true);
    try {
      await axiosInstance.post('/settings/maintenance', {
        is_maintenance: isMaintenance,
        message: maintenanceMsg,
      });
      toast.success(language === 'ar' ? 'تم تحديث وضع الصيانة ✅' : 'Maintenance mode updated ✅');
    } catch {
      toast.error(language === 'ar' ? 'فشل التحديث' : 'Update failed');
    } finally {
      setIsMaintenanceSaving(false);
    }
  };

  const loadPlans = async () => {
    setIsPlansLoading(true);
    try {
      const res = await axiosInstance.get('/admin/plans');
      setPlans(res.data);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setIsPlansLoading(false);
    }
  };

  const resetPlanForm = () => {
    setPlanForm({ title: '', title_ar: '', price: '', duration: 'monthly', features: '', features_ar: '', payment_info: '', is_popular: false, is_active: true, sort_order: 0 });
    setEditingPlan(null);
    setShowPlanForm(false);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...planForm, price: parseFloat(planForm.price) || 0 };
      if (editingPlan) {
        await axiosInstance.put(`/admin/plans/${editingPlan.id}`, payload);
        toast.success('تم تحديث الخطة ✅');
      } else {
        await axiosInstance.post('/admin/plans', payload);
        toast.success('تمت إضافة الخطة ✅');
      }
      resetPlanForm();
      loadPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل الحفظ');
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm(language === 'ar' ? 'حذف هذه الخطة؟' : 'Delete this plan?')) return;
    try {
      await axiosInstance.delete(`/admin/plans/${id}`);
      toast.success('تم الحذف');
      loadPlans();
    } catch { toast.error('فشل الحذف'); }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      title: plan.title, title_ar: plan.title_ar || '', price: String(plan.price),
      duration: plan.duration, features: plan.features || '', features_ar: plan.features_ar || '',
      payment_info: plan.payment_info || '', is_popular: plan.is_popular,
      is_active: plan.is_active, sort_order: plan.sort_order,
    });
    setShowPlanForm(true);
  };

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black text-textMain">{language === 'ar' ? 'الإعدادات' : 'Settings'}</h1>
      </div>

      {/* ── User Preferences (For All) ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hardware Settings */}
        <Card className="rounded-3xl border-border/50 shadow-premium">
          <CardContent className="p-6">
            <h3 className="font-black text-sm mb-4 uppercase tracking-widest text-primary-600">
              {language === 'ar' ? 'إعدادات الأجهزة' : 'Hardware Settings'}
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-textMain">{language === 'ar' ? 'جهاز مسح الباركود' : 'Barcode Input Device'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBarcodeInputSource('usb')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      barcodeInputSource === 'usb'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        : 'border-border bg-slate-50 dark:bg-white/5 text-textMuted hover:border-primary-300'
                    }`}
                  >
                    <UpcScan className="h-6 w-6" />
                    <span className="text-xs font-bold">{language === 'ar' ? 'ماسح USB' : 'USB Scanner'}</span>
                  </button>
                  <button
                    onClick={() => setBarcodeInputSource('camera')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      barcodeInputSource === 'camera'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        : 'border-border bg-slate-50 dark:bg-white/5 text-textMuted hover:border-primary-300'
                    }`}
                  >
                    <CameraFill className="h-6 w-6" />
                    <span className="text-xs font-bold">{language === 'ar' ? 'كاميرا الجهاز' : 'Device Camera'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-textMuted italic">
                  {language === 'ar' ? '* اختيار الكاميرا سيفعل زر المسح بالكاميرا بشكل أساسي.' : '* Selecting camera will prioritize camera-based scanning hooks.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experience Settings */}
        <Card className="rounded-3xl border-border/50 shadow-premium">
          <CardContent className="p-6">
            <h3 className="font-black text-sm mb-4 uppercase tracking-widest text-primary-600">
              {language === 'ar' ? 'إعدادات الاستخدام' : 'Experience Settings'}
            </h3>
            
            <div className="space-y-4">
              {/* Sounds Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border/50">
                <div className="flex items-center gap-3">
                  <VolumeUpFill className="h-5 w-5 text-primary-500" />
                  <span className="text-sm font-bold text-textMain">{language === 'ar' ? 'تفعيل أصوات التنبيه' : 'Enable Notification Sounds'}</span>
                </div>
                <button
                  onClick={() => setEnableSounds(!enableSounds)}
                  className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${enableSounds ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`absolute h-4 w-4 rounded-full bg-white transition-transform ${enableSounds ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`} />
                </button>
              </div>

              {/* Auto Print Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border/50">
                <div className="flex items-center gap-3">
                  <PrinterFill className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-bold text-textMain">{language === 'ar' ? 'طباعة الفاتورة تلقائياً' : 'Auto-print Receipt'}</span>
                </div>
                <button
                  onClick={() => setAutoPrintReceipt(!autoPrintReceipt)}
                  className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${autoPrintReceipt ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`absolute h-4 w-4 rounded-full bg-white transition-transform ${autoPrintReceipt ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── PWA Installation (For All) ───────────────────────── */}
      <Card className="rounded-3xl border-border/50 shadow-premium overflow-hidden bg-gradient-to-br from-primary-600/5 to-emerald-600/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
                <Download className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-black text-textMain">{language === 'ar' ? 'تثبيت التطبيق على الجهاز' : 'Install Pharma.M on Device'}</h2>
                <p className="text-xs text-textMuted max-w-sm">
                  {language === 'ar' ? 'تثبيت التطبيق يمنحك تجربة أسرع وسهولة في الوصول بدون الحاجة لفتح المتصفح.' : 'Installing grants a faster experience and easier access without the browser framework.'}
                </p>
              </div>
            </div>
            {isInstallable ? (
              <Button onClick={installApp} className="rounded-2xl px-8 py-4 shadow-lg shadow-primary-600/20">
                {language === 'ar' ? 'ثبّت الآن' : 'Install Now'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl text-xs font-bold">
                <StarFill className="h-3 w-3" />
                <span>{language === 'ar' ? 'تم التثبيت بالفعل' : 'Already Installed'}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Admin Only Sections ─────────────────────────────────── */}
      {isAdmin && (
        <div className="space-y-8 pt-4 border-t border-border/50">
          {/* Maintenance Mode */}
          <Card className="rounded-3xl border-border/50 shadow-premium">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/20">
                  <GearFill className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-black text-textMain">{language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}</h2>
                  <p className="text-xs text-textMuted">{language === 'ar' ? 'عند التفعيل, يُمنع دخول جميع المستخدمين ماعدا الأدمن' : 'When active, all users except admin are blocked'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsMaintenance(!isMaintenance)}
                    className={`relative flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${isMaintenance ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`absolute h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isMaintenance ? 'translate-x-8 rtl:-translate-x-8' : 'translate-x-1 rtl:-translate-x-1'}`} />
                  </button>
                  <span className={`text-sm font-semibold ${isMaintenance ? 'text-amber-600' : 'text-textMuted'}`}>
                    {isMaintenance ? (language === 'ar' ? '🔧 الصيانة مفعّلة' : '🔧 Maintenance ON') : (language === 'ar' ? 'النظام يعمل بشكل طبيعي' : 'System running normally')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-textMain">{language === 'ar' ? 'رسالة الصيانة' : 'Maintenance Message'}</label>
                  <Input
                    value={maintenanceMsg}
                    onChange={e => setMaintenanceMsg(e.target.value)}
                    placeholder={language === 'ar' ? 'رسالة تظهر للمستخدمين أثناء الصيانة' : 'Message shown to users during maintenance'}
                  />
                </div>

                <Button onClick={saveMaintenance} isLoading={isMaintenanceSaving} className="rounded-xl">
                  {language === 'ar' ? 'حفظ إعدادات الصيانة' : 'Save Maintenance Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Plans */}
          <Card className="rounded-3xl border-border/50 shadow-premium">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/20">
                    <Cash className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-textMain">{language === 'ar' ? 'خطط الاشتراك' : 'Subscription Plans'}</h2>
                    <p className="text-xs text-textMuted">{language === 'ar' ? 'تُعرض في الصفحة الرئيسية العامة' : 'Shown on the public landing page'}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setShowPlanForm(true); setEditingPlan(null); }} className="rounded-xl">
                  <PlusLg className="h-4 w-4 mr-1" />
                  {language === 'ar' ? 'إضافة خطة' : 'Add Plan'}
                </Button>
              </div>

              {/* Plan Form */}
              {showPlanForm && (
                <div className="mb-6 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border animate-in slide-in-from-top duration-300">
                  <form onSubmit={handlePlanSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input required placeholder="Title (English)" value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} />
                      <Input placeholder="العنوان (عربي)" value={planForm.title_ar} onChange={e => setPlanForm({...planForm, title_ar: e.target.value})} />
                      <Input required type="number" placeholder={language === 'ar' ? 'السعر' : 'Price'} value={planForm.price} onChange={e => setPlanForm({...planForm, price: e.target.value})} min="0" step="0.01" />
                      <select
                        value={planForm.duration}
                        onChange={e => setPlanForm({...planForm, duration: e.target.value as any})}
                        className="border border-border rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-textMain focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</option>
                        <option value="yearly">{language === 'ar' ? 'سنوي' : 'Yearly'}</option>
                      </select>
                    </div>
                    <Input placeholder="Features (comma-separated, English)" value={planForm.features} onChange={e => setPlanForm({...planForm, features: e.target.value})} />
                    <Input placeholder="الميزات (مفصولة بفاصلة، عربي)" value={planForm.features_ar} onChange={e => setPlanForm({...planForm, features_ar: e.target.value})} />
                    <Input placeholder={language === 'ar' ? 'معلومات الدفع' : 'Payment info'} value={planForm.payment_info} onChange={e => setPlanForm({...planForm, payment_info: e.target.value})} />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={planForm.is_popular} onChange={e => setPlanForm({...planForm, is_popular: e.target.checked})} className="rounded" />
                        {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                      </label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={resetPlanForm} className="rounded-xl">{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                      <Button type="submit" size="sm" className="rounded-xl"><Save className="h-3.5 w-3.5 mr-1" />{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Plans list */}
              {isPlansLoading ? (
                <div className="flex justify-center p-10"><ArrowRepeat className="h-8 w-8 animate-spin text-primary-500 opacity-50" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-textMain truncate">{language === 'ar' ? (plan.title_ar || plan.title) : plan.title}</span>
                          {plan.is_popular && <StarFill className="h-3 w-3 text-yellow-500" />}
                        </div>
                        <p className="text-[11px] text-textMuted font-mono mt-0.5">
                          {plan.price} ج.م / {plan.duration === 'monthly' ? 'شهر' : 'سنة'}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEditPlan(plan)} className="h-8 w-8"><PencilSquare className="h-4 w-4 text-primary-500" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)} className="h-8 w-8"><Trash className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
