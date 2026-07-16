import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api';

export default function SettingsView({ user }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Password baru dan konfirmasi tidak cocok.' });
      return;
    }
    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Password baru minimal 8 karakter.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.changePassword(oldPassword, newPassword);
      setStatus({ type: 'success', message: res.message || 'Password berhasil diganti.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Gagal mengganti password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-lg">Pengaturan Sistem</h3>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Profil Gudang</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nama Perusahaan</label>
              <input
                type="text"
                disabled
                value="PT. General Technology Indonesia"
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lokasi Gudang</label>
              <input
                type="text"
                disabled
                value="Gudang Utama - Jakarta Selatan"
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-600"
              />
            </div>
          </div>
        </div>
        <hr className="border-gray-100" />
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Akun Anda</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nama</label>
              <input
                type="text"
                disabled
                value={user?.full_name || '-'}
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <input
                type="text"
                disabled
                value={
                  user?.role === 'admin_gudang'
                    ? 'Admin Gudang'
                    : user?.role === 'staff'
                    ? 'Staff'
                    : 'Manajer'
                }
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-600"
              />
            </div>
          </div>
        </div>
        <hr className="border-gray-100" />
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Ganti Password</h4>
          <form onSubmit={handleChangePassword} className="max-w-md space-y-3">
            {status && (
              <div
                className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${
                  status.type === 'success'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : 'text-red-600 bg-red-50 border-red-100'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {status.message}
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password Lama</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password Baru (min. 8 karakter)</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : 'Ganti Password'}
            </button>
          </form>
        </div>
        <hr className="border-gray-100" />
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Database & Storage</h4>
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Sistem terhubung ke database MySQL. Semua perubahan tersimpan permanen.
          </div>
        </div>
      </div>
    </div>
  );
}
