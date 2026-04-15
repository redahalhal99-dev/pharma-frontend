'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
  PlusLg, PencilSquare, Trash, X, Truck, Telephone, Envelope, Person, GeoAlt,
  FileEarmarkText, Search, ChevronRight,
} from 'react-bootstrap-icons';

type Supplier = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  address: string | null;
  notes: string | null;
};

type FormState = {
  name: string; phone: string; email: string;
  contact_person: string; address: string; notes: string;
};

const EMPTY_FORM: FormState = {
  name: '', phone: '', email: '', contact_person: '', address: '', notes: '',
};

export default function SuppliersPage() {
  const { language } = useAppStore();
  const t = translations[language];
  const isAr = language === 'ar';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/suppliers');
      setSuppliers(res.data);
    } catch {
      toast.error(isAr ? 'فشل تحميل الموردين' : 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', contact_person: s.contact_person || '', address: s.address || '', notes: s.notes || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(isAr ? 'الاسم مطلوب' : 'Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await axiosInstance.put(`/suppliers/${editing.id}`, form);
        toast.success(isAr ? 'تم تحديث المورد ✅' : 'Supplier updated ✅');
      } else {
        await axiosInstance.post('/suppliers', form);
        toast.success(isAr ? 'تم إضافة المورد ✅' : 'Supplier added ✅');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(isAr ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    try {
      await axiosInstance.delete(`/suppliers/${id}`);
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error(isAr ? 'فشل الحذف' : 'Delete failed');
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary-600" />
            {t.suppliers}
          </h1>
          <p className="text-sm text-textMuted mt-1">
            {isAr ? `${filtered.length} مورد مسجل` : `${filtered.length} supplier(s)`}
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0">
          <PlusLg className="h-4 w-4" />
          {t.newSupplier}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
        <Input
          placeholder={isAr ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
          className="ltr:pl-10 rtl:pr-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-textMuted">
          <Truck className="h-12 w-12 opacity-20 mb-3" />
          <p>{isAr ? 'لا يوجد موردون' : 'No suppliers found'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-surface border border-border rounded-2xl p-4 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-textMain leading-tight">{s.name}</h3>
                    {s.contact_person && (
                      <p className="text-xs text-textMuted">{s.contact_person}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-textMuted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <PencilSquare className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-textMuted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-textMuted">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Telephone className="h-3.5 w-3.5 shrink-0" />
                    <span dir="ltr">{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Envelope className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <GeoAlt className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
                {s.notes && (
                  <div className="flex items-start gap-2">
                    <FileEarmarkText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-xs">{s.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-border animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary-600" />
                {editing ? (isAr ? 'تعديل مورد' : 'Edit Supplier') : t.newSupplier}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="h-5 w-5 text-textMuted" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">{t.supplierName} *</label>
                <Input
                  placeholder={isAr ? 'اسم الشركة أو المورد' : 'Company or supplier name'}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1.5">{t.phone}</label>
                  <Input
                    placeholder="05xxxxxxxx"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1.5">{t.email}</label>
                  <Input
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">{t.contactPerson}</label>
                <Input
                  placeholder={isAr ? 'اسم المسؤول' : 'Contact person name'}
                  value={form.contact_person}
                  onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">{t.address}</label>
                <Input
                  placeholder={isAr ? 'العنوان' : 'Address'}
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">{t.notes}</label>
                <textarea
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-textMain placeholder:text-textMuted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  rows={3}
                  placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={saving}>
                {t.cancel}
              </Button>
              <Button className="flex-1" onClick={handleSave} isLoading={saving}>
                {t.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
