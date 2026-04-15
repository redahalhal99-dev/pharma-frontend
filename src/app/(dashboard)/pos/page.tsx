'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/locales/translations';
import { Input } from '@/components/ui/Input';
import {
  Search, Cart4, DashLg, PlusLg, Trash, ExclamationTriangle,
  UpcScan, FileEarmarkArrowDown, Keyboard, CreditCardFill, CashStack, X, PeopleFill,
  ChevronDown, ChevronUp, PersonPlusFill,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { playSound } from '@/lib/sounds';
import { BarcodeCamera } from '@/components/ui/BarcodeCamera';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';

type Product = {
  id: number;
  name: string;
  barcode: string;
  price: number;
  strip_price: number | null;
  stock: number;
  is_expired: boolean;
  is_near_expiry: boolean;
  expiration_date: string | null;
};

type UnitType = 'box' | 'strip';

type CartItem = Product & {
  cartQuantity: number;
  unit_type: UnitType;
};

// ==========================================
// 🚀 MEMOIZED COMPONENTS
// ==========================================

const ProductCard = React.memo(({
  product, t, onAdd, isActive
}: {
  product: Product; t: any; onAdd: (product: Product) => void; isActive?: boolean;
}) => {
  const isExpired = product.is_expired;
  const isNear = product.is_near_expiry;
  const isLowStock = product.stock < 10;

  return (
    <div
      onClick={() => onAdd(product)}
      className={`bg-surface border rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between group ${
        isExpired
          ? 'border-red-300 opacity-60 cursor-not-allowed'
          : isActive 
          ? 'ring-2 ring-primary-500 border-primary-500 shadow-lg scale-[1.02] bg-primary-50 dark:bg-primary-900/20'
          : isNear
          ? 'border-yellow-300 hover:border-yellow-500'
          : 'border-border hover:border-primary-500 hover:shadow-md'
      }`}
    >
      <div>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-textMain text-sm line-clamp-2">{product.name}</h3>
          {isExpired && <ExclamationTriangle className="h-4 w-4 text-red-500 shrink-0 ml-1" />}
        </div>
        <p className="text-xs text-textMuted mt-1 font-mono">{product.barcode || '—'}</p>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary-600 text-sm">
            {Number(product.price).toFixed(2)} <span className="text-[10px] font-normal text-textMuted">{t.unitBox}</span>
          </span>
          <span className={`text-xs font-semibold ${isLowStock ? 'text-red-500' : 'text-textMuted'}`}>
            {t.stock}: {product.stock}
          </span>
        </div>
        {product.strip_price != null && (
          <div className="text-xs text-textMuted flex items-center justify-between">
            <span>{t.unitStrip}: </span>
            <span className="font-bold text-primary-500">{Number(product.strip_price).toFixed(2)}</span>
          </div>
        )}
      </div>
      {isExpired && <span className="text-[10px] text-red-500 font-bold mt-1 uppercase">{t.expired}</span>}
      {isNear && <span className="text-[10px] text-yellow-600 font-bold mt-1 uppercase">{t.nearExpiry}</span>}
    </div>
  );
});
ProductCard.displayName = 'ProductCard';

const CartRow = React.memo(({
  item, isActive, index, t, language, onUpdateQty, onSetQty, onUpdateUnit, onRemove,
}: {
  item: CartItem; isActive: boolean; index: number; t: any; language: string;
  onUpdateQty: (id: number, delta: number) => void;
  onSetQty: (id: number, qty: number) => void;
  onUpdateUnit: (id: number, unit: UnitType) => void;
  onRemove: (id: number) => void;
}) => {
  const price = item.unit_type === 'strip' && item.strip_price != null ? Number(item.strip_price) : Number(item.price);

  return (
    <div
      className={`flex flex-col gap-2 border rounded-xl p-3 transition-colors duration-200 ${
        isActive
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-[0_0_0_2px_rgba(var(--color-primary-500),0.2)]'
          : 'border-border bg-slate-50/50 dark:bg-slate-800/50 hover:border-primary-300'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          {isActive && <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse shrink-0" />}
          <span className="font-bold text-sm text-textMain leading-tight">{item.name}</span>
        </div>
        <button
          tabIndex={-1}
          onClick={() => onRemove(item.id)}
          className="text-red-400 hover:text-red-600 shrink-0 mt-0.5 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {([{ value: 'box' as UnitType, label: t.unitBox }, { value: 'strip' as UnitType, label: t.unitStrip }]).map((opt) => {
            if (opt.value === 'strip' && item.strip_price == null) return null;
            return (
              <button
                key={opt.value}
                tabIndex={-1}
                onClick={() => onUpdateUnit(item.id, opt.value)}
                className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                  item.unit_type === opt.value
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                    : 'bg-white dark:bg-slate-700 text-textMuted border-border hover:border-primary-400'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-border rounded-lg p-0.5 shrink-0 shadow-sm">
          <button tabIndex={-1} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md text-textMuted" onClick={() => onUpdateQty(item.id, -1)}>
            <DashLg className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            value={item.cartQuantity || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) onSetQty(item.id, val);
            }}
            className="w-10 text-center text-sm font-bold text-textMain bg-transparent border-none outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
            min="1"
          />
          <button tabIndex={-1} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md text-textMuted" onClick={() => onUpdateQty(item.id, 1)}>
            <PlusLg className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs border-t border-border/50 pt-2 mt-1">
        <div className="text-textMuted font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
          {price.toFixed(2)} / {item.unit_type === 'strip' ? t.unitStrip : t.unitBox}
        </div>
        <div className="font-bold text-primary-600 text-sm font-mono bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-md">
          {(price * item.cartQuantity).toFixed(2)}
        </div>
      </div>
    </div>
  );
});
CartRow.displayName = 'CartRow';


// ==========================================
// 🛒 MAIN POS PAGE
// ==========================================

export default function POSPage() {
  const { 
    language, currentShift,
    barcodeInputSource, enableSounds, autoPrintReceipt
  } = useAppStore();
  const { isOffline, addPendingSale, cachedProducts, setCachedProducts } = useOfflineStore();
  const t = translations[language];
  const isAr = language === 'ar';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCartIndex, setActiveCartIndex] = useState(-1);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const [visibleCount, setVisibleCount] = useState(24);

  // Cart panel visibility (for mobile toggle)
  const [isCartVisible, setIsCartVisible] = useState(true);

  // Checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'cash' | 'credit' | 'debt'>('cash');
  const [debtorId, setDebtorId] = useState<string>('');
  const [debtors, setDebtors] = useState<any[]>([]);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [lastSaleIds, setLastSaleIds] = useState<number[]>([]);

  // Customer name for all payment methods
  const [customerName, setCustomerName] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const receivedInputRef = useRef<HTMLInputElement>(null);
  const cartContainerRef = useRef<HTMLDivElement>(null);
  const productsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (isOffline) {
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
          toast.success(isAr ? 'تم جلب المنتجات من الذاكرة (غير متصل)' : 'Loaded offline products');
        } else {
          toast.error(isAr ? 'لا توجد بيانات منتجات في الذاكرة المحلية' : 'No offline product data');
        }
        setIsLoadingProducts(false);
        return;
      }
      try {
        const response = await axiosInstance.get('/products', {
          params: { per_page: -1 }
        });
        const data = response.data.data || response.data;
        setProducts(data);
        setCachedProducts(data.slice(0, 5000)); // Increase cache limit for better offline support
      } catch (error) {
        if (cachedProducts.length > 0) setProducts(cachedProducts);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    const fetchDebtors = async () => {
      try {
        const res = await axiosInstance.get('/debtors');
        setDebtors(res.data);
      } catch (e) {}
    };
    fetchProducts();
    fetchDebtors();
  }, [isOffline]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setVisibleCount(24);
      setActiveProductIndex(-1);
    }, 150);
    return () => clearTimeout(handler);
  }, [search]);

  const addToCart = useCallback((product: Product) => {
    if (product.is_expired) {
      toast.error(isAr ? `🚫 منتج منتهي الصلاحية: ${product.name}` : `🚫 Expired: ${product.name}`);
      return;
    }
    if (product.stock <= 0) {
      toast.error(isAr ? '❌ نفد المخزون' : '❌ Out of stock');
      return;
    }
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === product.id);
      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        if (existing.cartQuantity >= product.stock) {
          toast.error(isAr ? 'الكمية المطلوبة تتجاوز المخزون' : 'Quantity exceeds stock');
          return prev;
        }
        const newCart = [...prev];
        newCart[existingIdx] = { ...existing, cartQuantity: existing.cartQuantity + 1 };
        setActiveCartIndex(existingIdx);
        return newCart;
      }
      const newCart = [{ ...product, cartQuantity: 1, unit_type: 'box' as UnitType }, ...prev];
      setActiveCartIndex(0);
      return newCart;
    });
    setSearch('');
  }, [isAr]);

  const updateCartQuantity = useCallback((id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQ = item.cartQuantity + delta;
          if (newQ > item.stock) { toast.error(isAr ? 'تتجاوز المخزون' : 'Exceeds stock'); return item; }
          if (newQ < 1) return item;
          return { ...item, cartQuantity: newQ };
        }
        return item;
      })
    );
  }, [isAr]);

  const setCartQuantity = useCallback((id: number, qty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (qty > item.stock) { toast.error(isAr ? 'تتجاوز المخزون' : 'Exceeds stock'); return { ...item, cartQuantity: item.stock }; }
          if (qty < 1) return { ...item, cartQuantity: 1 };
          return { ...item, cartQuantity: qty };
        }
        return item;
      })
    );
  }, [isAr]);

  const updateUnitType = useCallback((id: number, unit_type: UnitType) => {
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, unit_type } : item));
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== id);
      setActiveCartIndex(Math.min(activeCartIndex, newCart.length - 1));
      return newCart;
    });
  }, [activeCartIndex]);

  const filteredProducts = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    if (!s) return products;
    return products.filter((p) => p.name.toLowerCase().includes(s) || p.barcode?.includes(s));
  }, [products, debouncedSearch]);

  const handleSearchEnter = async () => {
    if (!search.trim()) return;
    const exactMatch = products.find((p) => p.barcode === search.trim());
    if (exactMatch) { addToCart(exactMatch); return; }
    const exactNameMatch = products.find((p) => p.name.toLowerCase() === search.trim().toLowerCase());
    if (exactNameMatch) { addToCart(exactNameMatch); return; }

    // If no local match, check backend for barcode
    if (/^\d+$/.test(search.trim())) {
      await searchBarcodeOnBackend(search.trim());
    }
  };

  const searchBarcodeOnBackend = async (barcode: string) => {
    const loadingToast = toast.loading(isAr ? 'جاري البحث عن الباركود...' : 'Searching barcode...');
    try {
      const response = await axiosInstance.get(`/products-barcode?barcode=${barcode}`);
      const data = response.data;

      if (data.id) {
        // Product exists in library
        const p = data as Product;
        setProducts(prev => [p, ...prev]);
        addToCart(p);
        toast.dismiss(loadingToast);
        setSearch('');
      } else if (data.is_new) {
        // Product in global catalog but not in library
        toast.loading(isAr ? 'إضافة الصنف للمخزن...' : 'Adding to inventory...', { id: loadingToast });
        const createRes = await axiosInstance.post('/products', {
          name: data.name,
          barcode: data.barcode,
          price: data.price || 0,
          stock: 1, // Default stock 1 as requested
          supplier: data.supplier,
        });
        const newProduct = createRes.data;
        setProducts(prev => [newProduct, ...prev]);
        addToCart(newProduct);
        toast.success(isAr ? 'تمت الإضافة للمخزن و السلة' : 'Added to inventory and cart', { id: loadingToast });
        setSearch('');
      }
    } catch (e: any) {
      toast.error(isAr ? 'المنتج غير موجود' : 'Product not found', { id: loadingToast });
    }
  };

  const handleBarcodeScanMode = useCallback(async (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      addToCart(product);
      toast.success(isAr ? `تم إضافة: ${product.name}` : `Added: ${product.name}`);
    } else {
      await searchBarcodeOnBackend(barcode);
    }
  }, [products, addToCart, isAr]);

  useBarcodeScanner(handleBarcodeScanMode, barcodeInputSource === 'usb');

  const getItemPrice = (item: CartItem): number => {
    if (item.unit_type === 'strip') return item.strip_price != null ? Number(item.strip_price) : Number(item.price);
    return Number(item.price);
  };

  const calculateTotal = useCallback(() => cart.reduce((total, item) => total + getItemPrice(item) * item.cartQuantity, 0), [cart]);
  const cartTotal = calculateTotal();

  const handleCheckoutInit = () => {
    if (cart.length === 0) { toast.error(isAr ? 'السلة فارغة' : 'Cart is empty'); return; }
    setReceivedAmount('');
    setCustomerName('');
    setShowCheckoutModal(true);
    setTimeout(() => receivedInputRef.current?.focus(), 100);
  };

  const handleCheckoutConfirm = async () => {
    if (cart.length === 0) return;

    if (checkoutMethod === 'debt' && !debtorId) {
      toast.error(isAr ? 'الرجاء اختيار العميل (شكك) أو إضافته أولاً' : 'Please select a customer for debt payment');
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const payload = {
        payment_method: checkoutMethod,
        received_amount: Number(receivedAmount) || cartTotal,
        shift: currentShift,
        debtor_id: checkoutMethod === 'debt' ? debtorId : null,
        customer_name: customerName.trim() || null,
        discount: Number(discountAmount) || 0,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.cartQuantity,
          price: getItemPrice(item),
          unit_type: item.unit_type,
        })),
      };

      if (isOffline) {
        addPendingSale(payload);
        toast.success(isAr ? 'تم الحفظ محلياً 📦' : 'Saved offline 📦');
        resetPos();
        return;
      }

      const response = await axiosInstance.post('/sales', payload);
      setLastSaleIds((response.data.sales || []).map((s: any) => s.id));
      if (response.data.warnings?.length) {
        response.data.warnings.forEach((w: string) => toast(w, { icon: '⚠️', duration: 5000 }));
      }
      toast.success(isAr ? 'تم البيع بنجاح ✅' : 'Sale completed ✅');
      if (enableSounds) playSound('success');
      if (autoPrintReceipt) {
        toast.success(isAr ? 'جاري طباعة الفاتورة...' : 'Printing receipt...', { icon: '🖨️' });
        // Real printing logic would call window.print() or a specialized API here
      }
      resetPos();
      axiosInstance.get('/products').then(res => setProducts(res.data.data || res.data));
    } catch (e: any) {
      if (e.response?.status === 422 && e.response?.data?.errors) {
        const errors = e.response.data.errors;
        const firstErrorKey = Object.keys(errors)[0];
        toast.error(errors[firstErrorKey][0]);
      } else {
        toast.error(e.response?.data?.message || 'Checkout failed');
      }
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const resetPos = () => {
    setCart([]);
    setShowCheckoutModal(false);
    setSearch('');
    setActiveCartIndex(-1);
    setActiveProductIndex(-1);
    setIsCheckoutLoading(false);
    setCustomerName('');
    setDiscountAmount('');
    setTimeout(() => searchInputRef.current?.focus(), 150);
  };

  useKeyboardShortcuts([
    { key: 'F2', action: () => { searchInputRef.current?.focus(); setActiveCartIndex(-1); setActiveProductIndex(-1); } },
    { key: 'F3', action: () => {
        if (cart.length > 0) {
          setActiveProductIndex(-1);
          setActiveCartIndex(0);
          searchInputRef.current?.blur();
        } else {
          toast.error(isAr ? 'السلة فارغة' : 'Cart is empty');
        }
    }},
    { key: 'F4', action: () => setIsCartVisible(v => !v) },
    { key: 'F7', action: () => setCheckoutMethod(prev => prev === 'cash' ? 'credit' : prev === 'credit' ? 'debt' : 'cash') },
    { key: 'F12', action: () => { if (!showCheckoutModal) handleCheckoutInit(); else handleCheckoutConfirm(); } },
    {
      key: 'Escape', action: () => {
        setShowCheckoutModal(false);
        setShowCamera(false);
        setShowShortcutsModal(false);
        searchInputRef.current?.focus();
      }
    },
    { key: '?', ctrl: true, action: () => setShowShortcutsModal(true) },
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (showCheckoutModal || showShortcutsModal || showCamera) return;

      if (activeProductIndex >= 0) {
        let cols = window.innerWidth >= 1280 ? 4 : window.innerWidth >= 640 ? 3 : 2; 
        if (e.key === 'ArrowRight') { 
          e.preventDefault(); 
          setActiveProductIndex(p => Math.min(p + (isAr ? -1 : 1), filteredProducts.length - 1)); 
        }
        else if (e.key === 'ArrowLeft') { 
          e.preventDefault(); 
          setActiveProductIndex(p => Math.max(p + (isAr ? 1 : -1), 0)); 
        }
        else if (e.key === 'ArrowDown') { 
          e.preventDefault(); 
          setActiveProductIndex(p => Math.min(p + cols, filteredProducts.length - 1)); 
        }
        else if (e.key === 'ArrowUp') { 
          e.preventDefault(); 
          if (activeProductIndex < cols) { setActiveProductIndex(-1); searchInputRef.current?.focus(); }
          else setActiveProductIndex(p => Math.max(p - cols, 0)); 
        }
        else if (e.key === 'Enter') { 
          e.preventDefault(); 
          if (filteredProducts[activeProductIndex]) {
            addToCart(filteredProducts[activeProductIndex]);
            setActiveProductIndex(-1);
            searchInputRef.current?.focus();
            setSearch('');
          }
        }
        else if (e.key === 'Escape') { 
          e.preventDefault(); 
          setActiveProductIndex(-1); 
          searchInputRef.current?.focus(); 
        }
        return; // capture exclusively
      }

      if (e.key === 'Escape') {
        setActiveCartIndex(-1);
        searchInputRef.current?.focus();
      }

      // Cart Navigation
      if (activeCartIndex >= 0 && !isInputActive && activeProductIndex === -1) {
        if (e.key === 'ArrowDown') { 
          e.preventDefault(); 
          setActiveCartIndex(prev => Math.min(prev + 1, cart.length - 1)); 
        }
        else if (e.key === 'ArrowUp') { 
          e.preventDefault(); 
          setActiveCartIndex(prev => {
            if (prev === 0) {
              searchInputRef.current?.focus();
              return -1;
            }
            return prev - 1;
          });
        }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const item = cart[activeCartIndex];
          if (item?.strip_price != null) updateUnitType(item.id, item.unit_type === 'box' ? 'strip' : 'box');
        }
        else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          if (cart[activeCartIndex]) updateCartQuantity(cart[activeCartIndex].id, 1);
        }
        else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          if (cart[activeCartIndex]) updateCartQuantity(cart[activeCartIndex].id, -1);
        }
        else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          if (cart[activeCartIndex]) removeFromCart(cart[activeCartIndex].id);
          if (cart.length <= 1) {
            searchInputRef.current?.focus();
            setActiveCartIndex(-1);
          }
        } 
        else if (e.key === 'Enter') {
          e.preventDefault();
          if (cart[activeCartIndex]) updateCartQuantity(cart[activeCartIndex].id, 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, activeCartIndex, activeProductIndex, filteredProducts, isAr, showCheckoutModal, showShortcutsModal, showCamera, updateCartQuantity, removeFromCart, addToCart]);

  useEffect(() => {
    if (activeCartIndex >= 0 && cartContainerRef.current) {
      const activeEl = cartContainerRef.current.children[activeCartIndex] as HTMLElement;
      if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeCartIndex]);

  useEffect(() => {
    if (activeProductIndex >= 0 && productsContainerRef.current) {
      const activeEl = productsContainerRef.current.children[activeProductIndex] as HTMLElement;
      if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeProductIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && visibleCount < filteredProducts.length) {
      setVisibleCount(prev => prev + 24);
    }
  };

  const finalTotal = Math.max(0, cartTotal - (Number(discountAmount) || 0));
  const changeDue = Math.max(0, (Number(receivedAmount) || 0) - finalTotal);

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-6.5rem)] overflow-hidden">
      <KeyboardShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />

      {/* ── Top Bar ── */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center shrink-0">
        <Button
          variant="outline"
          className="flex items-center gap-2 h-12 w-12 sm:w-auto shrink-0 border-border bg-surface text-textMain hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => setShowShortcutsModal(true)}
        >
          <Keyboard className="h-5 w-5" />
          <span className="hidden lg:inline text-sm font-bold">{isAr ? 'الاختصارات (Ctrl+?)' : 'Shortcuts'}</span>
        </Button>

        <div className="relative flex-1 min-w-0">
          <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted/50" />
          <Input
            ref={searchInputRef}
            placeholder={t.search + ' / ' + t.barcode + ' (F2)'}
            className="h-12 ltr:pl-11 rtl:pr-11 text-base lg:text-lg font-bold rounded-2xl bg-surface border-border focus:ring-primary-500 focus:border-primary-500 shadow-sm ltr:rtl:pr-11 ltr:rtl:pl-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleSearchEnter(); }
              else if (e.key === 'ArrowDown' && !e.altKey) { 
                e.preventDefault(); 
                searchInputRef.current?.blur(); 
                setActiveCartIndex(-1);
                setActiveProductIndex(0); 
              }
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
              className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 p-1 text-textMuted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          onClick={() => setShowCamera(true)}
          className="shrink-0 h-12 gap-2 px-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-sm"
        >
          <UpcScan className="h-5 w-5" />
          <span className="hidden sm:inline">{isAr ? 'مسح' : 'Scan'}</span>
        </Button>

        {/* Mobile cart toggle button */}
        <button
          onClick={() => setIsCartVisible(v => !v)}
          className="lg:hidden relative flex items-center gap-1.5 h-12 px-3 rounded-2xl bg-surface border border-border text-textMain hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={isAr ? 'إخفاء/إظهار السلة (F4)' : 'Toggle Cart (F4)'}
        >
          <Cart4 className="h-5 w-5" />
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-black">
              {cart.length}
            </span>
          )}
          {isCartVisible ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-col lg:flex-row gap-3 flex-1 overflow-hidden min-h-0">

        {/* ── LEFT: Products ── */}
        <div className={`flex flex-col flex-1 overflow-hidden ${isCartVisible ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between pb-2 shrink-0 px-1">
            <h2 className="font-bold text-textMain text-sm sm:text-base">{isAr ? 'الأصناف' : 'Products'}</h2>
            <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-3 py-0.5 rounded-full text-xs font-black border border-primary-200 dark:border-primary-800 shadow-sm flex items-center gap-1">
              <span>{filteredProducts.length}</span>
              <span>{isAr ? 'متاح' : 'Available'}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-24 lg:pb-4 pr-1 custom-scrollbar"
               onScroll={handleScroll}
               ref={productsContainerRef}
          >
          {isLoadingProducts ? (
            <div className="col-span-full h-full flex flex-col items-center justify-center text-textMuted opacity-50 space-y-4">
              <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" />
              <p>{isAr ? 'جاري تحميل المنتجات...' : 'Loading products...'}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full h-full flex flex-col items-center justify-center text-textMuted opacity-50 space-y-4">
              <Cart4 className="h-16 w-16" />
              <p className="text-xl font-bold">{isAr ? 'لا يوجد منتجات' : 'No products found'}</p>
            </div>
          ) : (
            filteredProducts.slice(0, visibleCount).map((product, idx) => (
              <ProductCard key={product.id} product={product} t={t} onAdd={addToCart} isActive={activeProductIndex === idx} />
            ))
          )}
          </div>
        </div>

        {/* ── RIGHT: Cart Panel ── */}
        <div className={`
          w-full lg:w-[28rem] flex flex-col bg-surface border border-border rounded-3xl shadow-sm overflow-hidden flex-shrink-0
          ${isCartVisible ? 'flex' : 'hidden lg:flex'}
          lg:flex
        `}>
          {/* Cart Header */}
          <div className="p-4 border-b border-border flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/50 shrink-0">
            <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-xl">
              <Cart4 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="font-extrabold text-xl text-textMain tracking-tight">{t.cart}</h2>
            <span className="ltr:ml-auto rtl:mr-auto bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-black shadow-sm">
              {cart.length} {isAr ? 'عنصر' : 'items'}
            </span>
            {/* Mobile close cart */}
            <button
              onClick={() => setIsCartVisible(false)}
              className="lg:hidden p-1.5 rounded-lg text-textMuted hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cart Items */}
          <div
            className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30 dark:bg-[#0f172a]/30 custom-scrollbar"
            ref={cartContainerRef}
          >
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-textMuted text-sm opacity-60">
                <Cart4 className="h-14 w-14 opacity-30 mb-3" />
                <p className="text-base font-bold mb-1">{isAr ? 'السلة فارغة' : 'Cart is empty'}</p>
                <p className="text-sm font-medium text-center">{isAr ? 'امسح باركود أو ابحث لإضافة منتجات' : 'Scan or search to add products'}</p>
                <div className="mt-6 grid grid-cols-2 gap-2 opacity-70">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-center font-mono text-xs">F2 = Search</div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-center font-mono text-xs">F3 = Go to Cart</div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-center font-mono text-xs">F12 = Pay</div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-center font-mono text-xs">F4 = Toggle Cart</div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-center font-mono text-xs">Del = Remove item</div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-center font-mono text-xs">+/- = Qty</div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-center font-mono text-xs">Arrows = Navigation</div>
                </div>
              </div>
            ) : (
              cart.map((item, index) => (
                <CartRow
                  key={`${item.id}-${index}`}
                  item={item}
                  index={index}
                  isActive={activeCartIndex === index}
                  t={t}
                  language={language}
                  onUpdateQty={updateCartQuantity}
                  onSetQty={setCartQuantity}
                  onUpdateUnit={updateUnitType}
                  onRemove={removeFromCart}
                />
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 border-t border-border bg-white dark:bg-slate-900 shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.08)] space-y-3 shrink-0">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-textMuted font-medium px-1 text-sm">
                <span>{isAr ? 'الإجمالي الفرعي' : 'Subtotal'}</span>
                <span className="font-mono">{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-2xl font-black text-textMain px-1 mt-1">
                <span>{t.total}</span>
                <span className="text-primary-600 font-mono tracking-tighter text-3xl">{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              id="pos-checkout-btn"
              size="lg"
              className="w-full text-lg h-14 font-black tracking-wide rounded-2xl shadow-md border-[3px] border-primary-500 bg-primary-600 hover:bg-primary-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
              disabled={cart.length === 0}
              onClick={handleCheckoutInit}
            >
              {isAr ? '✅ دفع وإتمام (F12)' : '✅ Checkout (F12)'}
            </Button>

            {lastSaleIds.length > 0 && cart.length === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-11 gap-2 border-primary-300 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-sm"
                  onClick={async () => {
                    try {
                      const response = await axiosInstance.post('/invoices/generate', { sale_ids: lastSaleIds }, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                      window.open(url, '_blank');
                    } catch {
                      toast.error(isAr ? 'فشل الطباعة' : 'Print failed');
                    }
                  }}
                >
                  <FileEarmarkArrowDown className="h-4 w-4" />
                  {isAr ? '🧾 طباعة الفاتورة السابقة' : '🧾 Print Last Invoice'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          CHECKOUT MODAL
      ════════════════════════════════════════ */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full sm:max-w-lg overflow-hidden border border-border sm:scale-in-center max-h-[95dvh] flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-border bg-slate-50 dark:bg-slate-900/30 shrink-0">
              <h3 className="text-xl font-black text-textMain flex items-center gap-2.5">
                <CashStack className="h-6 w-6 text-primary-600" />
                {isAr ? 'إتمام الدفع' : 'Complete Payment'}
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-textMuted hover:bg-red-100 hover:text-red-500 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">

              {/* Total Display */}
              <div className="text-center p-5 bg-primary-50 dark:bg-primary-900/20 rounded-3xl border-2 border-primary-100 dark:border-primary-800">
                <p className="text-primary-800 dark:text-primary-300 font-bold mb-1.5 uppercase tracking-wider text-sm">
                  {isAr ? 'المطلوب سداده' : 'Total Due'}
                </p>
                <p className="text-5xl font-black text-primary-600 font-mono tracking-tighter">
                  {finalTotal.toFixed(2)}
                </p>
                {Number(discountAmount) > 0 && (
                  <p className="text-sm font-bold text-emerald-600 mt-2">
                    {isAr ? 'خصم:' : 'Discount:'} {Number(discountAmount).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Discount Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-textMain text-sm">
                  <DashLg className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'قيمة الخصم (اختياري)' : 'Discount (optional)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-white dark:bg-slate-900 px-4 text-sm font-medium text-textMain placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-600 transition-shadow"
                    min="0"
                    max={cartTotal}
                  />
                </div>
              </div>

              {/* Customer Name — for ALL payment methods */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-textMain text-sm">
                  <PersonPlusFill className="h-4 w-4 text-sky-500" />
                  {isAr ? 'اسم العميل (اختياري)' : 'Customer Name (optional)'}
                </label>
                <div className="relative">
                  <input
                    id="customer-name-input"
                    type="text"
                    placeholder={isAr ? 'ادخل اسم العميل...' : 'Enter customer name...'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-white dark:bg-slate-900 px-4 text-sm font-medium text-textMain placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-600 transition-shadow"
                  />
                  {customerName && (
                    <button
                      onClick={() => setCustomerName('')}
                      className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="font-bold text-textMain text-sm">{isAr ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <span className="text-xs font-mono text-textMuted font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">F7</span>
                </div>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {[
                    { key: 'cash', icon: CashStack, label: isAr ? 'كاش' : 'Cash' },
                    { key: 'credit', icon: CreditCardFill, label: isAr ? 'فيزا' : 'Card' },
                    { key: 'debt', icon: PeopleFill, label: isAr ? 'شكك' : 'Debt' },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setCheckoutMethod(key as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-sm transition-all ${
                        checkoutMethod === key
                          ? 'bg-white dark:bg-slate-600 text-textMain shadow-sm'
                          : 'text-textMuted hover:text-textMain'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Debtor Selection */}
              {checkoutMethod === 'debt' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="font-bold text-textMain text-sm block">
                    {isAr ? 'العميل (الشكك)' : 'Customer (Debt)'}
                  </label>
                  <select
                    className="w-full h-11 rounded-xl border border-border bg-white dark:bg-slate-800 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    value={debtorId}
                    onChange={(e) => setDebtorId(e.target.value)}
                  >
                    <option value="">{isAr ? '-- اختر عميل --' : '-- Select Customer --'}</option>
                    {debtors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} {d.phone ? `(${d.phone})` : ''}</option>
                    ))}
                  </select>

                  <div className="relative">
                    <Input
                      placeholder={isAr ? 'أو اضف عميل جديد واضغط Enter' : 'Or add new customer + Enter'}
                      className="h-11 rounded-xl ltr:pr-10 rtl:pl-10 text-sm"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const name = (e.target as HTMLInputElement).value.trim();
                          if (!name) return;
                          try {
                            const res = await axiosInstance.post('/debtors', { name });
                            setDebtors(prev => [...prev, res.data]);
                            setDebtorId(res.data.id.toString());
                            (e.target as HTMLInputElement).value = '';
                            toast.success(isAr ? '✅ مضاف بنجاح' : '✅ Added');
                          } catch {
                            toast.error(isAr ? '❌ فشل الإضافة' : '❌ Failed');
                          }
                        }
                      }}
                    />
                    <div className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-textMuted opacity-50">
                      <PlusLg className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              )}

              {/* Cash/Debt: Received + Change */}
              {(checkoutMethod === 'cash' || checkoutMethod === 'debt') && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-textMain text-sm">{isAr ? 'المبلغ المستلم' : 'Received'}</label>
                    <div className="relative">
                      <span
                        className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-textMuted cursor-pointer hover:text-primary-600 text-base"
                        onClick={() => setReceivedAmount(checkoutMethod === 'debt' ? '0' : finalTotal.toFixed(2))}
                      >💵</span>
                      <input
                        ref={receivedInputRef}
                        type="number"
                        className="w-full text-2xl font-black font-mono ltr:pl-9 rtl:pr-9 pr-3 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-border focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-textMain outline-none"
                        placeholder={checkoutMethod === 'debt' ? '0.00' : finalTotal.toFixed(2)}
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCheckoutConfirm(); }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-textMuted text-sm">
                      {checkoutMethod === 'debt' ? (isAr ? 'المتبقي (الشكك)' : 'Remaining Debt') : (isAr ? 'الباقي للمشتري' : 'Change')}
                    </label>
                    <div className={`w-full text-2xl font-black font-mono px-3 py-3 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      checkoutMethod === 'debt'
                        ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800'
                        : Number(receivedAmount) > 0 && changeDue > 0
                          ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800'
                          : 'bg-slate-50 border-transparent text-textMuted dark:bg-slate-800'
                    }`}>
                       {checkoutMethod === 'debt' 
                         ? Math.max(0, finalTotal - (Number(receivedAmount) || 0)).toFixed(2)
                         : changeDue.toFixed(2)
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-border bg-slate-50 dark:bg-slate-900/30 shrink-0">
              <Button
                id="checkout-confirm-btn"
                onClick={handleCheckoutConfirm}
                isLoading={isCheckoutLoading}
                className="w-full h-14 text-lg font-black uppercase tracking-wider rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-transform"
              >
                {isAr ? 'تأكيد العملية (Enter)' : 'Confirm (Enter)'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <BarcodeCamera onScan={handleBarcodeScanMode} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
}
