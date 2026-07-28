import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';

// Tombol kamera kecil dipasang di sebelah input SKU/pencarian.
// Terpisah dari input scanner USB/Bluetooth — ini khusus kamera HP/laptop.
export default function CameraScanButton({ onScan, title = 'Scan pakai kamera', className = '', modalTitle = 'Scan Barcode' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={title}
        className={
          className ||
          'flex items-center justify-center p-2.5 border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors flex-shrink-0'
        }
      >
        <Camera className="w-4 h-4" />
      </button>
      <BarcodeScannerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={modalTitle}
        onDetected={(code) => {
          setOpen(false);
          onScan(code);
        }}
      />
    </>
  );
}
