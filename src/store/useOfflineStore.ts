import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';

type PendingSale = {
  id: string;
  payload: any;
  timestamp: number;
  retryCount: number;
};

const MAX_RETRIES = 3;

type OfflineState = {
  isOffline: boolean;
  isSyncing: boolean;
  pendingSales: PendingSale[];
  cachedProducts: any[];
  setOfflineStatus: (status: boolean) => void;
  addPendingSale: (payload: any) => void;
  removePendingSale: (id: string) => void;
  clearPendingSales: () => void;
  setCachedProducts: (products: any[]) => void;
  syncPendingSales: (language?: string) => Promise<void>;
};

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOffline: false,
      isSyncing: false,
      pendingSales: [],
      cachedProducts: [],

      setOfflineStatus: (status) => set({ isOffline: status }),

      addPendingSale: (payload) =>
        set((state) => ({
          pendingSales: [
            ...state.pendingSales,
            { id: crypto.randomUUID(), payload, timestamp: Date.now(), retryCount: 0 },
          ],
        })),

      removePendingSale: (id) =>
        set((state) => ({
          pendingSales: state.pendingSales.filter((s) => s.id !== id),
        })),

      clearPendingSales: () => set({ pendingSales: [] }),

      setCachedProducts: (products) => set({ cachedProducts: products }),

      syncPendingSales: async (language = 'ar') => {
        const { isOffline, isSyncing, pendingSales } = get();
        if (isOffline || isSyncing || pendingSales.length === 0) return;

        set({ isSyncing: true });
        const toastId = toast.loading(
          language === 'ar'
            ? `⏳ جارٍ مزامنة ${pendingSales.length} مبيعات...`
            : `⏳ Syncing ${pendingSales.length} sales...`
        );

        let successCount = 0;
        let failCount = 0;

        for (const sale of [...pendingSales]) {
          try {
            await axiosInstance.post('/sales', sale.payload);
            get().removePendingSale(sale.id);
            successCount++;
          } catch {
            failCount++;
            // Increment retry count; remove if exceeded max
            set((state) => ({
              pendingSales: state.pendingSales.map((s) =>
                s.id === sale.id ? { ...s, retryCount: s.retryCount + 1 } : s
              ).filter((s) => s.retryCount <= MAX_RETRIES),
            }));
          }
        }

        toast.dismiss(toastId);

        if (successCount > 0 && failCount === 0) {
          toast.success(
            language === 'ar'
              ? `✅ تمت مزامنة ${successCount} مبيعات بنجاح`
              : `✅ ${successCount} sale(s) synced successfully`,
            { duration: 4000 }
          );
        } else if (successCount > 0 && failCount > 0) {
          toast(
            language === 'ar'
              ? `⚠️ تمت مزامنة ${successCount}، فشل ${failCount}`
              : `⚠️ Synced ${successCount}, failed ${failCount}`,
            { icon: '⚠️', duration: 5000 }
          );
        } else if (failCount > 0) {
          toast.error(
            language === 'ar' ? 'فشل المزامنة، سيُعاد المحاولة لاحقاً' : 'Sync failed, will retry later',
            { duration: 4000 }
          );
        }

        set({ isSyncing: false });
      },
    }),
    {
      name: 'pharmam-offline-storage',
      // Don't persist isSyncing
      partialize: (state) => ({
        isOffline: state.isOffline,
        pendingSales: state.pendingSales,
        cachedProducts: state.cachedProducts,
      }),
    }
  )
);

