'use client';

import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, Robot } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

type Message = {
  id: number;
  message: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
    role: string;
  };
};

export default function SupportPage() {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axiosInstance.get('/support');
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    const tempMessage = newMessage;
    setNewMessage('');

    try {
      const res = await axiosInstance.post('/support', { message: tempMessage });
      setMessages((prev) => [...prev, res.data]);
    } catch (err: any) {
      toast.error(language === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send message');
      setNewMessage(tempMessage); // Restore draft
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center text-primary-600"><Robot className="h-8 w-8 animate-bounce" /></div>;
  }

  return (
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto rounded-3xl bg-surface border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 md:p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
          <Robot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{language === 'ar' ? 'الدعم الفني' : 'Technical Support'}</h1>
          <p className="text-sm opacity-90">{language === 'ar' ? 'تواصل مع الإدارة مباشرة' : 'Contact management directly'}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-textMuted opacity-60">
            <Robot className="h-16 w-16 mb-4" />
            <p>{language === 'ar' ? 'لا توجد رسائل حالياً. كيف يمكننا مساعدتك؟' : 'No messages yet. How can we help?'}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = !msg.is_from_admin && msg.user?.id === user?.id;
            const isPharmacyStaff = !msg.is_from_admin && msg.user?.id !== user?.id; // e.g. cashier sent it
            
            let bubbleClass = '';
            let wrapperClass = '';
            
            if (msg.is_from_admin) {
              wrapperClass = 'justify-start';
              bubbleClass = 'bg-white dark:bg-slate-800 text-textMain border border-border rounded-tl-sm';
            } else if (isMe) {
              wrapperClass = 'justify-end';
              bubbleClass = 'bg-primary-600 text-white rounded-tr-sm shadow-md shadow-primary-600/20';
            } else {
              wrapperClass = 'justify-end';
              bubbleClass = 'bg-primary-400 text-white rounded-tr-sm';
            }

            return (
              <div key={msg.id} className={`flex w-full ${wrapperClass}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 ${bubbleClass}`}>
                  {!msg.is_from_admin && (
                    <p className="text-[10px] font-medium opacity-70 mb-1">{msg.user?.name} ({msg.user?.role})</p>
                  )}
                  {msg.is_from_admin && (
                    <p className="text-[10px] font-bold text-primary-600 mb-1">{language === 'ar' ? 'الإدارة' : 'Admin'}</p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  <div className="flex justify-end mt-2">
                    <span className="text-[10px] opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-surface border-t border-border shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message...'}
            className="flex-1 rounded-full h-12 bg-slate-50 dark:bg-slate-800 text-sm px-6 border-slate-200 dark:border-slate-700"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            isLoading={isSending} 
            className="h-12 w-12 rounded-full p-0 flex items-center justify-center flex-shrink-0 bg-primary-600 hover:bg-primary-700"
          >
            {!isSending && <Send className={`h-5 w-5 ${language === 'ar' ? 'rotate-180' : ''} -ml-1`} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
