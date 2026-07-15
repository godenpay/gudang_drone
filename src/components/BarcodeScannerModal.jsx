import React, { useEffect, useRef, useState } from 'react';
import { X, Camera as CameraIcon, AlertTriangle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// Modal kamera untuk scan barcode/QR pakai device camera (HP/laptop).
// Terpisah dari alur scanner USB/Bluetooth (yang berperilaku seperti
// keyboard dan sudah ditangani lewat onKeyDown di masing-masing form).
// Butuh HTTPS atau localhost — browser menolak akses kamera di HTTP biasa.
export default function BarcodeScannerModal({ isOpen, onClose, onDetected, title = 'Scan Barcode' }) {
  const [error, setError] = useState('');
  const [elementId] = useState(() => `barcode-scanner-viewport-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    detectedRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Browser ini tidak mendukung akses kamera. Gunakan Chrome/Edge/Safari versi terbaru, dan pastikan halaman diakses lewat HTTPS.');
      return;
    }

    const scanner = new Html5Qrcode(elementId, { verbose: false });
    scannerRef.current = scanner;
    let startedOk = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (vw, vh) => ({ width: Math.floor(Math.min(vw, vh) * 0.7), height: Math.floor(Math.min(vw, vh) * 0.45) }) },
        (decodedText) => {
          if (detectedRef.current) return;
          detectedRef.current = true;
          onDetected(decodedText.trim());
        },
        () => {} // frame tanpa barcode terdeteksi — abaikan, ini normal tiap frame
      )
      .then(() => {
        startedOk = true;
      })
      .catch(() => {
        setError('Tidak bisa mengakses kamera. Cek izin kamera di browser, pastikan tidak dipakai aplikasi lain, dan halaman diakses lewat HTTPS.');
      });

    return () => {
      const s = scannerRef.current;
      if (s && startedOk) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [isOpen, elementId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <CameraIcon className="w-4 h-4" /> {title}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-sm text-red-600 flex gap-2 items-start bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : (
            <div id={elementId} className="w-full rounded-lg overflow-hidden bg-black min-h-[220px]" />
          )}
          <p className="text-xs text-gray-400 mt-3 text-center">Arahkan kamera ke barcode/QR barang. Otomatis terbaca, tidak perlu tekan tombol apapun.</p>
        </div>
      </div>
    </div>
  );
}
