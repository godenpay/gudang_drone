import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, CheckCircle2, ScanBarcode } from 'lucide-react';
import CameraScanButton from '../components/CameraScanButton';

export default function InventoryView({ inventory, onAdd, onEdit, onDelete, canEdit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPurpose, setFilterPurpose] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', category: 'Drone', purpose: 'Jual', minStock: 5, location: '' });
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const skuInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Fokuskan otomatis ke kolom SKU saat modal "Tambah" dibuka, supaya
  // barcode scanner (yang berperilaku seperti keyboard) bisa langsung
  // menembak input tanpa perlu klik dulu.
  useEffect(() => {
    if (isModalOpen && !editingItem) {
      const t = setTimeout(() => skuInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isModalOpen, editingItem]);

  // Scanner barcode mengirim karakter kode lalu diakhiri "Enter".
  // Kalau dibiarkan default, Enter itu akan langsung submit form
  // padahal field lain (nama, harga, dst) belum diisi. Jadi Enter
  // di kolom SKU kita alihkan: cuma pindah fokus ke kolom berikutnya,
  // sekalian cek apakah SKU sudah pernah dipakai.
  // Cek SKU terhadap master data yang sudah ada, lalu pindah fokus ke kolom nama.
  // Dipakai baik oleh scanner USB/Bluetooth (lewat Enter) maupun scan kamera.
  const applyScannedSku = (code) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setFormData((prev) => ({ ...prev, id: trimmed }));
    if (trimmed && inventory.some((item) => item.id.toLowerCase() === trimmed.toLowerCase())) {
      setDuplicateWarning(`SKU "${trimmed}" sudah terdaftar di master data.`);
    } else {
      setDuplicateWarning('');
    }
    nameInputRef.current?.focus();
  };

  const handleSkuKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    applyScannedSku(e.target.value);
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesPurpose = filterPurpose === 'All' || item.purpose === filterPurpose;
    return matchesSearch && matchesCategory && matchesPurpose;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ id: '', name: '', category: 'Drone', purpose: 'Jual', minStock: 5, location: '' });
    setDuplicateWarning('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingItem) {
      await onEdit(editingItem.id, { ...formData, minStock: parseInt(formData.minStock) });
    } else {
      await onAdd({ ...formData, minStock: parseInt(formData.minStock) });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full relative">
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari SKU atau nama barang..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <CameraScanButton onScan={(code) => setSearchTerm(code)} title="Cari pakai scan kamera" modalTitle="Scan Barcode — Cari Barang" />
          </div>
          <select
            className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">Semua Kategori</option>
            <option value="Drone">Drone</option>
            <option value="Sparepart">Sparepart</option>
            <option value="Baterai">Baterai</option>
            <option value="Aksesoris">Aksesoris</option>
          </select>
          <select
            className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500"
            value={filterPurpose}
            onChange={(e) => setFilterPurpose(e.target.value)}
          >
            <option value="All">Semua Peruntukan</option>
            <option value="Jual">Stok Jual</option>
            <option value="Demo-Project">Stok Demo/Project</option>
          </select>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Master Data
          </button>
        )}
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-medium">SKU</th>
              <th className="px-6 py-4 font-medium">Nama Barang</th>
              <th className="px-6 py-4 font-medium">Kategori</th>
              <th className="px-6 py-4 font-medium">Peruntukan</th>
              <th className="px-6 py-4 font-medium">Lokasi</th>
              <th className="px-6 py-4 font-medium text-center">Stok</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              {canEdit && <th className="px-6 py-4 font-medium text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-700">{item.id}</td>
                <td className="px-6 py-4 text-gray-800">{item.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">{item.category}</span>
                </td>
                <td className="px-6 py-4">
                  {item.purpose === 'Demo-Project' ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Demo/Project</span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Jual</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.location}</td>
                <td className="px-6 py-4 text-center font-bold text-gray-800">{item.stock}</td>
                <td className="px-6 py-4 text-center">
                  {item.stock > item.minStock ? (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Aman</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Low</span>
                  )}
                </td>
                {canEdit && (
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                  Tidak ada barang yang cocok dengan pencarian Anda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canEdit && isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-lg">
                {editingItem ? 'Edit Master Data' : 'Tambah Master Data Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  SKU Barang * <ScanBarcode className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={skuInputRef}
                    required
                    type="text"
                    autoComplete="off"
                    disabled={!!editingItem}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm disabled:bg-gray-100"
                    value={formData.id}
                    onChange={(e) => {
                      setFormData({ ...formData, id: e.target.value });
                      if (duplicateWarning) setDuplicateWarning('');
                    }}
                    onKeyDown={handleSkuKeyDown}
                    placeholder="Contoh: GTI-DRN-005 — arahkan scanner ke sini atau ketik manual"
                  />
                  {!editingItem && <CameraScanButton onScan={applyScannedSku} modalTitle="Scan Barcode — SKU Baru" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">Bisa discan langsung pakai barcode scanner (USB/Bluetooth) atau diketik manual.</p>
                {duplicateWarning && <p className="text-red-500 text-xs mt-1">{duplicateWarning}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang *</label>
                <input
                  ref={nameInputRef}
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Drone">Drone</option>
                    <option value="Sparepart">Sparepart</option>
                    <option value="Baterai">Baterai</option>
                    <option value="Aksesoris">Aksesoris</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peruntukan *</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  >
                    <option value="Jual">Stok Jual</option>
                    <option value="Demo-Project">Stok Demo/Project</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Minimum *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Rak</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Contoh: A-01-01"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
