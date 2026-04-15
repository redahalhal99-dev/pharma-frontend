'use client';

import { useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { UpcScan, CameraFill, InfoCircle } from 'react-bootstrap-icons';
import { BarcodeCamera } from '@/components/ui/BarcodeCamera';
import toast from 'react-hot-toast';

export function ProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
  onSuccess: () => void;
}) {
  const { language } = useAppStore();
  const t = translations[language];

  const [formData, setFormData] = useState({
    name: product?.name || '',
    barcode: product?.barcode || '',
    price: product?.price || '',
    strip_price: product?.strip_price || '',
    strips_per_box: product?.strips_per_box || '',
    stock: product?.stock || '',
    expiration_date: product?.expiration_date ? product.expiration_date.split('T')[0] : '',
    drug_master_id: product?.drug_master_id || null,
  });

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [barcodeLookupLoading, setBarcodeLookupLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const lookupBarcode = async (barcode: string) => {
    if (!barcode?.trim()) return;
    setFormData((prev) => ({ ...prev, barcode }));
    setBarcodeLookupLoading(true);
    try {
      const res = await axiosInstance.get('/products-barcode', { params: { barcode } });
      const p = res.data;
      setFormData((prev) => ({
        ...prev,
        barcode,
        name: p.name || prev.name,
        price: p.price != null ? String(p.price) : prev.price,
        strip_price: p.strip_price != null ? String(p.strip_price) : prev.strip_price,
      }));
      if (p.is_new) {
        toast.success(language === 'ar' ? `اقتراح: ${p.name}` : `Suggestion: ${p.name}`);
      } else {
        toast.success(`✅ ${language === 'ar' ? 'تم العثور عليه:' : 'Found:'} ${p.name}`);
      }
    } catch {
      // If purely new barcode, maybe check drug master
      try {
        const gmRes = await axiosInstance.get('/drug-master/search', { params: { q: barcode } });
        const gmDrugs = gmRes.data;
        if (gmDrugs && gmDrugs.length > 0) {
           const gmDrug = gmDrugs[0];
           setFormData(prev => ({
             ...prev,
             name: gmDrug.name,
             price: gmDrug.price > 0 ? String(gmDrug.price) : prev.price,
             drug_master_id: gmDrug.id
           }));
           toast.success(language === 'ar' ? `تم العثور عليه في القائمة المرجعية: ${gmDrug.name}` : `Found in Drug Master: ${gmDrug.name}`);
           return;
        }
      } catch (err) {}
      
      toast.success(language === 'ar' ? 'دواء جديد — أكمل التفاصيل يدوياً' : 'New product — fill details manually', { icon: '📋' });
    } finally {
      setBarcodeLookupLoading(false);
    }
  };

  const searchDrugMaster = async (query: string) => {
    setFormData({ ...formData, name: query, drug_master_id: null });
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await axiosInstance.get('/drug-master/search', { params: { q: query } });
      setSuggestions(res.data);
      setShowSuggestions(true);
    } catch (e) {
      // Ignore errors silently for auto-suggest
    }
  };

  const selectDrug = (drug: any) => {
    setFormData((prev) => ({
      ...prev,
      drug_master_id: drug.id,
      name: drug.name,
      barcode: drug.barcode || prev.barcode,
      price: drug.price > 0 ? String(drug.price) : prev.price,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success(language === 'ar' ? `تم ربط الدواء: ${drug.name}` : `Linked: ${drug.name}`);
  };

  useBarcodeScanner(async (barcode) => {
    if (!isOpen) return;
    lookupBarcode(barcode);
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        strip_price: formData.strip_price !== '' ? formData.strip_price : null,
        strips_per_box: formData.strips_per_box !== '' ? parseInt(formData.strips_per_box, 10) : null,
        expiration_date: formData.expiration_date || null,
      };

      if (product) {
        await axiosInstance.put(`/products/${product.id}`, payload);
        toast.success(language === 'ar' ? 'تم التحديث ✅' : 'Product updated ✅');
      } else {
        await axiosInstance.post('/products', payload);
        toast.success(language === 'ar' ? 'تمت الإضافة ✅' : 'Product added ✅');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-lg border border-border max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-textMain">
            {product ? t.edit : t.add} {t.products}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Barcode with lookup + camera buttons */}
              <div className="col-span-2">
                <label className="text-sm font-medium text-textMain mb-1 block">{t.barcode}</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (formData.barcode) lookupBarcode(formData.barcode);
                      }
                    }}
                    placeholder={language === 'ar' ? 'امسح أو اكتب الباركود...' : 'Scan or type barcode...'}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => lookupBarcode(formData.barcode)} isLoading={barcodeLookupLoading} title="Lookup barcode">
                    <UpcScan className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCamera(true)} title="Open Camera">
                    <CameraFill className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-textMuted mt-1">
                  {language === 'ar' ? 'امسح الباركود — الاسم والسعر يمتلئان تلقائياً' : 'Scan barcode — name & price auto-fill'}
                </p>
              </div>

              <div className="col-span-2 relative">
                <label className="text-sm font-medium text-textMain mb-1 block">{t.name}</label>
                <Input 
                  required 
                  value={formData.name} 
                  onChange={(e) => searchDrugMaster(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={language === 'ar' ? 'ابحث عن اسم الدواء...' : 'Search drug name...'}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((drug) => (
                      <li 
                        key={drug.id} 
                        className="px-4 py-2 hover:bg-surfaceHover cursor-pointer text-sm text-textMain"
                        onClick={() => selectDrug(drug)}
                      >
                        <div className="font-semibold">{drug.name}</div>
                        {drug.scientific_name && <div className="text-xs text-textMuted">{drug.scientific_name}</div>}
                      </li>
                    ))}
                  </ul>
                )}
                {product?.drug_master?.alternatives && product.drug_master.alternatives.length > 0 && (
                  <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                    <label className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center">
                      <InfoCircle className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" /> {language === 'ar' ? 'البدائل المقترحة:' : 'Suggested Alternatives:'}
                    </label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {product.drug_master.alternatives.map((alt: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-textMain mb-1 block">{t.stock}</label>
                <Input type="number" required value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </div>

              {/* Price row: box price + strip price side by side */}
              <div>
                <label className="text-sm font-medium text-textMain mb-1 block">
                  {t.price} <span className="text-xs text-textMuted">({t.unitBox})</span>
                </label>
                <Input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-textMain mb-1 block">
                  {t.stripPrice} <span className="text-xs text-textMuted">({t.unitStrip})</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                  value={formData.strip_price}
                  onChange={(e) => setFormData({ ...formData, strip_price: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-textMain mb-1 block">علبة / شريط (عدد الشرايط في العلبة)</label>
                <Input
                  type="number"
                  placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                  value={formData.strips_per_box}
                  onChange={(e) => setFormData({ ...formData, strips_per_box: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-textMain mb-1 block">{t.expiryDate}</label>
                <Input type="date" value={formData.expiration_date} onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>{t.cancel}</Button>
              <Button type="submit" isLoading={isLoading}>{t.save}</Button>
            </div>
          </form>
        </div>
      </div>

      {/* Camera Scanner */}
      {showCamera && (
        <BarcodeCamera
          onScan={(barcode) => { setShowCamera(false); lookupBarcode(barcode); }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
