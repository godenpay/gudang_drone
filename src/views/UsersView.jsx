import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, X, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

const MENU_OPTIONS = [
  { key: 'inbound', label: 'Barang Masuk (Inbound)' },
  { key: 'outbound', label: 'Barang Keluar (Outbound)' },
  { key: 'loans', label: 'Peminjaman Demo (buat & kembalikan)' },
  { key: 'inventory_manage', label: 'Kelola Master Data Inventaris (tambah/edit/hapus item)' },
];

const ROLE_META = {
  admin_gudang: { label: 'Admin Gudang', className: 'text-blue-700 bg-blue-50 border border-blue-100', icon: true },
  manajer: { label: 'Manajer', className: 'text-gray-600 bg-gray-100' },
  staff: { label: 'Staff', className: 'text-emerald-700 bg-emerald-50 border border-emerald-100' },
};

const emptyForm = {
  username: '',
  password: '',
  full_name: '',
  role: 'manajer',
  permissions: [],
};

export default function UsersView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = mode tambah
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await api.getUsers();
      setUsers(res.data);
    } catch (err) {
      setLoadError(err.message || 'Gagal memuat daftar user.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      password: '',
      full_name: u.full_name,
      role: u.role,
      permissions: u.permissions || [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const togglePermission = (key) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!editingUser && formData.username.trim().length < 3) {
      setFormError('Username minimal 3 karakter.');
      return;
    }
    if (!editingUser && formData.password.length < 8) {
      setFormError('Password minimal 8 karakter.');
      return;
    }
    if (formData.full_name.trim() === '') {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          full_name: formData.full_name,
          role: formData.role,
          permissions: formData.permissions,
          new_password: formData.password || undefined,
        });
      } else {
        await api.createUser({
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          permissions: formData.permissions,
        });
      }
      await loadUsers();
      closeModal();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Yakin ingin menghapus user "${u.full_name}" (${u.username})?`)) return;
    try {
      await api.deleteUser(u.id);
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">Manajemen User</h3>
          <p className="text-sm text-gray-500">Tambah akun baru dan atur menu apa saja yang boleh diakses.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading && <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>}

        {!isLoading && loadError && (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600 mb-3">{loadError}</p>
            <button onClick={loadUsers} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              Coba Lagi
            </button>
          </div>
        )}

        {!isLoading && !loadError && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3">Nama</th>
                <th className="text-left px-6 py-3">Username</th>
                <th className="text-left px-6 py-3">Role</th>
                <th className="text-left px-6 py-3">Akses Menu</th>
                <th className="text-right px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60">
                  <td className="px-6 py-3 font-medium text-gray-800">{u.full_name}</td>
                  <td className="px-6 py-3 text-gray-500">{u.username}</td>
                  <td className="px-6 py-3">
                    {(() => {
                      const meta = ROLE_META[u.role] || { label: u.role, className: 'text-gray-600 bg-gray-100' };
                      return (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${meta.className}`}>
                          {meta.icon && <ShieldCheck className="w-3 h-3" />} {meta.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-3">
                    {u.role === 'admin_gudang' ? (
                      <span className="text-xs text-gray-400">Akses penuh</span>
                    ) : (u.permissions || []).length === 0 ? (
                      <span className="text-xs text-gray-400">Dashboard, Inventaris, Riwayat saja</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.permissions.map((p) => (
                          <span key={p} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                            {MENU_OPTIONS.find((m) => m.key === p)?.label.split(' (')[0] || p}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(u)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser?.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        title={u.id === currentUser?.id ? 'Tidak bisa menghapus akun sendiri' : 'Hapus'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h4 className="font-semibold text-gray-800">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h4>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-sm p-3 rounded-lg border text-red-600 bg-red-50 border-red-100">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Username</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="mis. budi.santoso"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {editingUser ? 'Reset Password (kosongkan jika tidak diubah)' : 'Password (min. 8 karakter)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="manajer">Manajer</option>
                  <option value="staff">Staff</option>
                  <option value="admin_gudang">Admin Gudang</option>
                </select>
              </div>

              {formData.role === 'admin_gudang' ? (
                <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  Admin Gudang otomatis mendapat akses penuh ke semua menu, termasuk Manajemen User.
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Akses Menu Tambahan (Dashboard, Inventaris read-only, & Riwayat selalu terbuka)
                  </label>
                  <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                    {MENU_OPTIONS.map((m) => (
                      <label key={m.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(m.key)}
                          onChange={() => togglePermission(m.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
