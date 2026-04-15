'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { X, Search, UpcScan } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { BarcodeCamera } from '@/components/ui/BarcodeCamera';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Product = {
  id: number;
  name: string;
  barcode: string;
  price: number;
};

export function AddReturnModal({ isOpen, onClose, onSuccess }: Props) {
  const { language } = useAppStore();
  const t = translations[language];

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [quantity, setQuantity] = useState('1');
  const [amountRefunded, setAmountRefunded] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      setSelectedProduct(product);
      toast.success(`Selected: ${product.name}`);
    } else {
      toast.error('Product not found: ' + barcode);
    }
  };

  useBarcodeScanner(handleBarcodeScan);

  useEffect(() => {
    if (isOpen) {
      axiosInstance.get('/products').then((res) => {
        setProducts(res.data.data || res.data);
      }).catch(() => toast.error('Failed to load products list'));
    }
  }, [isOpen]);

  // When a product is selected, auto-fill the refund amount with its price * quantity
  useEffect(() => {
    if (selectedProduct) {
      const q = parseInt(quantity) || 1;
      setAmountRefunded((selectedProduct.price * q).toFixed(2));
    }
  }, [selectedProduct, quantity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error('Please select a product');

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/returns', {
        product_id: selectedProduct.id,
        quantity: parseInt(quantity),
        amount_refunded: parseFloat(amountRefunded),
        reason
      });
      toast.success('Return processed successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode && p.barcode.includes(search))
  ).slice(0, 5); // show top 5 results

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-textMain">Process Return</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedProduct ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-textMain">Search Product</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted rtl:right-3 rtl:left-auto" />
                  <Input
                    autoFocus
                    placeholder="Barcode or Name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (search) {
                          handleBarcodeScan(search);
                          setSearch('');
                        }
                      }
                    }}
                    className="pl-9 rtl:pr-9 rtl:pl-3"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="shrink-0 px-3 bg-primary-600 hover:bg-primary-700 text-white"
                  title="Scan Barcode"
                >
                  <UpcScan className="h-5 w-5" />
                </Button>
              </div>

              {search.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className="p-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md flex justify-between items-center"
                    >
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-xs text-textMuted">{p.barcode}</span>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-xs text-center p-2 text-textMuted">No products found</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg flex justify-between items-center mb-4">
              <div>
                <p className="font-bold text-primary-700 dark:text-primary-400">{selectedProduct.name}</p>
                <p className="text-xs text-primary-600/70">{selectedProduct.barcode}</p>
              </div>
              <Button variant="ghost" size="sm" type="button" onClick={() => setSelectedProduct(null)}>
                Change
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-textMain">{t.quantity}</label>
              <Input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={!selectedProduct}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-textMain">Refund Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={amountRefunded}
                onChange={(e) => setAmountRefunded(e.target.value)}
                disabled={!selectedProduct}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-textMain">Reason (Optional)</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Expired, Defective..."
              disabled={!selectedProduct}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedProduct} className="flex-1 shrink-0 bg-red-600 hover:bg-red-700 text-white border-0">
              {isSubmitting ? 'Processing...' : 'Process Return'}
            </Button>
          </div>
        </form>
      </div>

      {showCamera && (
        <BarcodeCamera
          onScan={handleBarcodeScan}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
