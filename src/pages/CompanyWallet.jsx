import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineGift,
  HiOutlineShoppingBag,
  HiOutlineCheckCircle,
  HiOutlineCash,
  HiOutlinePlusCircle,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatsCard from '../components/UI/StatsCard';
import Modal from '../components/UI/Modal';
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
      console.error('Wallet overview load error:', err);
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
  const transactions = Array.isArray(data?.recent_transactions) ? data.recent_transactions : [];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 40 }}>
      {/* Top Header */}
      <PageHeader
        title="Platform Wallet"
        subtitle="Real-time 2% platform commission ledger from QR code transactions across Kerala"
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={loadOverview}
            disabled={loading}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineRefresh className={loading ? 'animate-spin' : ''} style={{ fontSize: 16 }} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlinePlusCircle style={{ fontSize: 18 }} />
            <span>Adjust User Wallet</span>
          </button>
        </div>
      </PageHeader>

      {/* Notifications */}
      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: '#FEE2E2',
            borderLeft: '4px solid #EF4444',
            borderRadius: 8,
            color: '#B91C1C',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: '#D1FAE5',
            borderLeft: '4px solid #10B981',
            borderRadius: 8,
            color: '#065F46',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {success}
        </div>
      )}

      {/* Hero Balance Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2A2A42 55%, #16162A 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: '0 12px 32px rgba(26, 26, 46, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108, 99, 255, 0.35) 0%, rgba(108, 99, 255, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 24,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34D399',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              Company Main Revenue Account
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>
              Total Company Platform Wallet Balance
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-1px',
                marginTop: 4,
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 28, color: '#34D399', fontWeight: 700 }}>₹</span>
              {balance}
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, maxWidth: 440, lineHeight: 1.5 }}>
              Automatically credited in real-time with the 2% company platform fee whenever a customer redeems a sale QR code at any merchant shop.
            </p>
          </div>

          {/* 3-Way Split Summary Pill */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 16,
              padding: '16px 20px',
              minWidth: 260,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#9CA3AF',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              3-Way Split Structure
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D1D5DB' }}>
                <span>Customer Cashback:</span>
                <span style={{ fontWeight: 700, color: '#34D399' }}>3.00%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D1D5DB' }}>
                <span>Platform Fee (Company):</span>
                <span style={{ fontWeight: 700, color: '#FBBF24' }}>2.00%</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#FFFFFF',
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                  fontWeight: 700,
                }}
              >
                <span>Total Shop Deduction:</span>
                <span>5.00%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="stats-grid">
        <StatsCard
          icon={<HiOutlineTrendingUp />}
          label="Total Platform Revenue"
          value={`₹${totalRevenue}`}
          trend="up"
          trendValue="2% Platform Fee"
          color="success"
          delay={1}
        />
        <StatsCard
          icon={<HiOutlineGift />}
          label="Cashback Distributed"
          value={`₹${totalCashback}`}
          trend="up"
          trendValue="Paid to Customers"
          color="info"
          delay={2}
        />
        <StatsCard
          icon={<HiOutlineShoppingBag />}
          label="Gross Sales Volume"
          value={`₹${totalSales}`}
          trend="up"
          trendValue="Processed Bills"
          color="primary"
          delay={3}
        />
        <StatsCard
          icon={<HiOutlineCheckCircle />}
          label="QR Redemptions"
          value={totalRedemptions}
          trend="up"
          trendValue="Successful Claims"
          color="warning"
          delay={4}
        />
      </div>

      {/* Ledger Feed / Transactions Table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div>
            <div className="card-header-title" style={{ fontSize: 16, fontWeight: 700 }}>
              Platform Ledger & Fee Transactions
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Real-time incoming 2% platform commission credits from customer redemptions
            </p>
          </div>
          <span
            className="badge badge-info"
            style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px' }}
          >
            {transactions.length} Transactions
          </span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiOutlineCash style={{ fontSize: 44, color: '#CBD5E1', marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              No platform revenue transactions yet.
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
              When a customer scans a merchant Sale QR, the 2% company fee will appear here instantly.
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Store / Merchant</th>
                  <th>Transaction Description</th>
                  <th style={{ textAlign: 'right' }}>Commission Credit (2%)</th>
                  <th style={{ textAlign: 'right' }}>Balance After</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text)' }}>
                      {t.merchant_name || 'Verified Store'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360 }}>
                      {t.note || t.description || '2.00% Platform Fee'}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        color: 'var(--success-dark)',
                        fontSize: 14,
                      }}
                    >
                      +₹{Number(t.amount).toFixed(2)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--text)',
                      }}
                    >
                      {t.balance_after !== null && t.balance_after !== undefined
                        ? `₹${Number(t.balance_after).toFixed(2)}`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-active">
                        <span className="badge-dot" />
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
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="Adjust User / Merchant Wallet"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={adjusting}
              onClick={handleAdjustSubmit}
              className="btn btn-primary"
            >
              {adjusting ? 'Processing...' : 'Apply Adjustment'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAdjustSubmit}>
          <div className="form-group">
            <label className="form-label">Target User ID</label>
            <input
              type="number"
              placeholder="e.g. 15, 95, 102"
              value={adjustData.user_id}
              onChange={(e) => setAdjustData({ ...adjustData, user_id: e.target.value })}
              className="form-input"
              required
            />
            <span style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4, display: 'block' }}>
              Enter the database ID of the user or merchant account.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Operation</label>
            <select
              value={adjustData.operation}
              onChange={(e) => setAdjustData({ ...adjustData, operation: e.target.value })}
              className="form-select"
            >
              <option value="credit">Credit (+) Fund Wallet</option>
              <option value="debit">Debit (-) Deduct Wallet</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 500"
              value={adjustData.amount}
              onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reason / Audit Note</label>
            <input
              type="text"
              placeholder="e.g. Initial Merchant Funding / Promotional Topup"
              value={adjustData.note}
              onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
              className="form-input"
            />
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
