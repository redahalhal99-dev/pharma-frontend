'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuth';
import { translations } from '@/locales/translations';
import { PersonCircle, LockFill, EnvelopeFill, Save, ArrowRepeat, ShieldFillCheck, HeartPulseFill, BriefcaseFill } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { language } = useAppStore();
  const t = translations[language];
  const { user, setAuth, token } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const getRoleIcon = () => {
    if (user?.role === 'admin')   return <ShieldFillCheck className="h-6 w-6 text-purple-500" />;
    if (user?.role === 'doctor')  return <HeartPulseFill className="h-6 w-6 text-blue-500" />;
    return <BriefcaseFill className="h-6 w-6 text-slate-500" />;
  };

  const getRoleBadge = () => {
    if (user?.role === 'admin')   return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (user?.role === 'doctor')  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin')   return language === 'ar' ? 'مدير النظام' : 'Admin';
    if (user?.role === 'doctor')  return language === 'ar' ? 'دكتور' : 'Doctor';
    return language === 'ar' ? 'كاشير' : 'Cashier';
  };

  const canEditEmail    = user?.role !== 'cashier';
  const canEditPassword = user?.role !== 'cashier';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (canEditPassword && formData.password && formData.password !== formData.confirmPassword) {
      toast.error(language === 'ar' ? 'كلمتا المرور غير متطابقتان' : 'Passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = { name: formData.name };
      if (canEditEmail && formData.email)    payload.email    = formData.email;
      if (canEditPassword && formData.password) payload.password = formData.password;

      const res = await axiosInstance.put('/profile', payload);

      // Update auth store with new user data
      if (token) {
        setAuth({ ...user!, ...res.data }, token);
      }

      // Clear password fields
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      toast.success(language === 'ar' ? 'تم تحديث الملف الشخصي ✅' : 'Profile updated ✅');
    } catch (err: any) {
      toast.error(err.response?.data?.message || (language === 'ar' ? 'فشل التحديث' : 'Update failed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
              {getRoleIcon()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-textMain">{user?.name}</h1>
              <p className="text-sm text-textMuted mt-0.5">{user?.email}</p>
              <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${getRoleBadge()}`}>
                {getRoleLabel()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-bold text-textMain mb-5 flex items-center gap-2">
            <PersonCircle className="h-4 w-4 text-primary-600" />
            {language === 'ar' ? 'تعديل البيانات الشخصية' : 'Edit Profile'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-textMain">
                {language === 'ar' ? 'الاسم' : 'Name'}
              </label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                required
              />
            </div>

            {/* Email (not for cashier) */}
            {canEditEmail && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-textMain flex items-center gap-1.5">
                  <EnvelopeFill className="h-3.5 w-3.5" />
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
            )}

            {/* Password (not for cashier) */}
            {canEditPassword && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-textMain flex items-center gap-1.5">
                    <LockFill className="h-3.5 w-3.5" />
                    {language === 'ar' ? 'كلمة مرور جديدة' : 'New Password'}
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-textMain">
                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* Cashier notice */}
            {!canEditEmail && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                {language === 'ar'
                  ? '💡 الكاشير يستطيع تغيير اسمه فقط. لتغيير الإيميل أو كلمة المرور، تواصل مع الدكتور.'
                  : '💡 Cashiers can only change their name. Contact the doctor to change email or password.'}
              </div>
            )}

            <Button type="submit" isLoading={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
