import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  Search,
  Bell,
  Menu,
  History,
  LogOut,
  HandHelping,
  Users,
  FileBarChart,
  AlertTriangle,
  PackageX,
  Clock,
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';
import Login from './components/Login';
import NavItem from './components/NavItem';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import InboundView from './views/InboundView';
import OutboundView from './views/OutboundView';
import HistoryView from './views/HistoryView';
import SettingsView from './views/SettingsView';
import LoanView from './views/LoanView';
import UsersView from './views/UsersView';
import ReportsView from './views/ReportsView';

function Shell() {
  const { user, logout } = useAuth();
  const isAdminGudang = user?.role === 'admin_gudang';
  const roleLabel =
    user?.role === 'admin_gudang' ? 'Admin Gudang' : user?.role === 'staff' ? 'Staff' : 'Manajer';
  // Admin selalu punya akses penuh; user lain dicek dari daftar permission
  // yang di-set admin lewat Manajemen User (tersimpan di DB, bukan hardcode role lagi).
  const can = (menuKey) => isAdminGudang || (user?.permissions || []).includes(menuKey);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [invRes, trxRes, loanRes] = await Promise.all([api.getInventory(), api.getTransactions(), api.getLoans()]);
      setInventory(invRes.data);
      setTransactions(trxRes.data);
      setLoans(loanRes.data);
    } catch (err) {
      setLoadError(err.message || 'Gagal memuat data dari server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Notifikasi lonceng: stok rendah/habis + pinjaman terlambat/jatuh tempo dekat ---
  const [isNotifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock);

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 3);

  const overdueLoans = loans.filter((l) => l.status === 'Terlambat');
  const dueSoonLoans = loans.filter((l) => {
    if (l.status !== 'Dipinjam') return false;
    const due = new Date(l.expected_return_date);
    return due >= now && due <= soon;
  });

  const notifications = [
    ...lowStockItems.map((item) => ({
      id: `stock-${item.id}`,
      icon: item.stock === 0 ? PackageX : AlertTriangle,
      color: item.stock === 0 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50',
      title: item.stock === 0 ? `${item.name} habis` : `Stok ${item.name} menipis`,
      desc: `Sisa ${item.stock} unit (batas minimum ${item.minStock})`,
      onClick: () => setActiveTab('inventory'),
    })),
    ...overdueLoans.map((l) => ({
      id: `overdue-${l.id}`,
      icon: Clock,
      color: 'text-red-600 bg-red-50',
      title: `Pinjaman "${l.item_name}" terlambat`,
      desc: `Peminjam: ${l.borrower_name} • jatuh tempo ${l.expected_return_date}`,
      onClick: () => setActiveTab('loans'),
    })),
    ...dueSoonLoans.map((l) => ({
      id: `duesoon-${l.id}`,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
      title: `Pinjaman "${l.item_name}" segera jatuh tempo`,
      desc: `Peminjam: ${l.borrower_name} • jatuh tempo ${l.expected_return_date}`,
      onClick: () => setActiveTab('loans'),
    })),
  ];

  // Jika user mencoba akses tab yang tidak diizinkan (mis. lewat state lama, atau
  // permission-nya baru saja dicabut admin), redirect ke dashboard.
  useEffect(() => {
    if (activeTab === 'inbound' && !can('inbound')) setActiveTab('dashboard');
    if (activeTab === 'outbound' && !can('outbound')) setActiveTab('dashboard');
    if (activeTab === 'users' && !isAdminGudang) setActiveTab('dashboard');
    if (activeTab === 'reports' && !isAdminGudang) setActiveTab('dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  const handleAddMasterData = async (newItem) => {
    try {
      await api.createInventory(newItem);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditMasterData = async (id, updatedItem) => {
    try {
      await api.updateInventory(id, updatedItem);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMasterData = async (id) => {
    if (!window.confirm('Yakin ingin menghapus item ini dari master data?')) return;
    try {
      await api.deleteInventory(id);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleInbound = async (payload) => {
    try {
      const res = await api.inbound(payload);
      await loadData();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOutbound = async (payload) => {
    try {
      const res = await api.outbound(payload);
      await loadData();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateLoan = async (payload) => {
    try {
      const res = await api.createLoan(payload);
      await loadData();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveTrx = async (id) => {
    try {
      const res = await api.approveTransaction(id);
      await loadData();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectTrx = async (id) => {
    if (!window.confirm('Tolak permintaan outbound ini?')) return;
    try {
      const res = await api.rejectTransaction(id);
      await loadData();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveLoan = async (id) => {
    try {
      const res = await api.approveLoan(id);
      await loadData();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectLoan = async (id) => {
    if (!window.confirm('Tolak permintaan peminjaman ini?')) return;
    try {
      const res = await api.rejectLoan(id);
      await loadData();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReturnLoan = async (id, payload) => {
    if (!window.confirm('Konfirmasi pengembalian unit ini ke stok demo?')) return;
    try {
      const res = await api.returnLoan(id, payload);
      await loadData();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const titles = {
    dashboard: 'Dasbor Gudang Utama',
    inventory: 'Manajemen Inventaris',
    inbound: 'Penerimaan Barang (Inbound)',
    outbound: 'Pengeluaran Barang (Outbound)',
    loans: 'Peminjaman Drone Demo/Project',
    history: 'Riwayat Transaksi',
    settings: 'Pengaturan Sistem',
    users: 'Manajemen User',
    reports: 'Laporan',
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-slate-900 text-white flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className={`flex items-center overflow-hidden whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm">PT. GENERAL TECH</h1>
              <p className="text-xs text-slate-400">WMS System</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-2 px-3">
          <NavItem icon={<LayoutDashboard />} label="Dasbor" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isOpen={isSidebarOpen} />
          <NavItem icon={<Package />} label="Inventaris" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} isOpen={isSidebarOpen} />
          {can('inbound') && (
            <NavItem icon={<ArrowDownToLine />} label="Barang Masuk" active={activeTab === 'inbound'} onClick={() => setActiveTab('inbound')} isOpen={isSidebarOpen} />
          )}
          {can('outbound') && (
            <NavItem icon={<ArrowUpFromLine />} label="Barang Keluar" active={activeTab === 'outbound'} onClick={() => setActiveTab('outbound')} isOpen={isSidebarOpen} />
          )}
          <NavItem icon={<HandHelping />} label="Peminjaman Demo" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} isOpen={isSidebarOpen} />
          <NavItem icon={<History />} label="Riwayat Transaksi" active={activeTab === 'history'} onClick={() => setActiveTab('history')} isOpen={isSidebarOpen} />
          {isAdminGudang && (
            <NavItem icon={<FileBarChart />} label="Laporan" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} isOpen={isSidebarOpen} />
          )}
        </nav>

        <div className="p-3 border-t border-slate-800 flex flex-col gap-2">
          {isAdminGudang && (
            <NavItem icon={<Users />} label="Manajemen User" active={activeTab === 'users'} onClick={() => setActiveTab('users')} isOpen={isSidebarOpen} />
          )}
          <NavItem icon={<Settings />} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isOpen={isSidebarOpen} />
          <NavItem icon={<LogOut />} label="Keluar" active={false} onClick={logout} isOpen={isSidebarOpen} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">{titles[activeTab]}</h2>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari SKU / Item..."
                className="pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none w-64 transition-all"
              />
            </div>
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="p-2 text-gray-400 hover:text-gray-600 relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">
                    Notifikasi {notifications.length > 0 && `(${notifications.length})`}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">Tidak ada notifikasi baru.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((n) => {
                        const Icon = n.icon;
                        return (
                          <button
                            key={n.id}
                            onClick={() => {
                              n.onClick();
                              setNotifOpen(false);
                            }}
                            className="w-full text-left p-3 flex gap-3 hover:bg-gray-50"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{n.title}</p>
                              <p className="text-xs text-gray-500 truncate">{n.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {(user?.full_name || '?').charAt(0)}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-400">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
          {isLoading && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Memuat data...</div>
          )}

          {!isLoading && loadError && (
            <div className="max-w-lg mx-auto bg-red-50 border border-red-100 text-red-700 rounded-xl p-6 text-center">
              <p className="font-medium mb-2">Gagal memuat data</p>
              <p className="text-sm mb-4">{loadError}</p>
              <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                Coba Lagi
              </button>
            </div>
          )}

          {!isLoading && !loadError && (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView inventory={inventory} transactions={transactions} onViewHistory={() => setActiveTab('history')} />
              )}
              {activeTab === 'inventory' && (
                <InventoryView
                  inventory={inventory}
                  onAdd={handleAddMasterData}
                  onEdit={handleEditMasterData}
                  onDelete={handleDeleteMasterData}
                  canEdit={can('inventory_manage')}
                />
              )}
              {activeTab === 'inbound' && can('inbound') && <InboundView inventory={inventory} onSubmit={handleInbound} />}
              {activeTab === 'outbound' && can('outbound') && <OutboundView inventory={inventory} onSubmit={handleOutbound} />}
              {activeTab === 'loans' && (
                <LoanView
                  inventory={inventory}
                  loans={loans}
                  onCreateLoan={handleCreateLoan}
                  onReturnLoan={handleReturnLoan}
                  onApproveLoan={handleApproveLoan}
                  onRejectLoan={handleRejectLoan}
                  canManage={can('loans')}
                  isAdminGudang={isAdminGudang}
                />
              )}
              {activeTab === 'history' && (
                <HistoryView
                  transactions={transactions}
                  onApprove={handleApproveTrx}
                  onReject={handleRejectTrx}
                  isAdminGudang={isAdminGudang}
                />
              )}
              {activeTab === 'settings' && <SettingsView user={user} />}
              {activeTab === 'users' && isAdminGudang && <UsersView currentUser={user} />}
              {activeTab === 'reports' && isAdminGudang && <ReportsView transactions={transactions} loans={loans} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>;
  }

  return user ? <Shell /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
