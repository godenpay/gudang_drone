import React from 'react';

export default function HistoryView({ transactions }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-lg">Semua Riwayat Transaksi</h3>
        <p className="text-sm text-gray-500 mt-1">Catatan histori seluruh barang masuk dan keluar di gudang.</p>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 sticky top-0">
            <tr>
              <th className="px-6 py-4 font-medium">ID Transaksi</th>
              <th className="px-6 py-4 font-medium">Tipe</th>
              <th className="px-6 py-4 font-medium">SKU / Item</th>
              <th className="px-6 py-4 font-medium">Kuantitas</th>
              <th className="px-6 py-4 font-medium">Waktu Transaksi</th>
              <th className="px-6 py-4 font-medium">Oleh</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((trx, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-700">{trx.id}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      trx.type === 'INBOUND' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {trx.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-800">{trx.item}</td>
                <td className="px-6 py-4 font-bold text-gray-700">{trx.qty}</td>
                <td className="px-6 py-4 text-gray-500">{trx.date}</td>
                <td className="px-6 py-4 text-gray-500">{trx.createdBy || '-'}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">{trx.status}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
