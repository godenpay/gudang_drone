import React, { useState, useRef, useEffect } from 'react';
import { HandHelping, RotateCcw, X, CheckCircle2, ScanBarcode } from 'lucide-react';

export default function LoanView({ inventory, loans, onCreateLoan, onReturnLoan, onApproveLoan, onRejectLoan, canManage = true, isAdminGudang = false }) {
  const today = new Date().toISOString().slice(0, 10);
  const demoDrones = inventory.filter((item) => item.category === 'Drone' && item.purpose === 'Demo-Project');

  const emptyForm = {
    item_id: '',
    qty: 1,
    borrower_name: '',
    project_name: '',
    notes: '',
    loan_date: today,
    expected_return_date: '',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returningLoan, setReturningLoan] = useState(null);
  const [conditionNote, setConditionNote] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState('');
  const scanInputRef = useRef(null);
  const borrowerInputRef = useRef(null);

  const selectedItem = inventory.find((i) => i.id === formData.item_id);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  // Scan cuma boleh mencocokkan ke drone yang memang berstatus Demo/Project -
  // kalau SKU-nya valid tapi bukan stok demo, tolak di sini juga (bukan cuma
  // di backend), supaya errornya kelihatan langsung waktu scan, bukan
  // setelah submit.
  const handleScanKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;
    const match = demoDrones.find((i) => i.id.toLowerCase() === code.toLowerCase());
    if (!match) {
      const existsElsewhere = inventory.some((i) => i.id.toLowerCase() === code.toLowerCase());
      setScanError(
        existsElsewhere
          ? `"${code}" ada di master data tapi bukan stok Demo/Project.`
          : `SKU "${code}" tidak ditemukan.`
      );
      return;
    }
    if (match.stock === 0) {
      setScanError(`Stok demo "${match.id}" sedang tidak tersedia.`);
      return;
    }
    setFormData({ ...formData, item_id: match.id });
    setScanValue('');
    setScanError('');
    borrowerInputRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_id || !formData.borrower_name || !formData.project_name || !formData.expected_return_date) {
      alert('Mohon lengkapi semua field wajib.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateLoan({ ...formData, qty: parseInt(formData.qty) });
      setFormData(emptyForm);
      setScanValue('');
      setScanError('');
      scanInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    await onReturnLoan(returningLoan.id, { condition_note: conditionNote });
    setReturningLoan(null);
    setConditionNote('');
  };

  const statusBadge = (status) => {
    const map = {
      Dipinjam: 'bg-amber-100 text-amber-700',
      Dikembalikan: 'bg-emerald-100 text-emerald-700',
      Terlambat: 'bg-red-100 text-red-700',
      'Menunggu Approval': 'bg-blue-100 text-blue-700',
      Ditolak: 'bg-gray-200 text-gray-600',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
  };

  const activeLoans = loans.filter((l) => l.status !== 'Dikembalikan');
  const historyLoans = loans.filter((l) => l.status === 'Dikembalikan');

  return (
    <div className="space-y-6">
      {!canManage && (
        <div className="max-w-3xl text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
          Anda hanya bisa melihat data peminjaman. Untuk mencatat peminjaman/pengembalian baru, hubungi Admin Gudang.
        </div>
      )}

      {canManage && (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-gray-100 bg-purple-50 text-purple-800">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HandHelping className="w-5 h-5" /> Form Peminjaman Drone (Demo/Project)
          </h3>
          <p className="text-sm mt-1 opacity-80">
            Hanya untuk unit drone dari stok Demo/Project — bukan stok jual. Stok akan otomatis berkurang selama masa pinjam.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              Scan Barcode Drone <ScanBarcode className="w-3.5 h-3.5 text-gray-400" />
            </label>
            <input
              ref={scanInputRef}
              type="text"
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              value={scanValue}
              onChange={(e) => {
                setScanValue(e.target.value);
                if (scanError) setScanError('');
              }}
              onKeyDown={handleScanKeyDown}
              placeholder="Arahkan scanner ke sini, atau ketik SKU lalu tekan Enter"
            />
            {scanError && <p className="text-red-500 text-xs mt-1">{scanError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atau Pilih Manual - Drone Demo/Project *</label>
            <select
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
            >
              <option value="" disabled>-- Pilih Drone --</option>
              {demoDrones.map((item) => (
                <option key={item.id} value={item.id} disabled={item.stock === 0}>
                  {item.id} - {item.name} {item.stock === 0 ? '(Tidak tersedia)' : `(Stok: ${item.stock})`}
                </option>
              ))}
            </select>
            {demoDrones.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Belum ada drone yang ditandai sebagai stok Demo/Project. Tambahkan lewat menu Inventaris terlebih dahulu.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kuantitas *</label>
              <input
                type="number"
                required
                min="1"
                max={selectedItem ? selectedItem.stock : ''}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                disabled={!selectedItem}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Peminjam / PIC *</label>
              <input
                ref={borrowerInputRef}
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                value={formData.borrower_name}
                onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Project / Keperluan Demo *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Demo Pemetaan Lahan PT. Agri Makmur"
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pinjam *</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                value={formData.loan_date}
                onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Tanggal Kembali *</label>
              <input
                type="date"
                required
                min={formData.loan_date}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                value={formData.expected_return_date}
                onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Kondisi unit saat keluar, kelengkapan aksesoris, dsb."
              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormData(emptyForm)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting || demoDrones.length === 0}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <HandHelping className="w-4 h-4" /> {isSubmitting ? 'Memproses...' : 'Catat Peminjaman'}
            </button>
          </div>
        </form>
      </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Peminjaman Aktif</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Drone</th>
                <th className="px-6 py-3 font-medium text-center">Qty</th>
                <th className="px-6 py-3 font-medium">Peminjam</th>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium">Target Kembali</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{loan.id}</td>
                  <td className="px-6 py-3">{loan.item_name}</td>
                  <td className="px-6 py-3 text-center font-medium">{loan.qty}</td>
                  <td className="px-6 py-3">{loan.borrower_name}</td>
                  <td className="px-6 py-3">{loan.project_name}</td>
                  <td className="px-6 py-3">{loan.expected_return_date}</td>
                  <td className="px-6 py-3 text-center">{statusBadge(loan.status)}</td>
                  <td className="px-6 py-3 text-center">
                    {loan.status === 'Menunggu Approval' && isAdminGudang ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => onApproveLoan(loan.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onRejectLoan(loan.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : loan.status === 'Menunggu Approval' ? (
                      <span className="text-xs text-gray-400">Menunggu Admin Gudang</span>
                    ) : canManage && loan.status !== 'Ditolak' ? (
                      <button
                        onClick={() => setReturningLoan(loan)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Kembalikan
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {activeLoans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">Tidak ada peminjaman yang sedang berjalan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {historyLoans.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Riwayat Pengembalian</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Drone</th>
                  <th className="px-6 py-3 font-medium">Peminjam</th>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Tgl Kembali</th>
                  <th className="px-6 py-3 font-medium">Catatan Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{loan.id}</td>
                    <td className="px-6 py-3">{loan.item_name}</td>
                    <td className="px-6 py-3">{loan.borrower_name}</td>
                    <td className="px-6 py-3">{loan.project_name}</td>
                    <td className="px-6 py-3">{loan.actual_return_date}</td>
                    <td className="px-6 py-3 text-gray-500">{loan.condition_note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {returningLoan && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-lg">Konfirmasi Pengembalian</h3>
              <button onClick={() => setReturningLoan(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Mengembalikan <span className="font-medium">{returningLoan.qty}x {returningLoan.item_name}</span> dari peminjaman{' '}
                <span className="font-mono text-xs">{returningLoan.id}</span> ke stok demo.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Kondisi Unit (Opsional)</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Unit lengkap, baterai 2 dari 3 kembali, baling-baling retak 1."
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  value={conditionNote}
                  onChange={(e) => setConditionNote(e.target.value)}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReturningLoan(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Konfirmasi Kembali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
