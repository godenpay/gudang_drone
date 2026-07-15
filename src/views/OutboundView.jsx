import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpFromLine, ScanBarcode } from 'lucide-react';
import CameraScanButton from '../components/CameraScanButton';

export default function OutboundView({ inventory, onSubmit }) {
  const [selectedSku, setSelectedSku] = useState('');
  const [qty, setQty] = useState('');
  const [destination, setDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState('');
  const scanInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  const selectedItem = inventory.find((i) => i.id === selectedSku);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  // Barcode scanner = keyboard yang mengetik super cepat lalu menekan Enter.
  // Enter di kolom ini TIDAK boleh submit form (kuantitas belum diisi) -
  // dia dipakai untuk mencocokkan kode ke daftar barang, lalu pindah
  // fokus ke kolom kuantitas supaya alurnya cepat: scan -> ketik qty -> Enter lagi kalau perlu.
  // Fungsi ini juga dipakai oleh scan kamera, bukan cuma scanner fisik.
  const processScannedCode = (code) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const match = inventory.find((i) => i.id.toLowerCase() === trimmed.toLowerCase());
    if (!match) {
      setScanError(`SKU "${trimmed}" tidak ditemukan di master data.`);
      return;
    }
    if (match.stock === 0) {
      setScanError(`Stok "${match.id}" sudah habis, tidak bisa di-outbound.`);
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
      await onSubmit({ item_id: selectedSku, qty: parseInt(qty), destination });
      setQty('');
      setDestination('');
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
      <div className="p-6 border-b border-gray-100 bg-orange-50 text-orange-800">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ArrowUpFromLine className="w-5 h-5" /> Form Pengeluaran Barang (Outbound)
        </h3>
        <p className="text-sm mt-1 opacity-80">Catat barang yang akan dikirim/dikeluarkan dari gudang. Stok akan otomatis berkurang.</p>
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
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
              value={scanValue}
              onChange={(e) => {
                setScanValue(e.target.value);
                if (scanError) setScanError('');
              }}
              onKeyDown={handleScanKeyDown}
              placeholder="Arahkan scanner ke sini, atau ketik SKU lalu tekan Enter"
            />
            <CameraScanButton onScan={processScannedCode} modalTitle="Scan Barcode — Outbound" />
          </div>
          {scanError && <p className="text-red-500 text-xs mt-1">{scanError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Atau Pilih Manual (SKU) *</label>
          <select
            required
            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
          >
            <option value="" disabled>-- Pilih Barang --</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id} disabled={item.stock === 0}>
                {item.id} - {item.name} {item.stock === 0 ? '(Habis)' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className={`p-4 rounded-lg border text-sm ${selectedItem.stock < 5 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <p className="text-gray-500 mb-1">Lokasi Rak Pengambilan</p>
                <p className="font-bold text-xl font-mono text-gray-800">{selectedItem.location}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Stok Tersedia</p>
                <p className={`font-bold text-xl ${selectedItem.stock < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                  {selectedItem.stock}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kuantitas Keluar *</label>
            <input
              ref={qtyInputRef}
              type="number"
              required
              min="1"
              max={selectedItem ? selectedItem.stock : ''}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              disabled={!selectedItem}
            />
            {selectedItem && qty > selectedItem.stock && (
              <p className="text-red-500 text-xs mt-1">Melebihi stok tersedia!</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan / Pelanggan (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: PT. Agri Makmur"
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
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
            disabled={isSubmitting || (selectedItem && qty > selectedItem.stock)}
            className="px-5 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowUpFromLine className="w-4 h-4" /> {isSubmitting ? 'Memproses...' : 'Proses Outbound'}
          </button>
        </div>
      </form>
    </div>
  );
}
