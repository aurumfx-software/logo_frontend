import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineTag,
  HiOutlineCurrencyRupee,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatsCard from '../components/UI/StatsCard';
import Modal from '../components/UI/Modal';
import {
  fetchAdminSubscriptionPackages,
  createAdminSubscriptionPackage,
  updateAdminSubscriptionPackage,
  deleteAdminSubscriptionPackage,
  assignAdminSubscription,
} from '../api/subscriptionApi';

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'All Packages' },
  { value: 'USER', label: 'Customer / Seller Plans' },
  { value: 'MERCHANT', label: 'Merchant Promotion Plans' },
];

const BILLING_PERIODS = ['MONTHLY', 'ONE_TIME', 'QUARTERLY', 'ANNUALLY'];

export default function Subscriptions() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAudience, setActiveAudience] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Create / Edit Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    audience: 'USER',
    price: '500.00',
    currency: 'INR',
    billing_period: 'MONTHLY',
    duration_days: 30,
    features_text: '',
    can_sell_products: true,
    can_create_promotions: false,
    is_active: true,
    sort_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Manual Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningPackage, setAssigningPackage] = useState(null);
  const [assignData, setAssignData] = useState({
    user_id: '',
    merchant_profile_id: '',
    payment_reference: 'ADMIN_MANUAL_ASSIGN',
    amount_paid: '',
  });
  const [assigning, setAssigning] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadPackages = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchAdminSubscriptionPackages({ activeOnly: false });
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load subscription packages:', err);
      setErrorMessage(err.message || 'Failed to fetch subscription packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const filteredPackages = packages.filter((p) => {
    if (activeAudience === 'ALL') return true;
    return String(p.audience).toUpperCase() === activeAudience;
  });

  const totalPackages = packages.length;
  const userPackages = packages.filter((p) => String(p.audience).toUpperCase() === 'USER');
  const merchantPackages = packages.filter((p) => String(p.audience).toUpperCase() === 'MERCHANT');
  const activeCount = packages.filter((p) => p.is_active).length;

  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      audience: activeAudience === 'MERCHANT' ? 'MERCHANT' : 'USER',
      price: '500.00',
      currency: 'INR',
      billing_period: 'MONTHLY',
      duration_days: 30,
      features_text: 'List unlimited products, WhatsApp order routing, Verified Seller badge',
      can_sell_products: true,
      can_create_promotions: false,
      is_active: true,
      sort_order: packages.length,
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (pkg) => {
    setEditingPackage(pkg);
    const feats = Array.isArray(pkg.features) ? pkg.features.join(', ') : '';
    const grants = pkg.grants || {};
    setFormData({
      code: pkg.code,
      name: pkg.name || '',
      description: pkg.description || '',
      audience: pkg.audience || 'USER',
      price: pkg.price !== undefined ? String(pkg.price) : '0.00',
      currency: pkg.currency || 'INR',
      billing_period: pkg.billing_period || 'MONTHLY',
      duration_days: pkg.duration_days || 30,
      features_text: feats,
      can_sell_products: Boolean(grants.can_sell_products),
      can_create_promotions: Boolean(grants.can_create_promotions),
      is_active: pkg.is_active !== undefined ? pkg.is_active : true,
      sort_order: pkg.sort_order || 0,
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a package name');
      return;
    }

    const featuresList = formData.features_text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const grants = {};
    if (formData.audience === 'USER') {
      if (formData.can_sell_products) {
        grants.can_sell_products = true;
        grants.is_subscriber = true;
        grants.subscription_plan = formData.code || 'SELLER';
      }
    } else {
      if (formData.can_create_promotions) {
        grants.can_create_promotions = true;
      }
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      if (editingPackage) {
        // Update existing package
        await updateAdminSubscriptionPackage(editingPackage.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price || 0),
          currency: formData.currency,
          billing_period: formData.billing_period,
          duration_days: parseInt(formData.duration_days, 10) || 30,
          features: featuresList,
          grants,
          is_active: formData.is_active,
          sort_order: parseInt(formData.sort_order, 10) || 0,
        });
        showToast(`✓ Package "${formData.name}" updated successfully! Mobile app will reflect changes.`);
      } else {
        // Create new package
        const cleanCode = (formData.code || formData.name)
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_]/g, '_');

        await createAdminSubscriptionPackage({
          code: cleanCode,
          name: formData.name.trim(),
          description: formData.description.trim(),
          audience: formData.audience,
          price: parseFloat(formData.price || 0),
          currency: formData.currency,
          billing_period: formData.billing_period,
          duration_days: parseInt(formData.duration_days, 10) || 30,
          features: featuresList,
          grants,
          is_active: formData.is_active,
          sort_order: parseInt(formData.sort_order, 10) || 0,
        });
        showToast(`✓ New package "${formData.name}" created! Available immediately in mobile apps.`);
      }

      setShowFormModal(false);
      await loadPackages();
    } catch (err) {
      alert(err.message || 'Failed to save subscription package');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (pkg) => {
    const nextState = !pkg.is_active;
    try {
      await updateAdminSubscriptionPackage(pkg.id, { is_active: nextState });
      showToast(`Package "${pkg.name}" is now ${nextState ? 'ACTIVE' : 'INACTIVE'}`);
      await loadPackages();
    } catch (err) {
      alert(err.message || 'Failed to change package status');
    }
  };

  const handleDeletePackage = async (pkg) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate package "${pkg.name}"? It will be hidden from mobile apps.`
    );
    if (!confirmed) return;

    try {
      await deleteAdminSubscriptionPackage(pkg.id);
      showToast(`✓ Package "${pkg.name}" deactivated.`);
      await loadPackages();
    } catch (err) {
      alert(err.message || 'Failed to deactivate package');
    }
  };

  const handleOpenAssignModal = (pkg) => {
    setAssigningPackage(pkg);
    setAssignData({
      user_id: '',
      merchant_profile_id: '',
      payment_reference: 'ADMIN_MANUAL_ASSIGN',
      amount_paid: String(pkg.price || '0.00'),
    });
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignData.user_id) {
      alert('Please enter a valid User ID');
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        user_id: parseInt(assignData.user_id, 10),
        package_id: assigningPackage.id,
        payment_reference: assignData.payment_reference || 'ADMIN_ASSIGN',
        amount_paid: parseFloat(assignData.amount_paid || assigningPackage.price || 0),
      };
      if (assignData.merchant_profile_id && assigningPackage.audience === 'MERCHANT') {
        payload.merchant_profile_id = parseInt(assignData.merchant_profile_id, 10);
      }

      await assignAdminSubscription(payload);
      showToast(`✓ Subscription "${assigningPackage.name}" assigned to User #${assignData.user_id}!`);
      setShowAssignModal(false);
    } catch (err) {
      alert(err.message || 'Failed to assign subscription');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 50 }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              backgroundColor: '#059669',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: 10,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              zIndex: 9999,
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <HiOutlineCheckCircle style={{ fontSize: 20 }} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <PageHeader
        title="Subscription Packages & Plans"
        subtitle="Create, edit and manage Customer Seller Plans and Merchant Growth Packages. Changes synchronize in real-time with the mobile app."
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={loadPackages}
            disabled={loading}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineRefresh className={loading ? 'animate-spin' : ''} style={{ fontSize: 16 }} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#1E3A8A',
              borderColor: '#1E3A8A',
            }}
          >
            <HiOutlinePlus style={{ fontSize: 18 }} />
            New Subscription Package
          </button>
        </div>
      </PageHeader>

      {/* Stats Cards Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatsCard
          title="Total Packages"
          value={totalPackages}
          subtitle={`${activeCount} Active Catalog Plans`}
          icon={HiOutlineTag}
          color="blue"
        />
        <StatsCard
          title="Customer / Seller Plans"
          value={userPackages.length}
          subtitle="e.g. USER_SELLER_500"
          icon={HiOutlineUserGroup}
          color="purple"
        />
        <StatsCard
          title="Merchant Growth Plans"
          value={merchantPackages.length}
          subtitle="e.g. Promo Basic & Premium"
          icon={HiOutlineOfficeBuilding}
          color="emerald"
        />
        <StatsCard
          title="Platform Wallet Revenue"
          value="Automated"
          subtitle="100% Routed to Company Wallet"
          icon={HiOutlineCreditCard}
          color="amber"
        />
      </div>

      {/* Platform Wallet Information Notice */}
      <div
        style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: '#DBEAFE',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <HiOutlineShieldCheck />
          </div>
          <div>
            <div style={{ fontWeight: '800', color: '#1E3A8A', fontSize: 14 }}>
              Admin Wallet & Revenue Integration
            </div>
            <div style={{ color: '#4B5563', fontSize: 12.5, marginTop: 2 }}>
              Subscription purchases made by users & merchants through Razorpay deposit directly into your
              Platform Company Wallet.
            </div>
          </div>
        </div>

        <a
          href="/wallet"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#1E40AF',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: '700',
            textDecoration: 'none',
          }}
        >
          View Company Wallet
          <HiOutlineExternalLink />
        </a>
      </div>

      {/* Audience Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          backgroundColor: '#FFFFFF',
          padding: 6,
          borderRadius: 10,
          border: '1px solid #E5E7EB',
          width: 'fit-content',
        }}
      >
        {AUDIENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveAudience(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: activeAudience === opt.value ? '800' : '600',
              backgroundColor: activeAudience === opt.value ? '#1E3A8A' : 'transparent',
              color: activeAudience === opt.value ? '#FFFFFF' : '#4B5563',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: 14,
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Packages Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
          <HiOutlineRefresh className="animate-spin" style={{ fontSize: 32, margin: '0 auto 12px auto' }} />
          <div>Loading subscription packages from server...</div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            padding: '48px 20px',
            textAlign: 'center',
            border: '1px solid #E5E7EB',
          }}
        >
          <HiOutlineTag style={{ fontSize: 44, color: '#9CA3AF', margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: 16, fontWeight: '800', color: '#374151' }}>No Subscription Packages Found</div>
          <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
            Click "New Subscription Package" to configure a plan.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {filteredPackages.map((pkg) => {
            const isUser = String(pkg.audience).toUpperCase() === 'USER';
            const priceNum = parseFloat(pkg.price || 0);

            return (
              <div
                key={pkg.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  border: pkg.is_active ? '1.5px solid #E5E7EB' : '1.5px dashed #D1D5DB',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: pkg.is_active ? 1 : 0.7,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Header row: Audience tag & active badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: 6,
                      backgroundColor: isUser ? '#F3E8FF' : '#EFF6FF',
                      color: isUser ? '#7E22CE' : '#1D4ED8',
                      letterSpacing: 0.5,
                    }}
                  >
                    {isUser ? '👤 USER / SELLER' : '🏬 MERCHANT'}
                  </span>

                  <span
                    onClick={() => handleToggleActive(pkg)}
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: 12,
                      backgroundColor: pkg.is_active ? '#DCFCE7' : '#F3F4F6',
                      color: pkg.is_active ? '#15803D' : '#6B7280',
                      cursor: 'pointer',
                    }}
                    title="Click to toggle active status"
                  >
                    {pkg.is_active ? '● ACTIVE' : '○ INACTIVE'}
                  </span>
                </div>

                {/* Package Title & Code */}
                <div style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>{pkg.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace', marginTop: 2 }}>
                  CODE: {pkg.code}
                </div>

                {pkg.description && (
                  <div style={{ fontSize: 13, color: '#4B5563', marginTop: 8, lineHeight: 1.4 }}>
                    {pkg.description}
                  </div>
                )}

                {/* Price Display */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 4,
                    margin: '16px 0 12px 0',
                    padding: '12px 0',
                    borderTop: '1px solid #F3F4F6',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>₹</span>
                  <span style={{ fontSize: 28, fontWeight: '900', color: '#111827' }}>{priceNum}</span>
                  <span style={{ fontSize: 12.5, color: '#6B7280', fontWeight: '600' }}>
                    / {pkg.billing_period === 'MONTHLY' ? `${pkg.duration_days} days` : pkg.billing_period.toLowerCase()}
                  </span>
                </div>

                {/* Features List */}
                <div style={{ flex: 1, marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: '800', color: '#6B7280', marginBottom: 8 }}>
                    INCLUDED FEATURES:
                  </div>
                  {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pkg.features.map((feat, idx) => (
                        <div
                          key={idx}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#374151' }}
                        >
                          <HiOutlineCheckCircle style={{ color: '#059669', fontSize: 15, flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>Standard platform features</div>
                  )}
                </div>

                {/* Entitlement Grants Tag */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                  {pkg.grants &&
                    Object.entries(pkg.grants).map(([key, val]) => (
                      <span
                        key={key}
                        style={{
                          fontSize: 10.5,
                          backgroundColor: '#F3F4F6',
                          color: '#4B5563',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: '600',
                        }}
                      >
                        {key}: {String(val)}
                      </span>
                    ))}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleOpenEditModal(pkg)}
                    className="btn btn-outline"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: 12,
                      padding: '8px 10px',
                    }}
                  >
                    <HiOutlinePencil style={{ fontSize: 14 }} />
                    Edit Plan
                  </button>

                  <button
                    onClick={() => handleOpenAssignModal(pkg)}
                    className="btn btn-outline"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: 12,
                      padding: '8px 10px',
                      borderColor: '#1E3A8A',
                      color: '#1E3A8A',
                    }}
                  >
                    <HiOutlineSparkles style={{ fontSize: 14 }} />
                    Assign
                  </button>

                  <button
                    onClick={() => handleDeletePackage(pkg)}
                    className="btn btn-outline"
                    style={{
                      padding: '8px 10px',
                      color: '#DC2626',
                      borderColor: '#FCA5A5',
                    }}
                    title="Deactivate package"
                  >
                    <HiOutlineTrash style={{ fontSize: 15 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create / Edit Subscription Package */}
      {showFormModal && (
        <Modal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={editingPackage ? `Edit Plan: ${editingPackage.name}` : 'Create Subscription Package'}
        >
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!editingPackage && (
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                  Package Code * (e.g. USER_SELLER_500, MERCHANT_PROMO_BASIC)
                </label>
                <input
                  type="text"
                  required
                  placeholder="USER_SELLER_500"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input input-bordered w-full"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                Package Name *
              </label>
              <input
                type="text"
                required
                placeholder="Seller Plan ₹500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input input-bordered w-full"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Publish product listings and accept buyer inquiries on WhatsApp"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                  Audience *
                </label>
                <select
                  disabled={Boolean(editingPackage)}
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                >
                  <option value="USER">Customer / Seller (USER)</option>
                  <option value="MERCHANT">Merchant Store (MERCHANT)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                  Billing Period
                </label>
                <select
                  value={formData.billing_period}
                  onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                >
                  {BILLING_PERIODS.map((bp) => (
                    <option key={bp} value={bp}>
                      {bp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="500.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                  Duration in Days *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="30"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                Features (Comma-separated bullet points)
              </label>
              <textarea
                rows={2}
                placeholder="List unlimited products, WhatsApp order routing, Verified Seller badge"
                value={formData.features_text}
                onChange={(e) => setFormData({ ...formData, features_text: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>

            {/* Entitlement Grants Checklist */}
            <div style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                ENTITLEMENT PRIVILEGES:
              </div>
              {formData.audience === 'USER' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.can_sell_products}
                    onChange={(e) => setFormData({ ...formData, can_sell_products: e.target.checked })}
                  />
                  <span>
                    <strong>can_sell_products</strong>: User can list & publish products on Kerala marketplace
                  </span>
                </label>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.can_create_promotions}
                    onChange={(e) => setFormData({ ...formData, can_create_promotions: e.target.checked })}
                  />
                  <span>
                    <strong>can_create_promotions</strong>: Merchant can create home-feed banner advertisements
                  </span>
                </label>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>
                <strong>Active in Mobile App catalog</strong> (When unchecked, package is hidden from users)
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="btn btn-outline"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#1E3A8A',
                  borderColor: '#1E3A8A',
                  padding: '8px 20px',
                  color: '#FFFFFF',
                  fontWeight: '700',
                }}
              >
                {submitting ? 'Saving...' : editingPackage ? 'Save Package Changes' : 'Create Package'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Admin Manual Assign Subscription */}
      {showAssignModal && assigningPackage && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title={`Assign "${assigningPackage.name}" to User / Shop`}
        >
          <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                User ID * (Target account number)
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 104"
                value={assignData.user_id}
                onChange={(e) => setAssignData({ ...assignData, user_id: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>

            {assigningPackage.audience === 'MERCHANT' && (
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                  Merchant Shop ID (Optional if user owns one shop)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={assignData.merchant_profile_id}
                  onChange={(e) => setAssignData({ ...assignData, merchant_profile_id: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>
                Payment Reference / Note
              </label>
              <input
                type="text"
                placeholder="ADMIN_MANUAL_ASSIGN or bank transfer reference"
                value={assignData.payment_reference}
                onChange={(e) => setAssignData({ ...assignData, payment_reference: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="btn btn-outline"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#1E3A8A',
                  borderColor: '#1E3A8A',
                  padding: '8px 20px',
                  color: '#FFFFFF',
                  fontWeight: '700',
                }}
              >
                {assigning ? 'Assigning...' : 'Confirm & Activate Subscription'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}
