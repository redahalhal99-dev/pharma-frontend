'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to capture keyboard input from a USB Barcode Scanner.
 * Barcode scanners act as fast keyboards and end with "Enter".
 * 
 * This hook intercepts keystrokes globally, differentiating
 * between human typing and scanner input by checking speed.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void, enabled: boolean = true) {
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!e.key) return; // Safety check to prevent "Cannot read properties of undefined (reading 'length')"

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // Enter key = end of barcode scan
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          onScan(barcodeBuffer.current.trim());
        }
        barcodeBuffer.current = '';
        if (timeoutId.current) clearTimeout(timeoutId.current);
        return;
      }

      // Only collect printable single characters
      if (e.key.length === 1) {
        // If too much time passed since last key, reset buffer (human typing)
        // Hard-set to 50ms because hardware scanners emit keys almost simultaneously
        if (timeSinceLastKey > 50 && barcodeBuffer.current.length > 0) {
          barcodeBuffer.current = '';
        }

        barcodeBuffer.current += e.key;

        // Auto-clear buffer after 100ms of no input (safety net)
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
        timeoutId.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100);
      }
    },
    [onScan]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [handleKeyDown, enabled]);
}
