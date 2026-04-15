'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { useAuthStore } from '@/store/useAuth';
import { PlusLg, Trash, PeopleFill, ArrowRepeat, PencilSquare, Save, X } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

type UserType = {
  id: number;
  name: string;
  email: string;
  role: string;
  pharmacy_id?: number;
  pharmacy?: { id: number; name: string };
};

export default function UsersPage() {
  const { language } = useAppStore();
  const t = translations[language];
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'cashier', pharmacy_id: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [pharmacies, setPharmacies] = useState<any[]>([]);

  // Edit cashier state
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editForm, setEditForm] = useState({ email: '', password: '' });
  const [isEditSaving, setIsEditSaving] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/users');
      setUsers(res.data.data || res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
    if (currentUser?.role === 'admin') {
      axiosInstance.get('/pharmacies').then(res => setPharmacies(res.data.data || res.data));
    }
  }, [currentUser]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axiosInstance.post('/users', formData);
      toast.success(language === 'ar' ? 'تمت إضافة المستخدم ✅' : 'User added ✅');
      setFormData({ name: '', email: '', password: '', role: 'cashier', pharmacy_id: '' });
      setShowForm(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add cashier');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const msg = language === 'ar' ? 'هل تريد حذف هذا المستخدم؟' : 'Delete this user?';
    if (!confirm(msg)) return;
    try {
      await axiosInstance.delete(`/users/${id}`);
      toast.success(language === 'ar' ? 'تم الحذف ✅' : 'Deleted ✅');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove');
    }
  };

  const handleEditOpen = (u: UserType) => {
    setEditingUser(u);
    setEditForm({ email: u.email, password: '' });
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setIsEditSaving(true);
    try {
      const payload: any = {};
      if (editForm.email && editForm.email !== editingUser.email) payload.email = editForm.email;
      if (editForm.password) payload.password = editForm.password;
      await axiosInstance.put(`/users/${editingUser.id}/profile`, payload);
      toast.success(language === 'ar' ? 'تم التحديث ✅' : 'Updated ✅');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setIsEditSaving(false);
    }
  };

  const canDelete = (u: UserType) => {
    if (u.id === currentUser?.id) return false;
    if (currentUser?.role === 'admin') return u.role !== 'admin';
    if (currentUser?.role === 'doctor') return u.role === 'cashier';
    return false;
  };

  const canEdit = (u: UserType) => {
    if (currentUser?.role === 'admin') return u.role === 'cashier' || u.role === 'doctor';
    if (currentUser?.role === 'doctor') return u.role === 'cashier';
    return false;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin')   return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (role === 'doctor')  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin')   return language === 'ar' ? 'أدمن' : 'Admin';
    if (role === 'doctor')  return language === 'ar' ? 'دكتور' : 'Doctor';
    return language === 'ar' ? 'كاشير' : 'Cashier';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PeopleFill className="h-6 w-6 text-primary-600" />
          {t.users}
        </h1>
        {(currentUser?.role === 'doctor' || currentUser?.role === 'admin') && (
          <Button onClick={() => setShowForm(!showForm)}>
            <PlusLg className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {currentUser?.role === 'admin' ? (language === 'ar' ? 'إضافة مستخدم' : 'Add User') : t.addCashier}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold mb-4">{currentUser?.role === 'admin' ? (language === 'ar' ? 'إضافة دكتور أو كاشير' : 'Add Doctor or Cashier') : t.addCashier}</h3>
            <form onSubmit={handleAdd} className={`grid grid-cols-1 gap-4 ${currentUser?.role === 'admin' ? 'md:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-3'}`}>
              <Input required placeholder={t.name} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <Input required type="email" placeholder={t.email} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              <Input required type="password" placeholder={t.password} minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              
              {currentUser?.role === 'admin' && (
                <>
                  <select required className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="cashier">{language === 'ar' ? 'كاشير' : 'Cashier'}</option>
                    <option value="doctor">{language === 'ar' ? 'دكتور' : 'Doctor'}</option>
                  </select>
                  <select required className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={formData.pharmacy_id} onChange={e => setFormData({ ...formData, pharmacy_id: e.target.value })}>
                    <option value="">{language === 'ar' ? 'اختر الصيدلية...' : 'Select Pharmacy...'}</option>
                    {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </>
              )}
              
              <div className="flex items-center">
                <Button type="submit" isLoading={isSaving} className="w-full h-11">{t.save}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <Card className="border-primary-200 dark:border-primary-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm">
                {language === 'ar' ? `تعديل بيانات: ${editingUser.name}` : `Edit: ${editingUser.name}`}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-textMuted hover:text-textMain">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                placeholder={t.email}
              />
              <Input
                type="password"
                value={editForm.password}
                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                placeholder={language === 'ar' ? 'كلمة مرور جديدة (اختياري)' : 'New password (optional)'}
                minLength={6}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleEditSave} isLoading={isEditSaving}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {t.save}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>{t.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card><CardContent className="flex justify-center p-8"><ArrowRepeat className="h-8 w-8 animate-spin text-primary-500" /></CardContent></Card>
      ) : (
        <>
          {(() => {
            if (users.length === 0) {
               return <Card><CardContent className="text-center py-8 text-textMuted">{language === 'ar' ? 'لا يوجد مستخدمون.' : 'No users found.'}</CardContent></Card>;
            }

            const groupedUsers = users.reduce((acc: Record<string, UserType[]>, user: UserType) => {
              const pharmacyName = user.pharmacy?.name || (user.role === 'admin' ? (language === 'ar' ? 'إدارة النظام' : 'System Admin') : (language === 'ar' ? 'غير محدد' : 'Unassigned'));
              if (!acc[pharmacyName]) acc[pharmacyName] = [];
              acc[pharmacyName].push(user);
              return acc;
            }, {});

            return Object.entries(groupedUsers).map(([pharmacyName, groupUsers]: any) => (
              <div key={pharmacyName} className="mb-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-textMain">
                  <span className="bg-primary-500 w-1.5 h-5 rounded-full inline-block"></span>
                  {pharmacyName}
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-textMuted px-2 py-0.5 rounded-full">
                    {groupUsers.length} {language === 'ar' ? 'حساب' : 'Account'}
                  </span>
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="text-xs text-textMuted uppercase bg-slate-50 dark:bg-slate-800 border-b border-border">
                          <tr>
                            <th className="px-6 py-4">{t.name}</th>
                            <th className="px-6 py-4">{t.email}</th>
                            <th className="px-6 py-4">{language === 'ar' ? 'الدور' : 'Role'}</th>
                            <th className="px-6 py-4 text-right rtl:text-left">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupUsers.map((u: UserType) => (
                            <tr key={u.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4 font-medium">{u.name}</td>
                              <td className="px-6 py-4 text-textMuted">{u.email}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRoleBadge(u.role)}`}>
                                  {getRoleLabel(u.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right rtl:text-left">
                                <div className="flex gap-1 justify-end rtl:justify-start">
                                  {canEdit(u) && (
                                    <Button variant="ghost" size="icon" onClick={() => handleEditOpen(u)}>
                                      <PencilSquare className="h-4 w-4 text-primary-500" />
                                    </Button>
                                  )}
                                  {canDelete(u) && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ));
          })()}
        </>
      )}
    </div>
  );
}
