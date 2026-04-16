'use client';
// Dashboard v2.1 - Admin System Tools (Backup + Sync)
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuth';
import { translations } from '@/locales/translations';
import {
  CashStack, BoxSeam, GraphUpArrow, ArrowRepeat, ExclamationTriangleFill,
  Clock, Robot, Send, Shop, PeopleFill, ArrowUpRight, ArrowDownRight,
  Activity, ShieldExclamation, CheckCircle, Stars, Cart4, Database, CloudDownload
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon: Icon, trend, trendLabel, accent,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accent: 'violet' | 'emerald' | 'rose' | 'amber' | 'sky' | 'orange';
}) {
  const accentMap = {
    violet:  { bg: 'grad-violet',  icon: 'text-white',  border: 'border-violet-200/50',  dot: 'bg-violet-400' },
    emerald: { bg: 'grad-emerald', icon: 'text-white', border: 'border-emerald-200/50', dot: 'bg-emerald-400' },
    rose:    { bg: 'grad-rose',    icon: 'text-white',    border: 'border-rose-200/50',    dot: 'bg-rose-400' },
    amber:   { bg: 'grad-amber',   icon: 'text-white',   border: 'border-amber-200/50',   dot: 'bg-amber-400' },
    sky:     { bg: 'grad-sky',     icon: 'text-white',      border: 'border-sky-200/50',      dot: 'bg-sky-400' },
    orange:  { bg: 'grad-orange',  icon: 'text-white',  border: 'border-orange-200/50',  dot: 'bg-orange-400' },
  };
  const a = accentMap[accent];

  return (
    <div className={`group relative rounded-3xl border ${a.border} bg-surface dark:bg-slate-900 shadow-premium shadow-premium-hover transition-all duration-300 overflow-hidden p-6`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${a.bg} shadow-lg shadow-black/10`}>
          <Icon className={`h-6 w-6 ${a.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full ${
            trend === 'up'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : trend === 'down'
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
            {trendLabel}
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] sm:text-xs font-black text-textMuted uppercase tracking-[0.1em] opacity-80">{title}</p>
        <p className="mt-1 text-2xl sm:text-3xl font-black text-textMain tabular-nums tracking-tighter">{value ?? '—'}</p>
      </div>
      
      {/* Decorative background element */}
      <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full ${a.bg} opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, count, color = 'text-textMain' }: {
  icon: React.ElementType; title: string; count?: number; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h2 className={`text-sm font-black uppercase tracking-widest ${color}`}>{title}</h2>
      {count !== undefined && (
        <span className="ltr:ml-auto rtl:mr-auto text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-textMuted border border-border/50 shadow-sm">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────────
function ProductRow({ name, date, variant }: { name: string; date: string; variant: 'red' | 'yellow' }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl px-4 py-3 border shadow-sm transition-all hover:scale-[1.01] ${
      variant === 'red'
        ? 'bg-rose-50/40 border-rose-100/50 dark:bg-rose-950/20 dark:border-rose-900/30'
        : 'bg-amber-50/40 border-amber-100/50 dark:bg-amber-950/20 dark:border-amber-900/30'
    }`}>
      <span className="text-sm font-bold text-textMain truncate ltr:pr-2 rtl:pl-2">{name}</span>
      <div className="flex items-center gap-2">
        <Clock className={`h-3 w-3 ${variant === 'red' ? 'text-rose-500' : 'text-amber-500'}`} />
        <span className={`text-[11px] font-black tracking-tight shrink-0 ${variant === 'red' ? 'text-rose-600' : 'text-amber-600'}`}>
          {date}
        </span>
      </div>
    </div>
  );
}

// ─── Quick Actions ───────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, href, color }: {
  icon: React.ElementType; label: string; href: string; color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-surface dark:bg-slate-900 border border-border shadow-premium shadow-premium-hover transition-all duration-300"
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color} text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-transform`}>
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-xs font-extrabold text-textMain text-center">{label}</span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { language } = useAppStore();
  const t = translations[language];
  const { user } = useAuthStore();
  const isAr = language === 'ar';

  const [stats, setStats] = useState<any>({});
  const [expiringProducts, setExpiringProducts] = useState<any[]>([]);
  const [expiredProducts, setExpiredProducts] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBackup = async () => {
    try {
      setIsProcessing(true);
      const response = await axiosInstance.get('/admin/system/backup', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${new Date().toISOString().split('T')[0]}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(isAr ? 'بدأ تحميل النسخة الاحتياطية' : 'Backup download started');
    } catch (error) {
      toast.error(isAr ? 'فشل إنشاء النسخة الاحتياطية' : 'Backup failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncDrugs = async () => {
    try {
      setIsProcessing(true);
      const res = await axiosInstance.post('/admin/system/sync-drugs');
      toast.success(res.data.message || (isAr ? 'تمت المزامنة بنجاح' : 'Sync successful'));
    } catch (error) {
      toast.error(isAr ? 'فشلت المزامنة' : 'Sync failed');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (user?.role === 'admin') {
          const [statsRes, pharmRes] = await Promise.all([
            axiosInstance.get('/pharmacies/stats'),
            axiosInstance.get('/pharmacies'),
          ]);
          setStats(statsRes.data);
          setPharmacies(pharmRes.data.data || pharmRes.data);
        } else {
          const [analyticsRes, expiringRes, expiredRes] = await Promise.all([
            axiosInstance.get('/sales/analytics'),
            axiosInstance.get('/products-expiring'),
            axiosInstance.get('/products-expired'),
          ]);
          setStats(analyticsRes.data);
          setExpiringProducts(expiringRes.data);
          setExpiredProducts(expiredRes.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <ArrowRepeat className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-xs text-textMuted font-medium">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.id === 1;

  // ── Stat cards data ──
  const statCards = isAdmin ? [
    {
      title: isAr ? 'إجمالي الصيدليات' : 'Total Pharmacies',
      value: stats.total_pharmacies ?? 0,
      icon: Shop, accent: 'violet' as const,
    },
    {
      title: isAr ? 'الصيدليات النشطة' : 'Active Pharmacies',
      value: stats.active_pharmacies ?? 0,
      icon: CheckCircle, accent: 'emerald' as const,
    },
    {
      title: isAr ? 'اشتراكات منتهية' : 'Expired Subs',
      value: stats.expired_subscriptions ?? 0,
      icon: ShieldExclamation, accent: 'rose' as const,
    },
    {
      title: isAr ? 'إجمالي المستخدمين' : 'Total Users',
      value: stats.total_users ?? 0,
      icon: PeopleFill, accent: 'sky' as const,
    },
  ] : [
    {
      title: isAr ? 'أرباح شيفت الصباح' : 'Morning Profit',
      value: `${(stats.daily_profit_morning || 0).toFixed(2)}`,
      icon: Activity, accent: 'amber' as const,
    },
    {
      title: isAr ? 'أرباح شيفت المساء' : 'Evening Profit',
      value: `${(stats.daily_profit_evening || 0).toFixed(2)}`,
      icon: Activity, accent: 'sky' as const,
    },
    {
      title: isAr ? 'إجمالي أرباح اليوم' : 'Total Profit Today',
      value: `${(stats.daily_profit || 0).toFixed(2)}`,
      icon: GraphUpArrow, accent: 'emerald' as const, trend: 'up' as const,
    },
    {
      title: t.monthlyProfit,
      value: `${(stats.monthly_profit || 0).toFixed(2)}`,
      icon: CashStack, accent: 'violet' as const,
    },
  ];

  // ── Locked pharmacies ──
  const lockedPharmacies = pharmacies.filter(p => p.is_locked || p.is_subscription_expired);

  return (
    <div className="space-y-7 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-textMain tracking-tight">
            {isAdmin
              ? (isAr ? 'نظرة عامة على النظام' : 'System Overview')
              : t.dashboard}
          </h1>
          <p className="mt-0.5 text-xs text-textMuted">
            {isAr
              ? `مرحباً، ${user?.name || 'مستخدم'} 👋`
              : `Welcome back, ${user?.name || 'User'} 👋`}
          </p>
        </div>
        {isAdmin && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">
            <Stars className="h-3 w-3" />
            SaaS Owner
          </span>
        )}
      </div>

      {/* ── Admin: System Tools ── */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button
            disabled={isProcessing}
            onClick={handleBackup}
            className="group flex items-center justify-between p-6 rounded-3xl bg-surface dark:bg-slate-900 border-2 border-primary-500/20 shadow-premium shadow-premium-hover transition-all duration-300 ltr:text-left rtl:text-right disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl grad-rose text-white shadow-lg shadow-black/10 transition-transform group-hover:scale-110">
                <CloudDownload className="h-7 w-7" />
              </div>
              <div>
                <span className="block text-sm font-black text-textMain">
                  {isAr ? 'النسخ الاحتياطي للداتا' : 'Full Database Backup'}
                </span>
                <span className="block text-[10px] font-bold text-textMuted mt-0.5 uppercase tracking-wider">
                  {isAr ? 'تحميل وحفظ نسخة SQL' : 'Download & Store SQL'}
                </span>
              </div>
            </div>
            {isProcessing && <ArrowRepeat className="h-5 w-5 animate-spin text-textMuted" />}
          </button>

          <button
            disabled={isProcessing}
            onClick={handleSyncDrugs}
            className="group flex items-center justify-between p-6 rounded-3xl bg-surface dark:bg-slate-900 border-2 border-primary-500/20 shadow-premium shadow-premium-hover transition-all duration-300 ltr:text-left rtl:text-right disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl grad-violet text-white shadow-lg shadow-black/10 transition-transform group-hover:scale-110">
                <Database className="h-7 w-7" />
              </div>
              <div>
                <span className="block text-sm font-black text-textMain">
                  {isAr ? 'مزامنة الأدوية (26 ألف صنف)' : 'Sync Global Drug Catalog'}
                </span>
                <span className="block text-[10px] font-bold text-textMuted mt-0.5 uppercase tracking-wider">
                  {isAr ? 'تحديث جميع الصيدليات' : 'Update All Pharmacies'}
                </span>
              </div>
            </div>
            {isProcessing && <ArrowRepeat className="h-5 w-5 animate-spin text-textMuted" />}
          </button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, idx) => (
          <StatCard key={idx} {...card} />
        ))}
      </div>

      {/* ── Quick Actions Section ── */}
      {!isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <QuickAction 
            icon={Cart4} 
            label={isAr ? 'بيع جديد (POS)' : 'New Sale (POS)'} 
            href="/pos" 
            color="grad-violet" 
          />
          <QuickAction 
            icon={BoxSeam} 
            label={isAr ? 'إضافة منتجات' : 'Add Products'} 
            href="/products" 
            color="grad-emerald" 
          />
          <QuickAction 
            icon={Activity} 
            label={isAr ? 'تاريخ المبيعات' : 'Sales History'} 
            href="/sales" 
            color="grad-sky" 
          />
          <QuickAction 
            icon={Clock} 
            label={isAr ? 'إدارة الورديات' : 'Shift Manager'} 
            href="/accounting" 
            color="grad-amber" 
          />
        </div>
      )}

      {/* ── Admin: Locked Pharmacies ── */}
      {isAdmin && (
        <div className="rounded-2xl border border-border bg-surface dark:bg-white/[0.03] shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <SectionHeader
              icon={Clock}
              title={isAr ? 'اشتراكات تنتهي قريباً' : 'Expiring Subscriptions'}
              count={lockedPharmacies.length}
              color="text-amber-600 dark:text-amber-400"
            />
          </div>
          <div className="p-5">
            {lockedPharmacies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium text-textMuted">
                  {isAr ? 'كل الاشتراكات سارية ✓' : 'All subscriptions are active ✓'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {lockedPharmacies.slice(0, 8).map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-textMain truncate">{p.name}</p>
                      <p className="text-xs text-textMuted mt-0.5">
                        {p.subscription_ends_at
                          ? new Date(p.subscription_ends_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')
                          : '—'}
                      </p>
                    </div>
                    <span className={`shrink-0 ltr:ml-3 rtl:mr-3 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      p.is_frozen
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}>
                      {p.is_frozen
                        ? (isAr ? 'مجمّد' : 'Frozen')
                        : (isAr ? 'منتهي' : 'Expired')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pharmacy: Expiry Alerts ── */}
      {!isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Expired */}
          <div className="rounded-2xl border border-border bg-surface dark:bg-white/[0.03] shadow-sm overflow-hidden">
            <div className="border-b border-rose-100 dark:border-rose-900/30 px-5 py-4 bg-rose-50/40 dark:bg-rose-950/10">
              <SectionHeader
                icon={ExclamationTriangleFill}
                title={t.expiredProducts}
                count={expiredProducts.length}
                color="text-rose-600 dark:text-rose-400"
              />
            </div>
            <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
              {expiredProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-textMuted">
                  {isAr ? 'لا توجد منتجات منتهية 🎉' : 'No expired products 🎉'}
                </p>
              ) : (
                expiredProducts.map((p: any) => (
                  <ProductRow
                    key={p.id}
                    name={p.name}
                    date={new Date(p.expiration_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}
                    variant="red"
                  />
                ))
              )}
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="rounded-2xl border border-border bg-surface dark:bg-white/[0.03] shadow-sm overflow-hidden">
            <div className="border-b border-amber-100 dark:border-amber-900/30 px-5 py-4 bg-amber-50/40 dark:bg-amber-950/10">
              <SectionHeader
                icon={Clock}
                title={t.expiringProducts}
                count={expiringProducts.length}
                color="text-amber-600 dark:text-amber-400"
              />
            </div>
            <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
              {expiringProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-textMuted">
                  {isAr ? 'لا توجد منتجات قاربت على الانتهاء 👍' : 'No products expiring soon 👍'}
                </p>
              ) : (
                expiringProducts.map((p: any) => (
                  <ProductRow
                    key={p.id}
                    name={p.name}
                    date={new Date(p.expiration_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}
                    variant="yellow"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pharmacy: Sales Chart ── */}
      {!isAdmin && stats.chart_data && (
        <div className="rounded-2xl border border-border bg-surface dark:bg-white/[0.03] shadow-sm overflow-hidden p-5">
          <SectionHeader
            icon={GraphUpArrow}
            title={isAr ? 'تحليل المبيعات والأرباح (آخر 7 أيام)' : 'Sales & Profit Analysis (Last 7 Days)'}
            color="text-violet-600 dark:text-violet-400"
          />
          <div className="mt-4" style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 900 }} 
                  dy={15} 
                  tickFormatter={str => {
                    const date = new Date(str);
                    return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
                  }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 900 }} 
                  dx={isAr ? 15 : -15}
                  domain={[0, 'auto']}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: '1px solid #E2E8F0', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                  labelStyle={{ fontWeight: 900, color: '#1E293B', marginBottom: '4px', fontSize: '13px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name={isAr ? 'الإيرادات' : 'Revenue'} 
                  stroke="#8b5cf6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  name={isAr ? 'الأرباح' : 'Profit'} 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
