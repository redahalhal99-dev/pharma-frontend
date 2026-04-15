import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ar' | 'en';
type Theme = 'dark' | 'light';

interface AppState {
  language: Language;
  theme: Theme;
  currentShift: 'morning' | 'evening' | null;
  isSidebarOpen: boolean;
  
  // User Preferences
  barcodeInputSource: 'usb' | 'camera';
  enableSounds: boolean;
  autoPrintReceipt: boolean;

  toggleLanguage: () => void;
  toggleTheme: () => void;
  setShift: (shift: 'morning' | 'evening' | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Preference Setters
  setBarcodeInputSource: (source: 'usb' | 'camera') => void;
  setEnableSounds: (enabled: boolean) => void;
  setAutoPrintReceipt: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'ar',
      theme: 'dark',
      currentShift: 'morning',
      isSidebarOpen: false,
      barcodeInputSource: 'usb',
      enableSounds: true,
      autoPrintReceipt: false,

      toggleLanguage: () =>
        set((state) => ({ language: state.language === 'ar' ? 'en' : 'ar' })),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setShift: (shift) => set({ currentShift: shift }),
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) =>
        set(() => ({ isSidebarOpen: isOpen })),

      setBarcodeInputSource: (source) => set({ barcodeInputSource: source }),
      setEnableSounds: (enabled) => set({ enableSounds: enabled }),
      setAutoPrintReceipt: (enabled) => set({ autoPrintReceipt: enabled }),
    }),
    {
      name: 'app-storage',
    }
  )
);
