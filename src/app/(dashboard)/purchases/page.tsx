'use client';

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
  BagFill, PlusLg, X, Trash, ChevronDown, ChevronUp,
  Truck, BoxSeam, Calendar, CurrencyDollar, Search, Eye, ExclamationTriangle
} from 'react-bootstrap-icons';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

type Supplier = { id: number; name: string };
type Product  = { id: number; name: string; barcode: string; cost_price?: number };

type PurchaseItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  cost_price: number;
};

type PurchaseOrder = {
  id: number;
  order_date: string;
  total_amount: number;
  status: string;
  notes: string | null;
  supplier: Supplier;
  items: Array<{ id: number; quantity: number; cost_price: number; subtotal: number; product: Product }>;
};

const EMPTY_ITEM: PurchaseItem = { product_id: 0, product_name: '', quantity: 1, cost_price: 0 };

export default function PurchasesPage() {
  const { language } = useAppStore();
  const t = translations[language];
  const isAr = language === 'ar';

  const [orders, setOrders]         = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [expanded, setExpanded]     = useState<number | null>(null);
  const [search, setSearch]         = useState('');
  const [saving, setSaving]         = useState(false);

  // Modal form state
  const [selectedSupplier, setSelectedSupplier] = useState<number>(0);
  const [orderDate, setOrderDate]   = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes]           = useState('');
  const [items, setItems]           = useState<PurchaseItem[]>([{ ...EMPTY_ITEM }]);
  const [productSearch, setProductSearch] = useState<string[]>(['']);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        axiosInstance.get('/purchases'),
        axiosInstance.get('/suppliers'),
        axiosInstance.get('/products'),
      ]);
      setOrders(ordersRes.data);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data.data || productsRes.data);
    } catch {
      toast.error(isAr ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openModal = () => {
    setSelectedSupplier(suppliers[0]?.id || 0);
    setOrderDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([{ ...EMPTY_ITEM }]);
    setProductSearch(['']);
    setShowModal(true);
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...EMPTY_ITEM }]);
    setProductSearch(prev => [...prev, '']);
  };

  const removeItem = (i: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== i));
    setProductSearch(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, field: keyof PurchaseItem, value: any) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const selectProduct = (i: number, product: Product) => {
    setItems(prev => prev.map((item, idx) =>
      idx === i ? { ...item, product_id: product.id, product_name: product.name, cost_price: product.cost_price || 0 } : item
    ));
    setProductSearch(prev => prev.map((s, idx) => idx === i ? product.name : s));
  };

  const getFilteredProducts = (q: string) => {
    if (!q.trim()) return products.slice(0, 8);
    return products.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.barcode || '').includes(q)
    ).slice(0, 8);
  };

  const totalAmount = items.reduce((sum, it) => sum + (it.quantity * it.cost_price), 0);

  const handleSave = async () => {
    if (!selectedSupplier) { toast.error(isAr ? 'اختر مورداً' : 'Select a supplier'); return; }
    
    const validItems = items.filter(it => it.product_id && it.quantity > 0 && it.cost_price > 0);
    if (validItems.length === 0) {
      toast.error(isAr ? 'يرجى ملء بند شراء واحد على الأقل' : 'Please fill at least one purchase item');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post('/purchases', {
        supplier_id: selectedSupplier,
        order_date: orderDate,
        notes,
        items: validItems.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          cost_price: it.cost_price,
        })),
      });
      toast.success(isAr ? 'تم إنشاء أمر الشراء وتحديث المخزون ✅' : 'Purchase order created & stock updated ✅');
      setShowModal(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف أمر الشراء هذا؟ سيتم خصم الكميات من المخزون وقد يصبح بالسالب.' : 'Are you sure you want to delete this purchase order? Stock quantities will be reverted.')) return;
    try {
      await axiosInstance.delete(`/purchases/${id}`);
      toast.success(isAr ? 'تم حذف أمر الشراء بنجاح' : 'Purchase order deleted successfully');
      fetchAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error deleting purchase order');
    }
  };

  const handleBarcodeScan = useCallback((barcode: string) => {
    if (!showModal) return;
    
    const product = products.find(p => p.barcode === barcode);
    if (!product) {
      toast.error(isAr ? `المنتج غير موجود: ${barcode}` : `Product not found: ${barcode}`);
      return;
    }

    setItems(prev => {
      const existingIdx = prev.findIndex(it => it.product_id === product.id);
      if (existingIdx !== -1) {
        const newItems = [...prev];
        newItems[existingIdx].quantity += 1;
        toast.success(isAr ? `تم زيادة كمية ${product.name}` : `Increased quantity for ${product.name}`);
        return newItems;
      }

      const emptyIdx = prev.findIndex(it => it.product_id === 0);
      const newItemData = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        cost_price: product.cost_price || 0
      };

      if (emptyIdx !== -1) {
        const newItems = [...prev];
        newItems[emptyIdx] = newItemData;
        setProductSearch(sPrev => {
          const newS = [...sPrev];
          newS[emptyIdx] = product.name;
          return [...newS, ''];
        });
        toast.success(isAr ? `تم إضافة ${product.name}` : `Added ${product.name}`);
        return [...newItems, { ...EMPTY_ITEM }];
      } else {
        setProductSearch(sPrev => [...sPrev, product.name, '']);
        toast.success(isAr ? `تم إضافة ${product.name}` : `Added ${product.name}`);
        return [...prev, newItemData, { ...EMPTY_ITEM }];
      }
    });

  }, [showModal, products, isAr]);

  useBarcodeScanner(handleBarcodeScan);

  const filtered = orders.filter(o =>
    o.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_date?.includes(search)
  );

  const statusColor = (s: string) =>
    s === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">
            <BagFill className="h-6 w-6 text-primary-600" />
            {t.purchaseOrders}
          </h1>
          <p className="text-sm text-textMuted mt-1">
            {isAr ? `${filtered.length} أمر شراء` : `${filtered.length} purchase order(s)`}
          </p>
        </div>
        <Button onClick={openModal} className="gap-2 shrink-0">
          <PlusLg className="h-4 w-4" />
          {t.newPurchase}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
        <Input
          placeholder={isAr ? 'بحث بالمورد أو التاريخ...' : 'Search by supplier or date...'}
          className="ltr:pl-10 rtl:pr-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-textMuted">
          <BagFill className="h-12 w-12 opacity-20 mb-3" />
          <p>{isAr ? 'لا توجد أوامر شراء' : 'No purchase orders yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all">
              {/* Order Summary Row */}
              <div
                className="flex flex-wrap items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded(prev => prev === order.id ? null : order.id)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 shrink-0">
                  <BagFill className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-textMain">{order.supplier?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(order.status)}`}>
                      {order.status === 'completed' ? t.completed : t.pending}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-textMuted">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{order.order_date}</span>
                    <span className="flex items-center gap-1"><BoxSeam className="h-3 w-3" />{order.items?.length || 0} {isAr ? 'بند' : 'items'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-textMuted">{t.totalAmount}</p>
                    <p className="font-bold text-primary-600">{Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors ml-2 rtl:ml-0 rtl:mr-2"
                    title={isAr ? 'حذف أمر الشراء' : 'Delete Order'}
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                  <div className="mx-1 h-6 w-px bg-border"></div>
                  {expanded === order.id
                    ? <ChevronUp className="h-5 w-5 text-textMuted" />
                    : <ChevronDown className="h-5 w-5 text-textMuted" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === order.id && (
                <div className="border-t border-border p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  {order.notes && (
                    <p className="text-sm text-textMuted italic mb-3">📝 {order.notes}</p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-textMuted text-xs border-b border-border">
                          <th className="text-start pb-2 font-medium">{t.name}</th>
                          <th className="text-center pb-2 font-medium">{t.quantity}</th>
                          <th className="text-center pb-2 font-medium">{t.costPrice}</th>
                          <th className="text-end pb-2 font-medium">{t.totalAmount}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {order.items?.map(item => (
                          <tr key={item.id} className="hover:bg-white/50 dark:hover:bg-white/5">
                            <td className="py-2 font-medium text-textMain">{item.product?.name}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-center font-mono">{Number(item.cost_price).toFixed(2)}</td>
                            <td className="py-2 text-end font-bold text-primary-600 font-mono">{Number(item.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border font-bold">
                          <td colSpan={3} className="pt-2 text-end text-textMuted">{t.total}</td>
                          <td className="pt-2 text-end text-primary-600 font-mono">{Number(order.total_amount).toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Purchase Order */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl border border-border animate-fade-in my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BagFill className="h-5 w-5 text-primary-600" />
                {t.newPurchase}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="h-5 w-5 text-textMuted" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Supplier + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1.5">{t.supplier} *</label>
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    value={selectedSupplier}
                    onChange={e => setSelectedSupplier(Number(e.target.value))}
                  >
                    <option value={0} disabled>{t.selectSupplier}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1.5">{t.orderDate} *</label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={e => setOrderDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">{t.notes}</label>
                <Input
                  placeholder={isAr ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-textMain">{t.items}</label>
                  <button onClick={addItem} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                    <PlusLg className="h-4 w-4" />
                    {t.addItem}
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="border border-border rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                      {/* Product search */}
                      <div className="relative">
                        <label className="block text-xs text-textMuted mb-1">{t.name} *</label>
                        <Input
                          placeholder={isAr ? 'ابحث عن منتج...' : 'Search product...'}
                          value={productSearch[i]}
                          onChange={e => {
                            const v = e.target.value;
                            setProductSearch(prev => prev.map((s, idx) => idx === i ? v : s));
                            updateItem(i, 'product_name', v);
                            updateItem(i, 'product_id', 0);
                          }}
                        />
                        {productSearch[i] && item.product_id === 0 && (
                          <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                            {getFilteredProducts(productSearch[i]).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => selectProduct(i, p)}
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-start text-sm transition-colors"
                              >
                                <BoxSeam className="h-4 w-4 text-primary-500 shrink-0" />
                                <div>
                                  <p className="font-medium text-textMain">{p.name}</p>
                                  <p className="text-xs text-textMuted">{p.barcode || 'لا يوجد باركود'}</p>
                                </div>
                              </button>
                            ))}
                            {getFilteredProducts(productSearch[i]).length === 0 && (
                              <p className="px-3 py-2 text-sm text-textMuted">{isAr ? 'لا نتائج - امسح الباركود أو تأكد من إدخال اسم صحيح' : 'No results'}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-textMuted mb-1">{t.quantity} *</label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-textMuted mb-1">{t.costPrice} *</label>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.cost_price}
                            onChange={e => updateItem(i, 'cost_price', Number(e.target.value))}
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="block text-xs text-textMuted mb-1">{t.total}</label>
                          <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl px-3 text-sm font-bold text-primary-600 font-mono">
                            {(item.quantity * item.cost_price).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(i)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors mt-1"
                        >
                          <Trash className="h-3.5 w-3.5" />
                          {isAr ? 'إزالة' : 'Remove'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
                <span className="font-semibold text-textMain flex items-center gap-2">
                  <CurrencyDollar className="h-5 w-5 text-primary-600" />
                  {t.totalAmount}
                </span>
                <span className="text-2xl font-bold text-primary-600 font-mono">{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={saving}>
                {t.cancel}
              </Button>
              <Button className="flex-1" onClick={handleSave} isLoading={saving}>
                {isAr ? '✅ تأكيد وإضافة للمخزون' : '✅ Confirm & Add to Stock'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
