import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownToLine, CheckCircle2, ScanBarcode } from 'lucide-react';
import CameraScanButton from '../components/CameraScanButton';

export default function InboundView({ inventory, onSubmit }) {
  const [selectedSku, setSelectedSku] = useState('');
  const [qty, setQty] = useState('');
  const [supplier, setSupplier] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState('');
  const scanInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  const selectedItem = inventory.find((i) => i.id === selectedSku);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  // Cari SKU di master data lalu pindah fokus ke kuantitas.
  // Dipakai baik oleh scanner USB/Bluetooth (lewat Enter) maupun scan kamera.
  const processScannedCode = (code) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const match = inventory.find((i) => i.id.toLowerCase() === trimmed.toLowerCase());
    if (!match) {
      setScanError(`SKU "${trimmed}" tidak ditemukan di master data.`);
      return;
    }
    setSelectedSku(match.id);
    setScanValue('');
    setScanError('');
    qtyInputRef.current?.focus();
  };

  const handleScanKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    processScannedCode(scanValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSku || !qty || qty <= 0) {
      alert('Mohon isi SKU dan kuantitas dengan benar.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ item_id: selectedSku, qty: parseInt(qty), supplier, po_number: poNumber });
      setQty('');
      setSupplier('');
      setPoNumber('');
      setSelectedSku('');
      setScanValue('');
      setScanError('');
      scanInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-emerald-50 text-emerald-800">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ArrowDownToLine className="w-5 h-5" /> Form Penerimaan Barang (Inbound)
        </h3>
        <p className="text-sm mt-1 opacity-80">Catat barang baru yang masuk ke gudang untuk menambah stok sistem.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            Scan Barcode SKU <ScanBarcode className="w-3.5 h-3.5 text-gray-400" />
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={scanInputRef}
              type="text"
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              value={scanValue}
              onChange={(e) => {
                setScanValue(e.target.value);
                if (scanError) setScanError('');
              }}
              onKeyDown={handleScanKeyDown}
              placeholder="Arahkan scanner ke sini, atau ketik SKU lalu tekan Enter"
            />
            <CameraScanButton onScan={processScannedCode} modalTitle="Scan Barcode — Inbound" />
          </div>
          {scanError && <p className="text-red-500 text-xs mt-1">{scanError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Atau Pilih Manual (SKU) *</label>
          <select
            required
            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
          >
            <option value="" disabled>-- Pilih Barang --</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} - {item.name}
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 mb-1">Kategori</p>
                <p className="font-medium">{selectedItem.category}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Lokasi Rak Rekomendasi</p>
                <p className="font-medium text-blue-600 font-mono">{selectedItem.location}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Stok Saat Ini</p>
                <p className="font-medium">{selectedItem.stock} Unit</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kuantitas Masuk *</label>
            <input
              ref={qtyInputRef}
              type="number"
              required
              min="1"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor PO (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: PO-2026-07-001"
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (Opsional)</label>
          <input
            type="text"
            placeholder="Nama Perusahaan Pengirim/Supplier"
            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedSku('');
              setQty('');
            }}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> {isSubmitting ? 'Memproses...' : 'Proses Inbound'}
          </button>
        </div>
      </form>
    </div>
  );
}
