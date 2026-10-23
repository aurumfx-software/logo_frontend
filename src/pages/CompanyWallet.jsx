import React, { useState, useEffect } from 'react';
import {
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineGift,
  HiOutlineShoppingBag,
  HiOutlineCheckCircle,
  HiOutlineCash,
  HiOutlinePlusCircle,
  HiOutlineX,
} from 'react-icons/hi';
import { fetchCompanyWalletOverview, adminAdjustWallet } from '../api/walletApi';

export default function CompanyWallet() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Adjust Wallet Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({
    user_id: '',
    operation: 'credit',
    amount: '',
    note: '',
  });
  const [adjusting, setAdjusting] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchCompanyWalletOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load company wallet overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustData.user_id || !adjustData.amount || Number(adjustData.amount) <= 0) {
      alert('Please enter valid user ID and positive amount');
      return;
    }
    setAdjusting(true);
    setError('');
    setSuccess('');
    try {
      await adminAdjustWallet({
        user_id: Number(adjustData.user_id),
        operation: adjustData.operation,
        amount: Number(adjustData.amount),
        note: adjustData.note || 'Admin Manual Adjustment',
      });
      setSuccess(`Wallet ${adjustData.operation} of ₹${adjustData.amount} for user #${adjustData.user_id} completed successfully!`);
      setShowAdjustModal(false);
      setAdjustData({ user_id: '', operation: 'credit', amount: '', note: '' });
      await loadOverview();
    } catch (err) {
      alert(err.message || 'Failed to adjust wallet');
    } finally {
      setAdjusting(false);
    }
  };

  const balance = data?.balance !== undefined ? Number(data.balance).toFixed(2) : '0.00';
  const totalRevenue = data?.total_platform_revenue !== undefined ? Number(data.total_platform_revenue).toFixed(2) : '0.00';
  const totalSales = data?.total_sales_volume !== undefined ? Number(data.total_sales_volume).toFixed(2) : '0.00';
  const totalCashback = data?.total_cashback_distributed !== undefined ? Number(data.total_cashback_distributed).toFixed(2) : '0.00';
  const totalRedemptions = data?.total_redemptions_count || 0;
  const transactions = data?.recent_transactions || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HiOutlineCreditCard className="w-7 h-7 text-emerald-600" />
            Company Platform Wallet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time 2% platform commission ledger from QR code transactions across Kerala
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadOverview}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            Adjust User Wallet
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-8 shadow-2xl border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Company Main Revenue Account
            </div>
            <div className="text-sm font-medium text-slate-400">Total Company Wallet Balance</div>
            <div className="text-5xl font-black tracking-tight text-white mt-1 flex items-baseline gap-1">
              <span className="text-emerald-400 text-3xl font-bold">₹</span>
              {balance}
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-md">
              Automatically credited in real-time with the 2% company platform fee whenever a customer redeems a sale QR code at any shop.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 min-w-[240px]">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
              3-Way Split Summary
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Customer Cashback:</span>
                <span className="font-bold text-emerald-400">3.00%</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Platform Fee (Company):</span>
                <span className="font-bold text-amber-400">2.00%</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-white/10">
                <span>Total Shop Deduction:</span>
                <span className="font-bold text-white">5.00%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            <HiOutlineTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Platform Revenue</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">₹{totalRevenue}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">2% Platform Fee</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            <HiOutlineGift className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cashback Distributed</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">₹{totalCashback}</div>
            <div className="text-xs text-blue-600 font-semibold mt-0.5">Paid to Customers</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
            <HiOutlineShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales Volume</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">₹{totalSales}</div>
            <div className="text-xs text-purple-600 font-semibold mt-0.5">Processed Bills</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">QR Redemptions</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalRedemptions}</div>
            <div className="text-xs text-amber-600 font-semibold mt-0.5">Successful Claims</div>
          </div>
        </div>
      </div>

      {/* Ledger Feed / Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">Platform Ledger & Fee Transactions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time incoming platform commission credits</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {transactions.length} Transactions
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <HiOutlineCash className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold">No platform revenue transactions yet.</p>
            <p className="text-xs text-slate-400 mt-1">When a customer scans a merchant Sale QR, 2% company fee will appear here instantly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Store / Source</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6 text-right">Commission Credit (2%)</th>
                  <th className="py-3.5 px-6 text-right">Balance After</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                      {t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {t.merchant_name || 'Verified Store'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-md">
                      {t.note || t.description || '2.00% Platform Fee'}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600">
                      +₹{Number(t.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-xs font-bold text-slate-700">
                      {t.balance_after !== null ? `₹${Number(t.balance_after).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        CREDITED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust User Wallet Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAdjustModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900">Adjust User / Merchant Wallet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Directly credit or debit a user or store wallet with audited ledger recording.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target User ID:
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15, 95, 102"
                  value={adjustData.user_id}
                  onChange={(e) => setAdjustData({ ...adjustData, user_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Operation:
                </label>
                <select
                  value={adjustData.operation}
                  onChange={(e) => setAdjustData({ ...adjustData, operation: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="credit">Credit (+) Fund Wallet</option>
                  <option value="debit">Debit (-) Deduct Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Amount (₹):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={adjustData.amount}
                  onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason / Note:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Initial Merchant Funding / Promotional Credit"
                  value={adjustData.note}
                  onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20"
                >
                  {adjusting ? 'Processing...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
