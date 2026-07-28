import React from 'react';
import { Package, LayoutDashboard, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DashboardView({ inventory, transactions, onViewHistory }) {
  const totalItems = inventory.reduce((sum, item) => sum + Number(item.stock), 0);
  const totalSKUs = inventory.length;
  const lowStockItems = inventory.filter((i) => Number(i.stock) <= Number(i.minStock)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg mr-4">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Unit di Gudang</p>
            <h3 className="text-3xl font-bold text-gray-800">{totalItems}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg mr-4">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Varian SKU</p>
            <h3 className="text-3xl font-bold text-gray-800">{totalSKUs}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mr-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Peringatan Stok Rendah</p>
            <h3 className="text-3xl font-bold text-gray-800">{lowStockItems}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Aktivitas Terakhir</h3>
            <button onClick={onViewHistory} className="text-blue-600 text-sm font-medium hover:underline">
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">ID Transaksi</th>
                  <th className="px-5 py-3 font-medium">Tipe</th>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Qty</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.slice(0, 5).map((trx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-700">{trx.id}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          trx.type === 'INBOUND' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {trx.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{trx.item}</td>
                    <td className="px-5 py-4 font-semibold text-gray-700">{trx.qty}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{trx.date}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-gray-400">
                      Belum ada transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Perlu Restock (Defisit)</h3>
          </div>
          <div className="p-5 flex-1 overflow-auto space-y-4">
            {inventory
              .filter((i) => i.stock <= i.minStock)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <h4 className="font-medium text-red-900 text-sm">{item.name}</h4>
                    <p className="text-xs text-red-600 mt-1">SKU: {item.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-red-700 text-lg">{item.stock}</span>
                    <span className="text-[10px] text-red-500 uppercase font-semibold">Sisa</span>
                  </div>
                </div>
              ))}
            {inventory.filter((i) => i.stock <= i.minStock).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Semua stok dalam kondisi aman.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
