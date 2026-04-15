'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'react-bootstrap-icons';
import { Button } from '@/components/ui/Button';
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library';

interface BarcodeCameraProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeCamera({ onScan, onClose }: BarcodeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Initialize ZXing reader with specific formats to greatly increase scan speed
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX
    ]);
    
    const codeReader = new BrowserMultiFormatReader(hints);
    codeReader.timeBetweenDecodingAttempts = 100; // default is 500ms, lowering it makes scanning much faster and more responsive
    readerRef.current = codeReader;

    const startScanner = async () => {
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          throw new Error('No camera devices found.');
        }

        // Try to pick back/environment camera first
        let selectedDeviceId = videoInputDevices[0].deviceId;
        for (const device of videoInputDevices) {
            if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment')) {
                selectedDeviceId = device.deviceId;
                break;
            }
        }

        if (!mounted) return;

        codeReader.decodeFromVideoDevice(
          selectedDeviceId, 
          videoRef.current, 
          (result, err) => {
            if (result) {
              // Success! Give it a tiny delay to feel natural then close
              const text = result.getText();
              onScan(text);
              codeReader.reset();
              onClose();
            }
            if (err && !(err instanceof NotFoundException)) {
              // Ignore NotFoundException (it just means no barcode in the current video frame)
            }
          }
        );
      } catch (err: any) {
        if (mounted) {
          console.error(err);
          setError(
            err.message?.includes('Permission') 
                ? 'Camera permission denied. Please allow camera access in your browser settings.'
                : err.message || 'Could not start camera. Check permissions or connection.'
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (readerRef.current) {
        readerRef.current.reset(); // Properly release camera on unmount
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-surface p-4 shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-textMain flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary-600" />
            Barcode Scanner
          </h3>
          <Button variant="ghost" size="icon" onClick={() => {
              if (readerRef.current) readerRef.current.reset();
              onClose();
          }}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden bg-black flex items-center justify-center min-h-[300px]">
             {/* The raw video feed */}
             <video ref={videoRef} className="w-full h-[300px] object-cover" />
             
             {/* Target Box Overlay */}
             <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-32 border-2 border-primary-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-10 pointer-events-none" />
             
             {/* Laser Line Animation */}
             <div className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_red] z-20 pointer-events-none animate-pulse" />
          </div>
        )}
        
        {!error && (
            <p className="text-sm font-medium text-textMain text-center mt-4">
               📷 Center the barcode inside the box
            </p>
        )}
      </div>
    </div>
  );
}
