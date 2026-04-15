'use client';

import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuth';
import { translations } from '@/locales/translations';
import {
  Robot, SendFill, ExclamationTriangleFill, BoxSeamFill, ClockFill, ArrowRepeat,
  Capsule, ArrowCounterclockwise, Stars, PersonFill
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

type Message = {
  id: number;
  role: 'user' | 'ai';
  text: string;
};

type Alert = {
  type: 'expired' | 'near_expiry' | 'low_stock';
  products: any[];
};

export default function AIChatPage() {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const t = translations[language];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load alerts on mount
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const [expiredRes, expiringRes, lowStockRes] = await Promise.all([
          axiosInstance.get('/products-expired'),
          axiosInstance.get('/products-expiring'),
          axiosInstance.get('/products-low-stock'),
        ]);
        const newAlerts: Alert[] = [];
        if (expiredRes.data?.length > 0)   newAlerts.push({ type: 'expired',    products: expiredRes.data });
        if (expiringRes.data?.length > 0)  newAlerts.push({ type: 'near_expiry', products: expiringRes.data });
        if (lowStockRes.data?.length > 0)  newAlerts.push({ type: 'low_stock',  products: lowStockRes.data });
        setAlerts(newAlerts);
      } catch {
        console.error('Failed to load alerts');
      } finally {
        setAlertsLoading(false);
      }
    };
    loadAlerts();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: Message = { id: Date.now(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history from previous messages for multi-turn chat
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));

      const res = await axiosInstance.post('/ai/chat', {
        message: userText,
        history,
      });

      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'ai',
        text: res.data.response || (language === 'ar' ? 'لم يرد الذكاء الاصطناعي.' : 'No response from AI.'),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'Error occurred. Try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const getAlertIcon = (type: string) => {
    if (type === 'expired')    return <ExclamationTriangleFill className="h-4 w-4 text-red-500" />;
    if (type === 'near_expiry') return <ClockFill className="h-4 w-4 text-yellow-500" />;
    return <BoxSeamFill className="h-4 w-4 text-orange-500" />;
  };

  const getAlertTitle = (type: string) => {
    if (type === 'expired')    return language === 'ar' ? '🚨 منتهية الصلاحية' : '🚨 Expired';
    if (type === 'near_expiry') return language === 'ar' ? '⚠️ تنتهي قريباً' : '⚠️ Expiring Soon';
    return language === 'ar' ? '📦 مخزون منخفض' : '📦 Low Stock';
  };

  const getAlertBg = (type: string) => {
    if (type === 'expired')    return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
    if (type === 'near_expiry') return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
    return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
  };

  const quickPrompts = language === 'ar'
    ? ['ما هي أدوية الضغط؟', 'بدائل الباراسيتامول؟', 'المنتجات المنخفضة؟', 'تحليل المبيعات']
    : ['Blood pressure meds?', 'Paracetamol alternatives?', 'Low stock items?', 'Sales analysis'];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">

      {/* ── Alerts Panel ─────────────────────────────────────────── */}
      <div className="w-full lg:w-72 flex flex-col gap-3 overflow-y-auto flex-shrink-0">
        <div className="flex items-center gap-2 px-1">
          <ExclamationTriangleFill className="h-5 w-5 text-red-500" />
          <h2 className="text-base font-bold text-textMain">
            {language === 'ar' ? 'تنبيهات الأدوية' : 'Medicine Alerts'}
          </h2>
          {alerts.length > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {alerts.reduce((acc, a) => acc + a.products.length, 0)}
            </span>
          )}
        </div>

        {alertsLoading ? (
          <div className="flex justify-center p-6">
            <ArrowRepeat className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm text-textMuted font-medium">
                {language === 'ar' ? 'لا توجد تنبيهات' : 'No alerts'}
              </p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert, idx) => (
            <Card key={idx} className={`border ${getAlertBg(alert.type)}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {getAlertIcon(alert.type)}
                  <span className="text-sm font-bold">{getAlertTitle(alert.type)}</span>
                  <span className="ml-auto text-xs font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                    {alert.products.length}
                  </span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {alert.products.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center text-xs py-0.5">
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="text-textMuted whitespace-nowrap mr-2">
                        {alert.type === 'low_stock'
                          ? `${p.stock} ${language === 'ar' ? 'قطعة' : 'pcs'}`
                          : new Date(p.expiration_date).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Quick Prompts */}
        <div className="mt-2">
          <p className="text-xs text-textMuted mb-2 px-1 font-medium">
            {language === 'ar' ? 'أسئلة سريعة:' : 'Quick prompts:'}
          </p>
          <div className="flex flex-col gap-1.5">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                className="text-left rtl:text-right text-xs px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100 dark:border-primary-800 font-medium"
              >
                 {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chat Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">

        {/* Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary-600 to-primary-700 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Stars className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base leading-none">
              {language === 'ar' ? 'مساعد الصيدلية الذكي' : 'Pharmacy AI Assistant'}
            </h2>
            <p className="text-xs text-white/70 mt-0.5">Powered by Gemini AI</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="mr-auto rtl:mr-0 rtl:ml-auto flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
            >
              <ArrowCounterclockwise className="h-3 w-3" />
              {language === 'ar' ? 'محادثة جديدة' : 'New chat'}
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                <Robot className="h-10 w-10 text-primary-400" />
              </div>
              <h3 className="text-lg font-bold text-textMain mb-2">
                {language === 'ar' ? 'مرحباً! كيف أقدر أساعدك؟' : 'Hello! How can I help?'}
              </h3>
              <p className="text-sm text-textMuted max-w-sm">
                {language === 'ar'
                  ? 'اسألني عن أي دواء، بدائله، أعراضه، أو اطلب مني تحليل مخزون صيدليتك'
                  : 'Ask me about any medicine, alternatives, symptoms, or request inventory analysis'}
              </p>
              <div className="flex gap-2 mt-4">
                <span className="flex items-center gap-1 text-xs text-textMuted bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  <Capsule className="h-3 w-3" /> {language === 'ar' ? 'بدائل الأدوية' : 'Drug alternatives'}
                </span>
                <span className="flex items-center gap-1 text-xs text-textMuted bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  <BoxSeamFill className="h-3 w-3" /> {language === 'ar' ? 'تحليل المخزون' : 'Stock analysis'}
                </span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm ${
                msg.role === 'user' ? 'bg-primary-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                {msg.role === 'user' ? <PersonFill className="h-4 w-4" /> : <Stars className="h-4 w-4" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-textMain rounded-bl-sm border border-border'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <Stars className="h-4 w-4" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-border">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-800/50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
              className="flex-1 bg-white dark:bg-slate-900 border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              isLoading={isLoading}
              className="px-4 rounded-xl"
            >
              <SendFill className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-textMuted mt-2 text-center">
            {language === 'ar' ? 'يعمل بـ Google Gemini AI' : 'Powered by Google Gemini AI'}
          </p>
        </div>
      </div>
    </div>
  );
}
