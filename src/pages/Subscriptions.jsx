import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineRefresh,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineTag,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineExternalLink,
  HiOutlineDuplicate,
  HiOutlineCheck,
  HiOutlineLockClosed,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatsCard from '../components/UI/StatsCard';
import Modal from '../components/UI/Modal';
import {
  fetchAdminSubscriptionPackages,
  createAdminSubscriptionPackage,
  updateAdminSubscriptionPackage,
  duplicateAdminSubscriptionPackage,
  deleteAdminSubscriptionPackage,
  assignAdminSubscription,
} from '../api/subscriptionApi';
import {
  MERCHANT_PERMISSION_GROUPS,
  MERCHANT_PERMISSION_ITEMS,
  MERCHANT_PERMISSION_KEYS,
  buildEmptyMerchantGrants,
  resolvePackageMerchantGrants,
  countEnabledMerchantGrants,
} from '../utils/merchantPermissions';

const AUDIENCE_OPTIONS = [
  { value: 'MERCHANT', label: 'Merchant Subscription Builder & Plans' },
  { value: 'USER', label: 'Customer / Seller Plans' },
  { value: 'ALL', label: 'All Packages' },
];

const BILLING_PERIODS = ['MONTHLY', 'ONE_TIME', 'QUARTERLY', 'ANNUALLY'];

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 9,
  border: '1px solid #CBD5E1',
  fontSize: 13.5,
  backgroundColor: '#FFFFFF',
  color: '#0F172A',
};

function makeUniqueCode(baseText, existingCodes = []) {
  const cleaned = String(baseText || 'MERCHANT_PLAN')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 42) || 'MERCHANT_PLAN';
  const upperSet = new Set(existingCodes.map((c) => String(c || '').toUpperCase()));
  if (!upperSet.has(cleaned)) return cleaned;
  let idx = 2;
  while (upperSet.has(`${cleaned}_${idx}`)) idx += 1;
  return `${cleaned}_${idx}`;
}

function createInitialMerchantBuilder(existingPackages = []) {
  const existingCodes = existingPackages.map((p) => p.code);
  return {
    editingId: null,
    code: makeUniqueCode('MERCHANT_CUSTOM_PLAN', existingCodes),
    codeTouched: false,
    name: '',
    description: '',
    price: '999',
    currency: 'INR',
    billing_period: 'MONTHLY',
    duration_days: 30,
    is_active: true,
    sort_order: existingPackages.length,
    grants: buildEmptyMerchantGrants(false),
  };
}

export default function Subscriptions() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAudience, setActiveAudience] = useState('MERCHANT');
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const builderRef = useRef(null);

  // Single Merchant Subscription Form Builder state
  const [merchantForm, setMerchantForm] = useState(() => createInitialMerchantBuilder([]));
  const [merchantSubmitting, setMerchantSubmitting] = useState(false);

  // Customer / User Modal State (kept intact for USER_SELLER_500 etc.)
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserPkg, setEditingUserPkg] = useState(null);
  const [userFormData, setUserFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: '500.00',
    currency: 'INR',
    billing_period: 'MONTHLY',
    duration_days: 30,
    features_text: '',
    can_sell_products: true,
    is_active: true,
    sort_order: 0,
  });
  const [userSubmitting, setUserSubmitting] = useState(false);

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
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadPackages = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchAdminSubscriptionPackages({ activeOnly: false });
      const list = Array.isArray(data) ? data : [];
      setPackages(list);
      return list;
    } catch (err) {
      console.error('Failed to load subscription packages:', err);
      setErrorMessage(err.message || 'Failed to fetch subscription packages');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages().then((list) => {
      if (list.length > 0 && !merchantForm.editingId && !merchantForm.name) {
        setMerchantForm(createInitialMerchantBuilder(list));
      }
    });
  }, []);

  const filteredPackages = packages.filter((p) => {
    if (activeAudience === 'ALL') return true;
    return String(p.audience).toUpperCase() === activeAudience;
  });

  const totalPackages = packages.length;
  const userPackages = packages.filter((p) => String(p.audience).toUpperCase() === 'USER');
  const merchantPackages = packages.filter((p) => String(p.audience).toUpperCase() === 'MERCHANT');
  const activeCount = packages.filter((p) => p.is_active).length;

  const unlockedCount = countEnabledMerchantGrants(merchantForm.grants);
  const allTicked = unlockedCount === MERCHANT_PERMISSION_KEYS.length;

  const scrollToBuilder = () => {
    if (builderRef.current) {
      builderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetMerchantBuilder = () => {
    setMerchantForm(createInitialMerchantBuilder(packages));
    scrollToBuilder();
  };

  const handleLoadMerchantIntoForm = (pkg) => {
    const resolved = resolvePackageMerchantGrants(pkg);
    setActiveAudience('MERCHANT');
    setMerchantForm({
      editingId: pkg.id,
      code: pkg.code || '',
      codeTouched: true,
      name: pkg.name || '',
      description: pkg.description || '',
      price: pkg.price !== undefined ? String(pkg.price) : '0',
      currency: pkg.currency || 'INR',
      billing_period: pkg.billing_period || 'MONTHLY',
      duration_days: pkg.duration_days || 30,
      is_active: pkg.is_active !== undefined ? Boolean(pkg.is_active) : true,
      sort_order: pkg.sort_order ?? 0,
      grants: { _granular: true, ...resolved },
    });
    scrollToBuilder();
  };

  const handleCloneFormDraft = () => {
    const existingCodes = packages.map((p) => p.code);
    const nextName = merchantForm.name ? `${merchantForm.name.replace(/\s*\(Copy\)$/i, '')} (Copy)` : 'New Merchant Plan';
    const nextCode = makeUniqueCode(`${merchantForm.code || nextName}_COPY`, existingCodes);
    setActiveAudience('MERCHANT');
    setMerchantForm((prev) => ({
      ...prev,
      editingId: null,
      code: nextCode,
      codeTouched: true,
      name: nextName,
      sort_order: packages.length,
    }));
    showToast('Form duplicated into a new draft — customize Name, Price & Ticked Permissions and save!');
    scrollToBuilder();
  };

  const handleDuplicateCardPackage = async (pkg) => {
    try {
      const duplicated = await duplicateAdminSubscriptionPackage(pkg.id);
      await loadPackages();
      handleLoadMerchantIntoForm(duplicated);
      showToast(`✓ Duplicated "${pkg.name}" as "${duplicated.name}"! Edit price/ticks and click Save.`);
    } catch (err) {
      alert(err.message || 'Failed to duplicate subscription package');
    }
  };

  const togglePermissionKey = (key) => {
    setMerchantForm((prev) => ({
      ...prev,
      grants: {
        ...prev.grants,
        _granular: true,
        [key]: !prev.grants?.[key],
      },
    }));
  };

  const handleTickAllPermissions = (enable) => {
    setMerchantForm((prev) => ({
      ...prev,
      grants: buildEmptyMerchantGrants(enable),
    }));
  };

  const handleToggleGroupPermissions = (groupName) => {
    const groupKeys = MERCHANT_PERMISSION_ITEMS.filter((i) => i.group === groupName).map((i) => i.key);
    const groupAllChecked = groupKeys.every((k) => Boolean(merchantForm.grants?.[k]));
    setMerchantForm((prev) => {
      const nextGrants = { ...prev.grants, _granular: true };
      groupKeys.forEach((k) => {
        nextGrants[k] = !groupAllChecked;
      });
      return { ...prev, grants: nextGrants };
    });
  };

  const handleMerchantFormSubmit = async (e) => {
    e.preventDefault();
    if (!merchantForm.name.trim()) {
      alert('Please enter a Subscription Name.');
      return;
    }

    const cleanGrants = { _granular: true };
    const autoFeatures = [];
    MERCHANT_PERMISSION_ITEMS.forEach((item) => {
      const checked = Boolean(merchantForm.grants?.[item.key]);
      cleanGrants[item.key] = checked;
      if (checked) autoFeatures.push(item.label);
    });

    setMerchantSubmitting(true);
    setErrorMessage('');
    try {
      if (merchantForm.editingId) {
        await updateAdminSubscriptionPackage(merchantForm.editingId, {
          name: merchantForm.name.trim(),
          description: merchantForm.description.trim(),
          price: parseFloat(merchantForm.price || 0),
          currency: merchantForm.currency || 'INR',
          billing_period: merchantForm.billing_period,
          duration_days: parseInt(merchantForm.duration_days, 10) || 30,
          features: autoFeatures,
          grants: cleanGrants,
          is_active: Boolean(merchantForm.is_active),
          sort_order: parseInt(merchantForm.sort_order, 10) || 0,
        });
        showToast(`✓ Updated "${merchantForm.name}"! Active merchants & app sync immediately.`);
      } else {
        const cleanCode = (merchantForm.code || makeUniqueCode(merchantForm.name, packages.map((p) => p.code)))
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_]/g, '_');

        const created = await createAdminSubscriptionPackage({
          code: cleanCode,
          name: merchantForm.name.trim(),
          description: merchantForm.description.trim(),
          audience: 'MERCHANT',
          price: parseFloat(merchantForm.price || 0),
          currency: merchantForm.currency || 'INR',
          billing_period: merchantForm.billing_period,
          duration_days: parseInt(merchantForm.duration_days, 10) || 30,
          features: autoFeatures,
          grants: cleanGrants,
          is_active: Boolean(merchantForm.is_active),
          sort_order: parseInt(merchantForm.sort_order, 10) || packages.length,
        });
        showToast(`✓ Created "${created.name}" with ${autoFeatures.length} unlocked feature(s)!`);
        setMerchantForm(createInitialMerchantBuilder([...packages, created]));
      }
      await loadPackages();
    } catch (err) {
      alert(err.message || 'Failed to save merchant subscription');
    } finally {
      setMerchantSubmitting(false);
    }
  };

  // Customer / User Plan handlers
  const handleOpenCreateUserModal = () => {
    setEditingUserPkg(null);
    setUserFormData({
      code: '',
      name: '',
      description: '',
      price: '500.00',
      currency: 'INR',
      billing_period: 'MONTHLY',
      duration_days: 30,
      features_text: 'List products, Seller dashboard, Order notifications',
      can_sell_products: true,
      is_active: true,
      sort_order: packages.length,
    });
    setShowUserModal(true);
  };

  const handleOpenEditPackage = (pkg) => {
    if (String(pkg.audience).toUpperCase() === 'MERCHANT') {
      handleLoadMerchantIntoForm(pkg);
      return;
    }
    setEditingUserPkg(pkg);
    const feats = Array.isArray(pkg.features) ? pkg.features.join(', ') : '';
    const grants = pkg.grants || {};
    setUserFormData({
      code: pkg.code,
      name: pkg.name || '',
      description: pkg.description || '',
      price: pkg.price !== undefined ? String(pkg.price) : '0.00',
      currency: pkg.currency || 'INR',
      billing_period: pkg.billing_period || 'MONTHLY',
      duration_days: pkg.duration_days || 30,
      features_text: feats,
      can_sell_products: Boolean(grants.can_sell_products),
      is_active: pkg.is_active !== undefined ? pkg.is_active : true,
      sort_order: pkg.sort_order || 0,
    });
    setShowUserModal(true);
  };

  const handleUserModalSubmit = async (e) => {
    e.preventDefault();
    const featuresList = userFormData.features_text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const grants = userFormData.can_sell_products
      ? {
          can_sell_products: true,
          is_subscriber: true,
          subscription_plan: userFormData.code || 'SELLER',
        }
      : {};

    setUserSubmitting(true);
    try {
      if (editingUserPkg) {
        await updateAdminSubscriptionPackage(editingUserPkg.id, {
          name: userFormData.name.trim(),
          description: userFormData.description.trim(),
          price: parseFloat(userFormData.price || 0),
          currency: userFormData.currency,
          billing_period: userFormData.billing_period,
          duration_days: parseInt(userFormData.duration_days, 10) || 30,
          features: featuresList,
          grants,
          is_active: userFormData.is_active,
          sort_order: parseInt(userFormData.sort_order, 10) || 0,
        });
        showToast(`✓ Updated "${userFormData.name}"`);
      } else {
        const cleanCode = (userFormData.code || userFormData.name)
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_]/g, '_');
        await createAdminSubscriptionPackage({
          code: cleanCode,
          name: userFormData.name.trim(),
          description: userFormData.description.trim(),
          audience: 'USER',
          price: parseFloat(userFormData.price || 0),
          currency: userFormData.currency,
          billing_period: userFormData.billing_period,
          duration_days: parseInt(userFormData.duration_days, 10) || 30,
          features: featuresList,
          grants,
          is_active: userFormData.is_active,
          sort_order: parseInt(userFormData.sort_order, 10) || 0,
        });
        showToast(`✓ Created Customer/Seller package "${userFormData.name}"`);
      }
      setShowUserModal(false);
      await loadPackages();
    } catch (err) {
      alert(err.message || 'Failed to save package');
    } finally {
      setUserSubmitting(false);
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
    if (!window.confirm(`Deactivate "${pkg.name}"? It will be hidden from new purchases.`)) return;
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
      showToast(`✓ Assigned "${assigningPackage.name}" to User #${assignData.user_id}`);
      setShowAssignModal(false);
    } catch (err) {
      alert(err.message || 'Failed to assign subscription');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 60 }}>
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
              zIndex: 9999,
              backgroundColor: '#065F46',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: 10,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: '700',
              fontSize: 13.5,
            }}
          >
            <HiOutlineCheckCircle style={{ fontSize: 20 }} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Merchant Permission Subscriptions & Plans"
        subtitle="Configure custom Merchant subscription forms with tickable Web & App permissions, and duplicate into multiple priced plans."
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={loadPackages}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={loading}
          >
            <HiOutlineRefresh className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleResetMerchantBuilder}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#1E3A8A',
              borderColor: '#1E3A8A',
              color: '#FFFFFF',
            }}
          >
            <HiOutlinePlus style={{ fontSize: 18 }} />
            New Merchant Plan Form
          </button>
          <button
            onClick={handleOpenCreateUserModal}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineUserGroup />
            + Customer / Seller Plan
          </button>
        </div>
      </PageHeader>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 22,
        }}
      >
        <StatsCard
          label="Total Subscription Plans"
          value={totalPackages}
          trend="up"
          trendValue={`${activeCount} Active Plans`}
          icon={<HiOutlineTag />}
          color="primary"
          delay={0}
        />
        <StatsCard
          label="Merchant Permission Plans"
          value={merchantPackages.length}
          trend="up"
          trendValue="Store & Ad Tiers"
          icon={<HiOutlineOfficeBuilding />}
          color="success"
          delay={1}
        />
        <StatsCard
          label="Customer / Seller Plans"
          value={userPackages.length}
          trend="up"
          trendValue="Marketplace Selling"
          icon={<HiOutlineUserGroup />}
          color="info"
          delay={2}
        />
        <StatsCard
          label="Company Wallet Sync"
          value="Automated"
          trend="up"
          trendValue="100% Live Settlement"
          icon={<HiOutlineCreditCard />}
          color="warning"
          delay={3}
        />
      </div>

      {/* Platform Wallet Strip */}
      <div
        style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 12,
          padding: '12px 18px',
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
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#DBEAFE',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 19,
            }}
          >
            <HiOutlineShieldCheck />
          </div>
          <div>
            <div style={{ fontWeight: '800', color: '#1E3A8A', fontSize: 13.5 }}>
              Strict Feature-Tick Enforcement Active (Web + Mobile App + Backend API)
            </div>
            <div style={{ color: '#475569', fontSize: 12.5 }}>
              Only ticked features below unlock for Merchants when they subscribe. Duplicate the form anytime to create different price tiers.
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
          marginBottom: 20,
          backgroundColor: '#FFFFFF',
          padding: 6,
          borderRadius: 10,
          border: '1px solid #E5E7EB',
          width: 'fit-content',
          flexWrap: 'wrap',
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
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* INLINE SINGLE MERCHANT SUBSCRIPTION FORM BUILDER */}
      {activeAudience !== 'USER' && (
        <div
          ref={builderRef}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            border: merchantForm.editingId ? '2px solid #2563EB' : '1.5px solid #CBD5E1',
            padding: 24,
            marginBottom: 28,
            boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
              paddingBottom: 16,
              marginBottom: 18,
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: merchantForm.editingId ? '#DBEAFE' : '#ECFDF5',
                    color: merchantForm.editingId ? '#1D4ED8' : '#047857',
                  }}
                >
                  {merchantForm.editingId ? `EDITING EXISTING PLAN #${merchantForm.editingId}` : 'SINGLE MERCHANT SUBSCRIPTION FORM'}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: unlockedCount > 0 ? '#EFF6FF' : '#FEF3C7',
                    color: unlockedCount > 0 ? '#1E40AF' : '#92400E',
                  }}
                >
                  {unlockedCount} / {MERCHANT_PERMISSION_KEYS.length} Permissions Ticked
                </span>
              </div>
              <h2 style={{ margin: '8px 0 4px', fontSize: 19, fontWeight: 900, color: '#0F172A' }}>
                {merchantForm.editingId
                  ? `Edit Merchant Plan: ${merchantForm.name || merchantForm.code}`
                  : 'Create / Configure Merchant Subscription Plan'}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                Set Subscription Name, Details, Price & Duration, then tick exact Merchant Permissions below. Use <strong>Duplicate This Form</strong> to spin up extra plans cleanly.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCloneFormDraft}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 9,
                  border: '1.5px solid #2563EB',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <HiOutlineDuplicate style={{ fontSize: 16 }} />
                Duplicate This Form
              </button>
              {merchantForm.editingId && (
                <button
                  type="button"
                  onClick={handleResetMerchantBuilder}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 9,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  + Reset to Blank Form
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleMerchantFormSubmit}>
            {/* Basic Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: '#1E293B', marginBottom: 5 }}>
                  Subscription Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Photos + Hero Banner Plan"
                  value={merchantForm.name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setMerchantForm((prev) => ({
                      ...prev,
                      name: nextName,
                      code:
                        !prev.editingId && !prev.codeTouched
                          ? makeUniqueCode(nextName, packages.map((p) => p.code))
                          : prev.code,
                    }));
                  }}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: '#1E293B', marginBottom: 5 }}>
                  Plan Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(merchantForm.editingId)}
                  placeholder="e.g. MERCH_PHOTOS_499"
                  value={merchantForm.code}
                  onChange={(e) =>
                    setMerchantForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
                      codeTouched: true,
                    }))
                  }
                  style={{
                    ...inputStyle,
                    fontFamily: 'monospace',
                    backgroundColor: merchantForm.editingId ? '#F1F5F9' : '#FFFFFF',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: '#1E293B', marginBottom: 5 }}>
                  Price (₹ INR) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={merchantForm.price}
                  onChange={(e) => setMerchantForm((prev) => ({ ...prev, price: e.target.value }))}
                  style={{ ...inputStyle, fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: '#1E293B', marginBottom: 5 }}>
                  Billing & Duration (Days)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 8 }}>
                  <select
                    value={merchantForm.billing_period}
                    onChange={(e) => setMerchantForm((prev) => ({ ...prev, billing_period: e.target.value }))}
                    style={inputStyle}
                  >
                    {BILLING_PERIODS.map((bp) => (
                      <option key={bp} value={bp}>{bp}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    required
                    value={merchantForm.duration_days}
                    onChange={(e) => setMerchantForm((prev) => ({ ...prev, duration_days: e.target.value }))}
                    style={inputStyle}
                    title="Duration in days"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: '#1E293B', marginBottom: 5 }}>
                  Subscription Details / Description
                </label>
                <input
                  type="text"
                  placeholder="Describe what merchants get in this plan (shown on Web & Mobile checkout)..."
                  value={merchantForm.description}
                  onChange={(e) => setMerchantForm((prev) => ({ ...prev, description: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 9,
                    border: '1px solid #CBD5E1',
                    backgroundColor: merchantForm.is_active ? '#F0FDF4' : '#F8FAFC',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    color: merchantForm.is_active ? '#166534' : '#475569',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(merchantForm.is_active)}
                    onChange={(e) => setMerchantForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <span>Active (Visible to Merchants)</span>
                </label>
              </div>
            </div>

            {/* Tickable Feature Permissions Checklist */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 900, color: '#0F172A' }}>
                    Tick Merchant Features Unlocked by This Subscription
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748B' }}>
                    Unticked features stay locked on Web Merchant Portal, Mobile App & Backend API until unlocked by an active subscription.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleTickAllPermissions(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: allTicked ? '#059669' : '#1E3A8A',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <HiOutlineCheck />
                    Tick All ({MERCHANT_PERMISSION_KEYS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTickAllPermissions(false)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#334155',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {MERCHANT_PERMISSION_GROUPS.map((groupName) => {
                  const groupItems = MERCHANT_PERMISSION_ITEMS.filter((i) => i.group === groupName);
                  const groupCheckedCount = groupItems.filter((i) => Boolean(merchantForm.grants?.[i.key])).length;
                  return (
                    <div key={groupName}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: '#475569' }}>
                          {groupName} ({groupCheckedCount}/{groupItems.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleGroupPermissions(groupName)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#2563EB',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {groupCheckedCount === groupItems.length ? 'Untick Group' : 'Tick Group'}
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))',
                          gap: 10,
                        }}
                      >
                        {groupItems.map((item) => {
                          const checked = Boolean(merchantForm.grants?.[item.key]);
                          return (
                            <label
                              key={item.key}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '11px 12px',
                                borderRadius: 10,
                                border: checked ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                                backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
                                cursor: 'pointer',
                                transition: 'all 0.12s ease',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermissionKey(item.key)}
                                style={{ marginTop: 3, width: 16, height: 16, accentColor: '#2563EB', flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: checked ? '#1E3A8A' : '#0F172A' }}>
                                  {item.label}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2, lineHeight: 1.35 }}>
                                  {item.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              {merchantForm.editingId && (
                <button
                  type="button"
                  onClick={handleCloneFormDraft}
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontWeight: 700 }}
                >
                  <HiOutlineDuplicate />
                  Save as New Duplicate
                </button>
              )}
              <button
                type="submit"
                disabled={merchantSubmitting}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#1E3A8A',
                  borderColor: '#1E3A8A',
                  padding: '10px 24px',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {merchantSubmitting
                  ? 'Saving Plan...'
                  : merchantForm.editingId
                  ? 'Save Changes to Plan'
                  : 'Create Merchant Subscription'}
              </button>
            </div>
          </form>
        </div>
      )}

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

      {/* Existing Packages Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#6B7280' }}>
          <HiOutlineRefresh className="animate-spin" style={{ fontSize: 32, margin: '0 auto 12px auto' }} />
          <div>Loading subscription plans...</div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            padding: '44px 20px',
            textAlign: 'center',
            border: '1px solid #E5E7EB',
          }}
        >
          <HiOutlineTag style={{ fontSize: 42, color: '#9CA3AF', margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: 16, fontWeight: '800', color: '#374151' }}>No Subscription Plans Found</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: 20,
          }}
        >
          {filteredPackages.map((pkg) => {
            const isUser = String(pkg.audience).toUpperCase() === 'USER';
            const priceNum = parseFloat(pkg.price || 0);
            const resolvedGrants = !isUser ? resolvePackageMerchantGrants(pkg) : null;
            const enabledItems = !isUser
              ? MERCHANT_PERMISSION_ITEMS.filter((item) => resolvedGrants[item.key])
              : [];

            return (
              <div
                key={pkg.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  border:
                    merchantForm.editingId === pkg.id
                      ? '2px solid #2563EB'
                      : pkg.is_active
                      ? '1.5px solid #E5E7EB'
                      : '1.5px dashed #CBD5E1',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: pkg.is_active ? 1 : 0.72,
                  boxShadow: '0 4px 10px -2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      padding: '3px 9px',
                      borderRadius: 6,
                      backgroundColor: isUser ? '#F3E8FF' : '#EFF6FF',
                      color: isUser ? '#7E22CE' : '#1D4ED8',
                    }}
                  >
                    {isUser ? 'USER / SELLER PLAN' : 'MERCHANT PERMISSION PLAN'}
                  </span>
                  <span
                    onClick={() => handleToggleActive(pkg)}
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      padding: '3px 9px',
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

                <div style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>{pkg.name}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 2 }}>
                  CODE: {pkg.code}
                </div>
                {pkg.description && (
                  <div style={{ fontSize: 13, color: '#4B5563', marginTop: 8, lineHeight: 1.4 }}>{pkg.description}</div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 4,
                    margin: '14px 0',
                    padding: '10px 0',
                    borderTop: '1px solid #F1F5F9',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>₹</span>
                  <span style={{ fontSize: 28, fontWeight: '900', color: '#111827' }}>{priceNum}</span>
                  <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: '600' }}>
                    / {pkg.billing_period === 'MONTHLY' ? `${pkg.duration_days} days` : String(pkg.billing_period || '30 days').toLowerCase()}
                  </span>
                </div>

                {/* Unlocked Feature Summary */}
                <div style={{ flex: 1, marginBottom: 16 }}>
                  {!isUser ? (
                    <>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 8 }}>
                        UNLOCKED PERMISSIONS ({enabledItems.length} / {MERCHANT_PERMISSION_ITEMS.length}):
                      </div>
                      {enabledItems.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {enabledItems.map((item) => (
                            <span
                              key={item.key}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11.5,
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: 7,
                                backgroundColor: '#ECFDF5',
                                color: '#065F46',
                                border: '1px solid #A7F3D0',
                              }}
                            >
                              <HiOutlineCheckCircle style={{ fontSize: 13 }} />
                              {item.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#B45309', fontWeight: 700 }}>
                          <HiOutlineLockClosed />
                          No permissions ticked yet — click Edit to unlock features
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 11.5, fontWeight: '800', color: '#6B7280', marginBottom: 8 }}>
                        INCLUDED FEATURES:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(pkg.features || []).map((feat, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#374151' }}>
                            <HiOutlineCheckCircle style={{ color: '#059669', fontSize: 15, flexShrink: 0 }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleOpenEditPackage(pkg)}
                    className="btn btn-outline"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12.5, padding: '8px 10px' }}
                  >
                    <HiOutlinePencil />
                    Edit
                  </button>

                  {!isUser && (
                    <button
                      onClick={() => handleDuplicateCardPackage(pkg)}
                      className="btn btn-outline"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        fontSize: 12.5,
                        padding: '8px 10px',
                        color: '#1D4ED8',
                        borderColor: '#93C5FD',
                        backgroundColor: '#EFF6FF',
                      }}
                      title="Duplicate plan with a new price & permission mix"
                    >
                      <HiOutlineDuplicate />
                      Duplicate
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenAssignModal(pkg)}
                    className="btn btn-outline"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      fontSize: 12.5,
                      padding: '8px 10px',
                      color: '#047857',
                      borderColor: '#A7F3D0',
                    }}
                    title="Manually assign to user/merchant"
                  >
                    <HiOutlineUserGroup />
                    Assign
                  </button>

                  <button
                    onClick={() => handleDeletePackage(pkg)}
                    className="btn btn-outline"
                    style={{ padding: '8px 10px', color: '#DC2626', borderColor: '#FCA5A5' }}
                    title="Deactivate package"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer / Seller Plan Modal */}
      {showUserModal && (
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title={editingUserPkg ? `Edit Plan: ${editingUserPkg.name}` : 'Create Customer / Seller Plan'}
        >
          <form onSubmit={handleUserModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!editingUserPkg && (
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>Package Code *</label>
                <input
                  type="text"
                  required
                  placeholder="USER_SELLER_500"
                  value={userFormData.code}
                  onChange={(e) => setUserFormData({ ...userFormData, code: e.target.value })}
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>Package Name *</label>
              <input
                type="text"
                required
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>Description</label>
              <textarea
                rows={2}
                value={userFormData.description}
                onChange={(e) => setUserFormData({ ...userFormData, description: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={userFormData.price}
                  onChange={(e) => setUserFormData({ ...userFormData, price: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={userFormData.duration_days}
                  onChange={(e) => setUserFormData({ ...userFormData, duration_days: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>Features (comma-separated)</label>
              <input
                type="text"
                value={userFormData.features_text}
                onChange={(e) => setUserFormData({ ...userFormData, features_text: e.target.value })}
                style={inputStyle}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={userFormData.can_sell_products}
                onChange={(e) => setUserFormData({ ...userFormData, can_sell_products: e.target.checked })}
              />
              Grant Customer Product Selling Access (`can_sell_products`)
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" disabled={userSubmitting} className="btn btn-primary" style={{ backgroundColor: '#1E3A8A', color: '#fff' }}>
                {userSubmitting ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manual Assign Modal */}
      {showAssignModal && assigningPackage && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title={`Assign "${assigningPackage.name}"`}
        >
          <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>User ID *</label>
              <input
                type="number"
                required
                placeholder="e.g. 104"
                value={assignData.user_id}
                onChange={(e) => setAssignData({ ...assignData, user_id: e.target.value })}
                style={inputStyle}
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
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>Payment Reference</label>
              <input
                type="text"
                value={assignData.payment_reference}
                onChange={(e) => setAssignData({ ...assignData, payment_reference: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" disabled={assigning} className="btn btn-primary" style={{ backgroundColor: '#1E3A8A', color: '#fff' }}>
                {assigning ? 'Assigning...' : 'Confirm & Activate'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}
