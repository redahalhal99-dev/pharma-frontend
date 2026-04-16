'use client';

import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, Robot, Check2All } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

type Conversation = {
  pharmacy_id: number;
  pharmacy_name: string;
  unread_count: number;
  last_message: any;
  messages: any[];
};

export default function AdminSupportPage() {
  const { language } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll to bottom when conversation changes or new messages arrive
    if (activeConv) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConv?.messages.length]);

  const fetchConversations = async () => {
    try {
      const res = await axiosInstance.get('/admin/support');
      setConversations(res.data);
      
      // Update active conversation if it exists
      if (activeConv) {
        const updated = res.data.find((c: Conversation) => c.pharmacy_id === activeConv.pharmacy_id);
        if (updated) setActiveConv(updated);
      }
    } catch (err) {
      console.error('Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    if (conv.unread_count > 0) {
      try {
        await axiosInstance.post(`/admin/support/${conv.pharmacy_id}/read`);
        // Refresh to clear unread badge locally
        fetchConversations();
      } catch (e) {}
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    setIsSending(true);
    const tempMessage = newMessage;
    setNewMessage('');

    try {
      await axiosInstance.post(`/admin/support/${activeConv.pharmacy_id}/reply`, { message: tempMessage });
      fetchConversations(); // Refresh to get the new message in the state
    } catch (err: any) {
      toast.error(language === 'ar' ? 'فشل الإرسال' : 'Failed to send');
      setNewMessage(tempMessage); // Restore draft
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Robot className="h-8 w-8 animate-bounce text-primary-600" /></div>;
  }

  return (
    <div className="flex h-[85vh] bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
      
      {/* ── Sidebar (List of Pharmacies) ── */}
      <div className={`w-full md:w-80 flex flex-col border-r border-border shrink-0 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-bold text-lg text-textMain">{language === 'ar' ? 'صندوق الوارد' : 'Inbox'}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-center text-sm text-textMuted mt-10">{language === 'ar' ? 'لا توجد رسائل' : 'No messages'}</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.pharmacy_id}
                onClick={() => selectConversation(conv)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-start ${
                  activeConv?.pharmacy_id === conv.pharmacy_id 
                    ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-900' 
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 shrink-0">
                  <Robot className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-textMain truncate">{conv.pharmacy_name}</h3>
                    <span className="text-[10px] text-textMuted whitespace-nowrap ml-2">
                       {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted truncate">
                    {conv.last_message.is_from_admin ? (language === 'ar' ? 'أنت: ' : 'You: ') : ''}
                    {conv.last_message.message}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0">
                    {conv.unread_count}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-textMuted opacity-60 bg-slate-50 dark:bg-slate-900/50">
            <Robot className="h-16 w-16 mb-4" />
            <p>{language === 'ar' ? 'اختر صيدلية لعرض الرسائل' : 'Select a pharmacy to view messages'}</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-white dark:bg-slate-900 shrink-0">
              <button 
                onClick={() => setActiveConv(null)}
                className="md:hidden p-2 -ml-2 text-textMuted hover:text-textMain"
              >
                &larr; {/* Back arrow icon */}
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Robot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-textMain">{activeConv.pharmacy_name}</h2>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
              {activeConv.messages.map((msg) => {
                const isAdmin = msg.is_from_admin;
                
                return (
                  <div key={msg.id} className={`flex w-full ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 ${
                      isAdmin 
                        ? 'bg-primary-600 text-white rounded-tr-sm shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-textMain border border-border rounded-tl-sm'
                    }`}>
                      {!isAdmin && (
                        <p className="text-[10px] items-center gap-1 font-medium opacity-70 mb-1 flex">
                          {msg.user?.name} ({msg.user?.role})
                        </p>
                      )}
                      {isAdmin && (
                         <p className="text-[10px] items-center gap-1 opacity-80 mb-1 flex justify-end">
                            {language === 'ar' ? 'الإدارة' : 'Admin'}
                         </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <div className={`flex mt-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] opacity-60 flex items-center gap-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isAdmin && (
                            <Check2All className={msg.is_read ? 'text-blue-300' : 'text-white/50'} />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 md:p-4 bg-surface border-t border-border shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب ردك هنا...' : 'Type your reply...'}
                  className="flex-1 rounded-full h-12 bg-slate-50 dark:bg-slate-800 px-6 border-slate-200"
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
          </>
        )}
      </div>
    </div>
  );
}
