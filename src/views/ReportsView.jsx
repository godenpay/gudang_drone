import React, { useState, useMemo } from 'react';
import { Download, Info, ArrowDownToLine, ArrowUpFromLine, HandHelping } from 'lucide-react';

function inRange(dateStr, from, to) {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (from && d < new Date(from)) return false;
  if (to) {
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    if (d > toEnd) return false;
  }
  return true;
}

function exportCsv(filename, rows, columns) {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = c.get(row);
          return `"${String(val ?? '-').replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, colorClass }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
      <h3 className={`text-2xl font-bold ${colorClass || 'text-gray-800'}`}>{value}</h3>
    </div>
  );
}

function ReportToolbar({ from, to, setFrom, setTo, search, setSearch, searchPlaceholder, onExport, exportDisabled }) {
  return (
    <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Cari</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500 w-56"
          />
        </div>
      </div>
      <button
        onClick={onExport}
        disabled={exportDisabled}
        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-fit"
      >
        <Download className="w-4 h-4" /> Export CSV
      </button>
    </div>
  );
}

function ReportInbound({ transactions }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  const rows = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'INBOUND')
        .filter((t) => inRange(t.date, from, to))
        .filter((t) => {
          const q = search.toLowerCase();
          if (!q) return true;
          return (
            (t.item || '').toLowerCase().includes(q) ||
            (t.item_id || '').toLowerCase().includes(q) ||
            (t.supplier || '').toLowerCase().includes(q) ||
            (t.poNumber || '').toLowerCase().includes(q)
          );
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, from, to, search]
  );

  const totalQty = rows.reduce((sum, r) => sum + Number(r.qty || 0), 0);
  const skuCount = new Set(rows.map((r) => r.item_id)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Transaksi Masuk" value={rows.length} colorClass="text-emerald-600" />
        <StatCard label="Total Unit Masuk" value={totalQty} colorClass="text-emerald-600" />
        <StatCard label="Jumlah SKU Terlibat" value={skuCount} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <ReportToolbar
          from={from}
          to={to}
          setFrom={setFrom}
          setTo={setTo}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari SKU, nama barang, supplier, no. PO..."
          exportDisabled={rows.length === 0}
          onExport={() =>
            exportCsv(`laporan-barang-masuk-${from || 'awal'}_${to || 'akhir'}.csv`, rows, [
              { label: 'ID Transaksi', get: (r) => r.id },
              { label: 'Tanggal', get: (r) => r.date },
              { label: 'SKU', get: (r) => r.item_id },
              { label: 'Nama Barang', get: (r) => r.item },
              { label: 'Qty Masuk', get: (r) => r.qty },
              { label: 'Supplier', get: (r) => r.supplier },
              { label: 'No. PO', get: (r) => r.poNumber },
              { label: 'Status', get: (r) => r.status },
              { label: 'Dicatat Oleh', get: (r) => r.createdBy },
            ])
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">ID Transaksi</th>
                <th className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Nama Barang</th>
                <th className="px-6 py-3 font-medium text-center">Qty Masuk</th>
                <th className="px-6 py-3 font-medium">Supplier</th>
                <th className="px-6 py-3 font-medium">No. PO</th>
                <th className="px-6 py-3 font-medium">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                  <td className="px-6 py-3 text-gray-500">{r.date}</td>
                  <td className="px-6 py-3 font-medium text-gray-700">{r.item_id}</td>
                  <td className="px-6 py-3">{r.item}</td>
                  <td className="px-6 py-3 text-center font-bold text-emerald-700">+{r.qty}</td>
                  <td className="px-6 py-3">{r.supplier || '-'}</td>
                  <td className="px-6 py-3">{r.poNumber || '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{r.createdBy || '-'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data barang masuk pada rentang/filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportOutbound({ transactions }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  const rows = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'OUTBOUND')
        .filter((t) => inRange(t.date, from, to))
        .filter((t) => {
          const q = search.toLowerCase();
          if (!q) return true;
          return (
            (t.item || '').toLowerCase().includes(q) ||
            (t.item_id || '').toLowerCase().includes(q) ||
            (t.destination || '').toLowerCase().includes(q)
          );
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, from, to, search]
  );

  const totalQty = rows.reduce((sum, r) => sum + Number(r.qty || 0), 0);
  const skuCount = new Set(rows.map((r) => r.item_id)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Transaksi Keluar" value={rows.length} colorClass="text-orange-600" />
        <StatCard label="Total Unit Keluar" value={totalQty} colorClass="text-orange-600" />
        <StatCard label="Jumlah SKU Terlibat" value={skuCount} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <ReportToolbar
          from={from}
          to={to}
          setFrom={setFrom}
          setTo={setTo}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari SKU, nama barang, tujuan..."
          exportDisabled={rows.length === 0}
          onExport={() =>
            exportCsv(`laporan-barang-keluar-${from || 'awal'}_${to || 'akhir'}.csv`, rows, [
              { label: 'ID Transaksi', get: (r) => r.id },
              { label: 'Tanggal', get: (r) => r.date },
              { label: 'SKU', get: (r) => r.item_id },
              { label: 'Nama Barang', get: (r) => r.item },
              { label: 'Qty Keluar', get: (r) => r.qty },
              { label: 'Tujuan/Pelanggan', get: (r) => r.destination },
              { label: 'Status', get: (r) => r.status },
              { label: 'Dicatat Oleh', get: (r) => r.createdBy },
            ])
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">ID Transaksi</th>
                <th className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Nama Barang</th>
                <th className="px-6 py-3 font-medium text-center">Qty Keluar</th>
                <th className="px-6 py-3 font-medium">Tujuan/Pelanggan</th>
                <th className="px-6 py-3 font-medium">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                  <td className="px-6 py-3 text-gray-500">{r.date}</td>
                  <td className="px-6 py-3 font-medium text-gray-700">{r.item_id}</td>
                  <td className="px-6 py-3">{r.item}</td>
                  <td className="px-6 py-3 text-center font-bold text-orange-700">-{r.qty}</td>
                  <td className="px-6 py-3">{r.destination || '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{r.createdBy || '-'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data barang keluar pada rentang/filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportLoans({ loans }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');

  const rows = useMemo(
    () =>
      loans
        .filter((l) => inRange(l.loan_date, from, to))
        .filter((l) => status === 'All' || l.status === status)
        .filter((l) => {
          const q = search.toLowerCase();
          if (!q) return true;
          return (
            (l.item_name || '').toLowerCase().includes(q) ||
            (l.item_id || '').toLowerCase().includes(q) ||
            (l.borrower_name || '').toLowerCase().includes(q) ||
            (l.project_name || '').toLowerCase().includes(q)
          );
        })
        .sort((a, b) => new Date(b.loan_date) - new Date(a.loan_date)),
    [loans, from, to, search, status]
  );

  const dipinjam = rows.filter((r) => r.status === 'Dipinjam').length;
  const dikembalikan = rows.filter((r) => r.status === 'Dikembalikan').length;
  const terlambat = rows.filter((r) => r.status === 'Terlambat').length;

  const statusBadge = (s) => {
    const cls = {
      Dipinjam: 'bg-amber-100 text-amber-700',
      Dikembalikan: 'bg-emerald-100 text-emerald-700',
      Terlambat: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Sedang Dipinjam" value={dipinjam} colorClass="text-amber-600" />
        <StatCard label="Sudah Dikembalikan" value={dikembalikan} colorClass="text-emerald-600" />
        <StatCard label="Terlambat" value={terlambat} colorClass="text-red-600" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tgl Pinjam</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tgl Pinjam</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500"
              >
                <option value="All">Semua Status</option>
                <option value="Dipinjam">Dipinjam</option>
                <option value="Dikembalikan">Dikembalikan</option>
                <option value="Terlambat">Terlambat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cari</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari drone, peminjam, project..."
                className="border border-gray-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500 w-56"
              />
            </div>
          </div>
          <button
            onClick={() =>
              exportCsv(`laporan-peminjaman-${from || 'awal'}_${to || 'akhir'}.csv`, rows, [
                { label: 'ID Peminjaman', get: (r) => r.id },
                { label: 'SKU', get: (r) => r.item_id },
                { label: 'Nama Drone', get: (r) => r.item_name },
                { label: 'Qty', get: (r) => r.qty },
                { label: 'Peminjam', get: (r) => r.borrower_name },
                { label: 'Project', get: (r) => r.project_name },
                { label: 'Tgl Pinjam', get: (r) => r.loan_date },
                { label: 'Target Kembali', get: (r) => r.expected_return_date },
                { label: 'Tgl Kembali Aktual', get: (r) => r.actual_return_date },
                { label: 'Status', get: (r) => r.status },
                { label: 'Catatan Kondisi', get: (r) => r.condition_note },
              ])
            }
            disabled={rows.length === 0}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-fit"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
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
                <th className="px-6 py-3 font-medium">Tgl Pinjam</th>
                <th className="px-6 py-3 font-medium">Target Kembali</th>
                <th className="px-6 py-3 font-medium">Tgl Kembali Aktual</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                  <td className="px-6 py-3">{r.item_name}</td>
                  <td className="px-6 py-3 text-center font-medium">{r.qty}</td>
                  <td className="px-6 py-3">{r.borrower_name}</td>
                  <td className="px-6 py-3">{r.project_name}</td>
                  <td className="px-6 py-3 text-gray-500">{r.loan_date}</td>
                  <td className="px-6 py-3 text-gray-500">{r.expected_return_date}</td>
                  <td className="px-6 py-3 text-gray-500">{r.actual_return_date || '-'}</td>
                  <td className="px-6 py-3 text-center">{statusBadge(r.status)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data peminjaman pada rentang/filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ReportsView({ transactions, loans }) {
  const [tab, setTab] = useState('inbound');
  const tabs = [
    { key: 'inbound', label: 'Stok Barang Masuk', icon: <ArrowDownToLine className="w-4 h-4" /> },
    { key: 'outbound', label: 'Stok Barang Keluar', icon: <ArrowUpFromLine className="w-4 h-4" /> },
    { key: 'loans', label: 'Peminjaman & Pengembalian', icon: <HandHelping className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <div className="ml-auto hidden sm:flex items-center gap-2 px-3 text-xs text-gray-400">
          <Info className="w-4 h-4" /> Pilih laporan, atur filter, lalu export bila perlu.
        </div>
      </div>
      {tab === 'inbound' && <ReportInbound transactions={transactions} />}
      {tab === 'outbound' && <ReportOutbound transactions={transactions} />}
      {tab === 'loans' && <ReportLoans loans={loans} />}
    </div>
  );
}
