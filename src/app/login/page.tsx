'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuth';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Shop, CheckLg, StarFill, Telephone, Envelope, Clock, ShieldLock,
  ChevronRight, Robot, BoxSeam, BarChartLine, ArrowRepeat, X, Eye, EyeSlash
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

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
};

export default function LoginPage() {
  const router = useRouter();
  const { token, setAuth } = useAuthStore();

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRememberMe, setIsRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    axiosInstance.get('/plans').then(res => setPlans(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/login', { email, password });
      if (response.data.token && response.data.user) {
        setAuth(response.data.user, response.data.token, isRememberMe);
        toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح ✅' : 'Login successful ✅');
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (language === 'ar' ? 'بيانات خاطئة' : 'Invalid credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatures = (plan: Plan) =>
    (language === 'ar' ? plan.features_ar || plan.features : plan.features)
      ?.split(',')
      .map(f => f.trim())
      .filter(Boolean) || [];

  const features = [
    { icon: BoxSeam, label: language === 'ar' ? 'إدارة المخزون' : 'Inventory Management' },
    { icon: BarChartLine, label: language === 'ar' ? 'تحليلات المبيعات' : 'Sales Analytics' },
    { icon: Robot, label: language === 'ar' ? 'ذكاء اصطناعي متطور' : 'Advanced AI Assistant' },
    { icon: ShieldLock, label: language === 'ar' ? 'أمان وخصوصية' : 'Security & Privacy' },
    { icon: Clock, label: language === 'ar' ? 'تنبيهات انتهاء الصلاحية' : 'Expiry Alerts' },
    { icon: Shop, label: language === 'ar' ? 'إدارة متعددة الفروع' : 'Multi-Branch Support' },
  ];

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 text-white">

      {/* ── Navbar ───────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Pharma.M" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-xl font-extrabold text-primary-400">Pharma.M</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-xs text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>
            <Button onClick={() => setShowLoginForm(true)} className="rounded-xl px-5">
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              <ChevronRight className="h-4 w-4 ml-1 rtl:mr-1 rtl:ml-0 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-900/40 border border-primary-700/50 text-primary-300 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <Robot className="h-4 w-4" />
          {language === 'ar' ? 'النظام الذكي لإدارة الصيدليات' : 'Intelligent Pharmacy Management System'}
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">Pharma.M</span>
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          {language === 'ar'
            ? 'نظام متكامل لإدارة الصيدليات بالذكاء الاصطناعي. تتبع المخزون، نقاط البيع، التنبيهات الذكية، وأكثر.'
            : 'Complete pharmacy management with AI. Track inventory, sales, smart alerts, and more.'}
        </p>
        <Button size="lg" onClick={() => setShowLoginForm(true)} className="rounded-2xl px-8 py-4 text-base shadow-lg shadow-primary-900/50">
          {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
          <ChevronRight className="h-5 w-5 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
        </Button>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          {language === 'ar' ? '✨ مميزات النظام' : '✨ System Features'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feat, i) => (
            <div key={i} className="group flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary-500/50 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-900/50 border border-primary-700/50 group-hover:border-primary-500/70 transition-colors flex-shrink-0">
                <feat.icon className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-sm font-medium text-slate-200">{feat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing Plans ────────────────────────── */}
      {plans.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16" id="pricing">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">
            {language === 'ar' ? '💎 خطط الاشتراك' : '💎 Subscription Plans'}
          </h2>
          <p className="text-center text-slate-400 mb-12">
            {language === 'ar' ? 'اختر الخطة المناسبة لصيدليتك' : 'Choose the right plan for your pharmacy'}
          </p>
          <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 border transition-all ${
                  plan.is_popular
                    ? 'bg-gradient-to-b from-primary-900/80 to-primary-950/80 border-primary-500/70 shadow-lg shadow-primary-900/40'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow">
                      <StarFill className="h-3 w-3 fill-black" />
                      {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {language === 'ar' ? (plan.title_ar || plan.title) : plan.title}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm">
                      {language === 'ar' ? 'ج.م' : 'EGP'} / {plan.duration === 'monthly' ? (language === 'ar' ? 'شهر' : 'month') : (language === 'ar' ? 'سنة' : 'year')}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {getFeatures(plan).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckLg className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl ${plan.is_popular ? '' : 'variant-outline'}`}
                  variant={plan.is_popular ? 'default' : 'outline'}
                  onClick={() => setShowLoginForm(true)}
                >
                  {language === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
                </Button>
                {plan.payment_info && (
                  <p className="mt-3 text-xs text-slate-500 text-center">{plan.payment_info}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t border-white/10 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© 2025 Pharma.M — {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
        </div>
      </footer>

      {/* ── Login Dialog ─────────────────────────── */}
      {showLoginForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Pharma.M" className="h-8 w-8 rounded-lg object-contain" />
                <h2 className="text-lg font-bold text-white">Pharma.M</h2>
              </div>
              <button onClick={() => setShowLoginForm(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/40 border border-red-700/50 text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email" id="email" name="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password" name="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isRememberMe} onChange={e => setIsRememberMe(e.target.checked)} className="rounded" />
                <span className="text-sm text-slate-400">{language === 'ar' ? 'تذكرني' : 'Remember me'}</span>
              </label>
              <Button type="submit" className="w-full rounded-xl py-3" isLoading={isLoading}>
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
