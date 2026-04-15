'use client';

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { PlusLg, Search, PencilSquare, Trash, ArrowRepeat, UpcScan } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { ProductModal } from './components/ProductModal';
import { TableVirtuoso } from 'react-virtuoso';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { BarcodeCamera } from '@/components/ui/BarcodeCamera';

type Product = {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  expiration_date: string | null;
  production_date: string | null;
  batch_no: string | null;
  supplier: string | null;
  is_expired: boolean;
  is_near_expiry: boolean;
};

type FilterType = 'all' | 'expired' | 'near_expiry' | 'in_stock';

export default function ProductsPage() {
  const { language } = useAppStore();
  const t = translations[language];
  const isAr = language === 'ar';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Pagination states removed - now single load optimized
  const [totalItems, setTotalItems] = useState(0);

  // 0. Hardware Barcode Scanner Support
  useBarcodeScanner((barcode) => {
    setSearch(barcode);
    toast.success(isAr ? `تم مسح: ${barcode}` : `Scanned: ${barcode}`);
  });

  const fetchProducts = async (query = '', status = 'all') => {
    setIsLoading(true);

    try {
      // Use per_page: -1 for high-speed single-load fetching
      const response = await axiosInstance.get('/products', {
        params: {
          q: query,
          filter: status,
          per_page: -1
        }
      });
      const data = response.data;
      
      setProducts(data.data);
      setTotalItems(data.total);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // 2. Fetch Initial or on Filter change
  useEffect(() => {
    fetchProducts(debouncedSearch, filter);
  }, [debouncedSearch, filter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axiosInstance.delete(`/products/${id}`);
      toast.success('Deleted successfully');
      fetchProducts(debouncedSearch, filter);
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const getStatusBadge = (product: Product) => {
    if (product.is_expired) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">{t.expired}</span>;
    }
    if (product.is_near_expiry) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">{t.nearExpiry}</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">{t.available}</span>;
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-textMain">{t.products}</h1>
          <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-3 py-1 rounded-full text-xs font-bold border border-primary-200">
            {totalItems} {isAr ? 'صنف' : 'Products'}
          </div>
        </div>
        <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="w-full sm:w-auto">
          <PlusLg className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t.add} {t.products}
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-2 flex-shrink-0">
          <div className="relative w-full max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted rtl:right-3 rtl:left-auto" />
              <Input
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rtl:pr-9 rtl:pl-3 w-full"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-10 w-10 border-primary-200 dark:border-primary-800 text-primary-600 hover:bg-primary-50"
              onClick={() => setShowCamera(true)}
              title={isAr ? 'مسح بالباركود' : 'Scan Barcode'}
            >
              <UpcScan className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'all', label: t.allProducts },
              { key: 'expired', label: t.filterExpired },
              { key: 'near_expiry', label: t.filterNearExpiry },
              { key: 'in_stock', label: t.filterInStock },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-textMuted hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-full w-full">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <ArrowRepeat className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <TableVirtuoso
                data={products}
                totalCount={products.length}
                useWindowScroll={false}
                style={{ height: '100%', width: '100%' }}
                fixedHeaderContent={() => (
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-border shadow-sm">
                    <th className="px-4 py-3 text-xs text-textMuted text-left rtl:text-right uppercase w-[15%]">{t.barcode}</th>
                    <th className="px-4 py-3 text-xs text-textMuted text-left rtl:text-right uppercase w-[30%]">{t.name}</th>
                    <th className="px-4 py-3 text-xs text-textMuted text-left rtl:text-right uppercase w-[10%]">{t.price}</th>
                    <th className="px-4 py-3 text-xs text-textMuted text-left rtl:text-right uppercase w-[10%]">{t.stock}</th>
                    <th className="px-4 py-3 text-xs text-textMuted text-left rtl:text-right uppercase w-[15%]">{t.expiryDate}</th>
                    <th className="px-4 py-3 text-xs text-textMuted text-left rtl:text-right uppercase w-[10%]">Status</th>
                    <th className="px-4 py-3 text-xs text-textMuted text-right uppercase w-[10%]">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                )}
                itemContent={(_index, product) => (
                  <>
                    <td className="px-4 py-3 font-mono text-xs border-b border-border">{product.barcode || '-'}</td>
                    <td className="px-4 py-3 font-medium border-b border-border">
                      <div className="truncate max-w-[200px]" title={product.name}>{product.name}</div>
                    </td>
                    <td className="px-4 py-3 border-b border-border">${Number(product.price).toFixed(2)}</td>
                    <td className="px-4 py-3 border-b border-border">
                      <span className={product.stock < 10 ? 'text-red-500 font-bold' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs border-b border-border">
                      {product.expiration_date
                        ? new Date(product.expiration_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 border-b border-border">{getStatusBadge(product)}</td>
                    <td className="px-4 py-3 border-b border-border text-right space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}>
                        <PencilSquare className="h-4 w-4 text-primary-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id)}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </>
                )}
                components={{
                  Table: (props) => <table {...props} className="w-full text-sm border-collapse" />,
                  TableBody: React.forwardRef((props, ref) => <tbody {...props} ref={ref} />),
                  TableRow: (props) => (
                    <tr {...props} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" />
                  ),
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={editingProduct}
          onSuccess={() => fetchProducts(debouncedSearch, filter)}
        />
      )}

      {showCamera && (
        <BarcodeCamera
          onScan={(barcode) => {
            setSearch(barcode);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

