import React, { useState, useEffect } from 'react';
import {
  HiOutlineShoppingBag,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineExternalLink,
  HiOutlinePlus,
  HiOutlinePhotograph,
  HiCheckCircle,
  HiXCircle,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import PageHeader from '../components/UI/PageHeader';
import Modal from '../components/UI/Modal';
import StatusBadge from '../components/UI/StatusBadge';
import {
  fetchAdminProducts,
  updateAdminProductStatus,
  deleteAdminProduct,
  fetchAdminOrders,
  createCustomerProduct,
  fetchMyProducts,
  fetchMyOrders,
  updateCustomerProduct,
  deleteCustomerProduct,
} from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, ROLES } from '../utils/rbac';

const PRODUCT_CATEGORIES = [
  'Fashion & Traditional Wear',
  'Organic & Agro Products',
  'Handicrafts & Decor',
  'Spices & Gourmet',
  'Electronics & Accessories',
  'Home & Kitchen',
  'Health & Beauty',
  'Other Local Goods',
];

export default function Products() {
  const { user } = useAuth();
  const userRole = normalizeRole(user);
  const isAdmin = userRole === ROLES.ADMIN;
  const isSeller = !isAdmin && (userRole === ROLES.SELLER || (user?.email || '').toLowerCase() === 'user01@gmail.com');

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders'

  // Products State
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productFilter, setProductFilter] = useState('all'); // 'all' | 'PENDING' | 'APPROVED' | 'DENIED'
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Fashion & Traditional Wear',
    price: '',
    original_price: '',
    sizes: 'Free Size, S, M, L, XL',
    image_url: '',
    description: '',
    seller_name: user?.name || (isSeller ? 'user01' : 'Admin Seller'),
    seller_phone: user?.phone || '9847123456',
    seller_whatsapp: user?.phone || '9847123456',
    district: user?.district || 'Kannur',
    city: user?.city || 'Payyanur',
  });

  const [toastMsg, setToastMsg] = useState({ type: '', text: '' });

  const showToast = (type, text) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg({ type: '', text: '' }), 4000);
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      if (isSeller) {
        const data = await fetchMyProducts();
        setProducts(data || []);
      } else {
        const data = await fetchAdminProducts({
          status: productFilter === 'all' ? undefined : productFilter,
          search: productSearch || undefined,
        });
        setProducts(data || []);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      if (isSeller) {
        const data = await fetchMyOrders();
        setOrders(data || []);
      } else {
        const data = await fetchAdminOrders({
          search: orderSearch || undefined,
        });
        setOrders(data || []);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    } else {
      loadOrders();
    }
  }, [activeTab, productFilter]);

  // Handle Toggle Active (On/Off)
  const handleToggleActive = async (product) => {
    try {
      let updated;
      if (isSeller) {
        updated = await updateCustomerProduct(product.id, {
          is_active: !product.is_active,
        });
      } else {
        updated = await updateAdminProductStatus(product.id, {
          is_active: !product.is_active,
        });
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: updated.is_active } : p))
      );
      showToast(
        'success',
        `Product visibility turned ${updated.is_active ? 'ON (Visible on website)' : 'OFF (Hidden from website)'}`
      );
    } catch (err) {
      showToast('error', err.message || 'Could not update status');
    }
  };

  // Handle Admin Approval (Allow / Deny)
  const handleSetApproval = async (productId, statusVal) => {
    try {
      const updated = await updateAdminProductStatus(productId, {
        approval_status: statusVal,
        is_active: statusVal === 'APPROVED',
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, approval_status: updated.approval_status, is_active: updated.is_active } : p))
      );
      showToast(
        'success',
        statusVal === 'APPROVED'
          ? '✅ Product ALLOWED! Now live and visible on public landing page.'
          : '❌ Product DENIED. It will not be shown on landing page.'
      );
    } catch (err) {
      showToast('error', err.message || 'Could not update approval');
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      if (isSeller) {
        await deleteCustomerProduct(productId);
      } else {
        await deleteAdminProduct(productId);
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('success', 'Product deleted successfully');
    } catch (err) {
      showToast('error', err.message || 'Failed to delete product');
    }
  };

  // Handle Create Product Modal Submit
  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!newProduct.name.trim()) {
      setModalError('Please enter product title');
      return;
    }
    const numPrice = Number(newProduct.price);
    if (!numPrice || numPrice <= 0) {
      setModalError('Please enter a valid price in ₹');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const sizeArr = newProduct.sizes
        ? newProduct.sizes.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Free Size'];

      const payload = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || null,
        category: newProduct.category,
        price: numPrice,
        original_price: newProduct.original_price ? Number(newProduct.original_price) : null,
        sizes: sizeArr,
        images: newProduct.image_url.trim() ? [newProduct.image_url.trim()] : [],
        seller_name: newProduct.seller_name || user?.name || (isSeller ? 'user01' : 'Admin Seller'),
        seller_phone: newProduct.seller_phone || '9847123456',
        seller_whatsapp: newProduct.seller_whatsapp || '9847123456',
        district: newProduct.district || 'Kannur',
        city: newProduct.city || 'Payyanur',
      };

      const created = await createCustomerProduct(payload);
      if (isSeller) {
        showToast('success', '🎉 Product request submitted! Waiting for Admin approval before it appears on the landing page.');
      } else {
        showToast('success', '🎉 Product created and published live to landing page!');
      }
      setProducts((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        category: 'Fashion & Traditional Wear',
        price: '',
        original_price: '',
        sizes: 'Free Size, S, M, L, XL',
        image_url: '',
        description: '',
        seller_name: user?.name || (isSeller ? 'user01' : 'Admin Seller'),
        seller_phone: user?.phone || '9847123456',
        seller_whatsapp: user?.phone || '9847123456',
        district: user?.district || 'Kannur',
        city: user?.city || 'Payyanur',
      });
    } catch (err) {
      setModalError(err.message || 'Failed to create product');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Computed Stats
  const pendingCount = products.filter((p) => p.approval_status === 'PENDING').length;
  const activeCount = products.filter((p) => p.is_active && p.approval_status === 'APPROVED').length;
  const deniedCount = products.filter((p) => p.approval_status === 'DENIED').length;
  const totalViews = products.reduce((acc, p) => acc + (p.views_count || 0), 0);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (productFilter !== 'all') {
      if (productFilter === 'PENDING' && p.approval_status !== 'PENDING') return false;
      if (productFilter === 'APPROVED' && (p.approval_status !== 'APPROVED' || !p.is_active)) return false;
      if (productFilter === 'DENIED' && p.approval_status !== 'DENIED') return false;
    }
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchSeller = (p.seller_name || '').toLowerCase().includes(q);
      const matchCategory = (p.category || '').toLowerCase().includes(q);
      if (!matchName && !matchSeller && !matchCategory) return false;
    }
    return true;
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Toast Notification */}
      {toastMsg.text && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            right: 24,
            zIndex: 999999,
            padding: '12px 20px',
            borderRadius: 12,
            background: toastMsg.type === 'error' ? 'var(--danger)' : 'var(--primary)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 10px 25px rgba(108, 99, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>{toastMsg.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header (Exact Admin Layout) */}
      <PageHeader
        title={isSeller ? 'Products & Orders Platform' : 'Products & Marketplace'}
        subtitle={
          isSeller
            ? 'Welcome to your Seller Hub. Create and manage products here — submitted products are reviewed by Admin and go live on the landing page once allowed.'
            : 'Manage subscriber products, review pending requests, toggle On/Off and Allow/Deny settings, and process customer orders'
        }
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontWeight: 700,
            borderRadius: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <HiOutlinePlus size={18} />
          <span>+ Post Product</span>
        </button>
      </PageHeader>

      {/* Admin Alert Banner for Pending Requests */}
      {isAdmin && pendingCount > 0 && (
        <div
          style={{
            background: '#FEF3C7',
            border: '1.5px solid #F59E0B',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 800, color: '#92400E', fontSize: 14 }}>
                Action Required: {pendingCount} Seller Product Request{pendingCount > 1 ? 's' : ''} Pending Approval!
              </div>
              <div style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>
                Sellers have submitted products for review. Once you click "Allow", they will immediately be published live on the public landing page.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setProductFilter('PENDING')}
            style={{
              background: '#D97706',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Review {pendingCount} Pending Requests →
          </button>
        </div>
      )}

      {/* Seller Informational Banner */}
      {isSeller && (
        <div
          style={{
            background: pendingCount > 0 ? '#FFFBEB' : '#F0FDF4',
            border: pendingCount > 0 ? '1px solid #FCD34D' : '1px solid #BBF7D0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            color: pendingCount > 0 ? '#92400E' : '#166534',
          }}
        >
          <span style={{ fontSize: 20 }}>{pendingCount > 0 ? 'ℹ️' : '🌟'}</span>
          <div>
            <strong>Seller Workflow:</strong> When you click <strong>+ Post Product</strong>, your product is sent to the Admin team. Once Admin clicks "Allow", it will immediately appear on the Logo Kerala landing page for shoppers across Kerala to view and place orders!
            {pendingCount > 0 && (
              <span style={{ display: 'block', marginTop: 4, fontWeight: 700, color: '#B45309' }}>
                ⏳ You currently have {pendingCount} product{pendingCount > 1 ? 's' : ''} awaiting Admin review.
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4 Stats KPI Cards (Exact Admin Style) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Products
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
            {products.length}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
            {isSeller ? 'In your seller inventory' : 'Across all categories'}
          </span>
        </div>

        <div
          style={{
            background: pendingCount > 0 ? '#FEF3C7' : 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            border: pendingCount > 0 ? '1.5px solid #F59E0B' : '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: pendingCount > 0 ? '#92400E' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {isSeller ? '⏳ Pending Approval' : '⏳ Pending Requests'}
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: pendingCount > 0 ? '#D97706' : 'var(--text-secondary)', marginTop: 4 }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: 12, color: pendingCount > 0 ? '#B45309' : 'var(--text-light)', fontWeight: 600 }}>
            {isSeller ? 'Awaiting Admin review' : 'Require Admin Allow/Deny'}
          </span>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Live on Website
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>
            {activeCount}
          </div>
          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Approved &amp; Visible</span>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Customer Orders
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)', marginTop: 4 }}>
            {orders.length}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
            {isSeller ? 'Orders for your products' : 'Direct WhatsApp dispatches'}
          </span>
        </div>
      </div>

      {/* Tabs (Exact Admin Style) */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🛍️ Listed Products ({products.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Customer Orders ({orders.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LISTED PRODUCTS */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div>
          {/* Filter & Search Bar */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                <HiOutlineSearch
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)',
                    fontSize: 16,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search products or sellers..."
                  className="form-input"
                  style={{ paddingLeft: 38, height: 40 }}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 200, height: 40 }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Status:</span>
              <button
                type="button"
                className={`btn btn-sm ${productFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setProductFilter('all')}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  productFilter === 'PENDING'
                    ? 'btn-warning'
                    : pendingCount > 0
                    ? 'btn-outline'
                    : 'btn-outline'
                }`}
                onClick={() => setProductFilter('PENDING')}
                style={
                  productFilter === 'PENDING'
                    ? { background: '#D97706', color: '#ffffff', borderColor: '#D97706', fontWeight: 800 }
                    : pendingCount > 0
                    ? { borderColor: '#F59E0B', color: '#B45309', fontWeight: 700, background: '#FEF3C7' }
                    : {}
                }
              >
                ⏳ Pending ({pendingCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${productFilter === 'APPROVED' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => setProductFilter('APPROVED')}
              >
                Allowed ({activeCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${productFilter === 'DENIED' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setProductFilter('DENIED')}
              >
                Denied ({deniedCount})
              </button>
            </div>
          </div>

          {/* Products Content */}
          {isLoadingProducts ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px dashed var(--border)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🛍️</div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--text)' }}>No products found</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                {productSearch ? 'Try a different search keyword.' : 'Click below to post the first product!'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                + Post Product Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filteredProducts.map((p) => {
                const isLive = Boolean(p.is_active && p.approval_status === 'APPROVED');
                const mainImg = p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';

                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-xs)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {/* Image & Badges Header */}
                    <div style={{ height: 190, position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={mainImg}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Live On/Off Badge */}
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span
                          style={{
                            background: p.is_active ? 'var(--success)' : '#6B7280',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {p.is_active ? '● LIVE' : '○ HIDDEN'}
                        </span>
                      </div>

                      {/* Approval Status Badge */}
                      <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <span
                          style={{
                            background:
                              p.approval_status === 'APPROVED'
                                ? '#DCFCE7'
                                : p.approval_status === 'PENDING'
                                ? '#FEF3C7'
                                : '#FEE2E2',
                            color:
                              p.approval_status === 'APPROVED'
                                ? '#15803D'
                                : p.approval_status === 'PENDING'
                                ? '#B45309'
                                : '#B91C1C',
                            border:
                              p.approval_status === 'APPROVED'
                                ? '1px solid #BBF7D0'
                                : p.approval_status === 'PENDING'
                                ? '1px solid #FCD34D'
                                : '1px solid #FECACA',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {p.approval_status === 'APPROVED'
                            ? 'ALLOWED'
                            : p.approval_status === 'PENDING'
                            ? '⏳ PENDING'
                            : 'DENIED'}
                        </span>
                      </div>

                      {/* District Location */}
                      {p.district && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            left: 10,
                            background: 'rgba(26, 26, 46, 0.8)',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          📍 {p.city || p.district}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                        {p.category}
                      </span>
                      <h3 style={{ margin: '4px 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                        {p.name}
                      </h3>

                      {/* Price row */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>
                          ₹{p.price}
                        </span>
                        {p.original_price && (
                          <span style={{ fontSize: 13, color: 'var(--text-light)', textDecoration: 'line-through' }}>
                            ₹{p.original_price}
                          </span>
                        )}
                      </div>

                      {/* Sizes */}
                      {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                          {p.sizes.map((sz, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 11,
                                background: 'var(--bg)',
                                color: 'var(--text-secondary)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontWeight: 600,
                              }}
                            >
                              {sz}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Seller Info */}
                      <div
                        style={{
                          background: 'var(--bg)',
                          padding: '8px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          marginBottom: 14,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                          👤 Seller: {p.seller_name || 'Subscriber'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span>📞 {p.seller_phone || 'N/A'}</span>
                          {p.seller_whatsapp && (
                            <a
                              href={`https://api.whatsapp.com/send?phone=91${p.seller_whatsapp.replace(/[^0-9]/g, '').slice(-10)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#25D366', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}
                            >
                              <FaWhatsapp size={12} /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Counters */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-light)', marginBottom: 14 }}>
                        <span>👁️ {p.views_count || 0} views</span>
                        <span>•</span>
                        <span>📦 {p.orders_count || 0} orders</span>
                      </div>

                      {/* If PENDING: Special Notice / Admin Action Box */}
                      {p.approval_status === 'PENDING' && isAdmin && (
                        <div
                          style={{
                            background: '#FEF3C7',
                            border: '1.5px solid #F59E0B',
                            borderRadius: 8,
                            padding: '10px 12px',
                            marginBottom: 14,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E', marginBottom: 4 }}>
                            ⏳ Seller Request Submitted:
                          </div>
                          <p style={{ margin: '0 0 10px', fontSize: 11, color: '#78350F' }}>
                            Allow this product to publish it live on the public landing page!
                          </p>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => handleSetApproval(p.id, 'APPROVED')}
                              style={{ flex: 1, fontSize: 12, fontWeight: 800, padding: '7px 8px' }}
                            >
                              ✅ Allow &amp; Publish Live
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => handleSetApproval(p.id, 'DENIED')}
                              style={{ color: 'var(--danger)', borderColor: '#FECACA', fontSize: 12, fontWeight: 700 }}
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      )}

                      {p.approval_status === 'PENDING' && isSeller && (
                        <div
                          style={{
                            background: '#FFFBEB',
                            border: '1px solid #FCD34D',
                            borderRadius: 8,
                            padding: '10px 12px',
                            marginBottom: 14,
                            fontSize: 12,
                            color: '#92400E',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 18 }}>⏳</span>
                          <span>
                            Request submitted! Waiting for Admin approval before it goes live on the landing page.
                          </span>
                        </div>
                      )}

                      {/* Action Bar (Allow/Deny + Live On/Off + Delete) */}
                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: 12,
                          borderTop: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                        }}
                      >
                        {p.approval_status === 'APPROVED' ? (
                          <>
                            {/* Live On/Off Toggle Button */}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => handleToggleActive(p)}
                              style={{
                                flex: 1,
                                fontSize: 11,
                                fontWeight: 700,
                                color: p.is_active ? 'var(--success-dark)' : 'var(--text-secondary)',
                                background: p.is_active ? 'var(--success-light)' : 'var(--bg)',
                              }}
                            >
                              {p.is_active ? '● Live: ON' : '○ Live: OFF'}
                            </button>

                            {/* Admin Deny Button */}
                            {isAdmin && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => handleSetApproval(p.id, 'DENIED')}
                                style={{ color: 'var(--danger)', borderColor: '#FECACA' }}
                                title="Deny this product"
                              >
                                Deny
                              </button>
                            )}
                          </>
                        ) : p.approval_status === 'DENIED' ? (
                          <>
                            {isAdmin && (
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() => handleSetApproval(p.id, 'APPROVED')}
                                style={{ flex: 1 }}
                              >
                                Allow &amp; Publish Live
                              </button>
                            )}
                            {isSeller && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', flex: 1 }}>
                                ❌ Denied by Admin
                              </span>
                            )}
                          </>
                        ) : (
                          /* PENDING */
                          <div style={{ flex: 1, fontSize: 11, color: '#B45309', fontWeight: 700 }}>
                            {isAdmin ? '⚠️ Pending Approval above' : '⏳ Admin review in progress'}
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline btn-icon"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          style={{ color: 'var(--danger)' }}
                          title={isSeller ? 'Cancel / Delete Request' : 'Delete Product'}
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMER ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div>
          {/* Orders Search Bar */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div style={{ position: 'relative', width: 340 }}>
              <HiOutlineSearch
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                  fontSize: 16,
                }}
              />
              <input
                type="text"
                placeholder="Search orders by buyer name, phone, code..."
                className="form-input"
                style={{ paddingLeft: 38, height: 40 }}
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={loadOrders}
            >
              <HiOutlineRefresh size={14} style={{ marginRight: 6 }} /> Refresh Orders
            </button>
          </div>

          {/* Orders Table */}
          {isLoadingOrders ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px dashed var(--border)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--text)' }}>No orders placed yet</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                When customers order from the landing page, all details will appear here and route to the seller on WhatsApp!
              </p>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead style={{ background: 'var(--bg)', borderBottom: '1.5px solid var(--border)', color: 'var(--text)', fontWeight: 700 }}>
                    <tr>
                      <th style={{ padding: '14px 16px' }}>Order Code</th>
                      <th style={{ padding: '14px 16px' }}>Product</th>
                      <th style={{ padding: '14px 16px' }}>Buyer Details</th>
                      <th style={{ padding: '14px 16px' }}>Delivery Address &amp; Pincode</th>
                      <th style={{ padding: '14px 16px' }}>Qty &amp; Size</th>
                      <th style={{ padding: '14px 16px' }}>Total Amount</th>
                      <th style={{ padding: '14px 16px' }}>WhatsApp Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {ord.order_code}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{ord.product_name || `Product #${ord.product_id}`}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Seller ID: {ord.seller_id}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{ord.buyer_name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>📞 {ord.buyer_phone}</div>
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: 260 }}>
                          <div style={{ color: 'var(--text)' }}>{ord.buyer_address}</div>
                          <div style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                            PIN: {ord.buyer_pincode} • {ord.buyer_city || ord.buyer_district}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 700 }}>{ord.quantity}x</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>({ord.selected_size || 'Free Size'})</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--success-dark)', fontSize: 14 }}>
                          ₹{ord.total_price}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <a
                            href={`https://api.whatsapp.com/send?phone=91${ord.buyer_phone.replace(/[^0-9]/g, '').slice(-10)}&text=Hello%20${encodeURIComponent(ord.buyer_name)}%2C%20regarding%20your%20order%20%2A${ord.order_code}%2A%20on%20Logo%20Kerala.`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-success"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              textDecoration: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            <FaWhatsapp size={14} />
                            <span>WhatsApp Buyer</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POST PRODUCT (Exact Admin Modal Style) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isSeller ? '+ Post Product (Submit Request)' : '+ Post Product for Sale'}
        size="md"
      >
        {/* Role guidance banner */}
        {isSeller ? (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: 12,
              color: '#92400E',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <span>
              <strong>Admin Approval Required:</strong> When you submit this product, it will go to Admin as a pending request. Once Admin verifies and allows it, it will immediately appear on the Logo Kerala landing page!
            </span>
          </div>
        ) : (
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: 12,
              color: '#166534',
              marginBottom: 16,
            }}
          >
            ✨ <strong>Admin Mode:</strong> Products published by Admin are automatically approved and made live on the landing page immediately.
          </div>
        )}

        {modalError && (
          <div
            style={{
              background: 'var(--danger-light)',
              border: '1px solid #FECACA',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {modalError}
          </div>
        )}

        <form onSubmit={handleCreateProductSubmit}>
          <div className="form-group">
            <label className="form-label">Product Title / Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kasavu Saree / Wild Honey / Handmade Crafts"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Selling Price (₹) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 999"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Original MRP (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 1499"
                value={newProduct.original_price}
                onChange={(e) => setNewProduct({ ...newProduct, original_price: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Available Sizes (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Free Size, S, M, L, XL"
              value={newProduct.sizes}
              onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Image URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={newProduct.image_url}
              onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Seller Name</label>
              <input
                type="text"
                className="form-input"
                value={newProduct.seller_name}
                onChange={(e) => setNewProduct({ ...newProduct, seller_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seller WhatsApp</label>
              <input
                type="tel"
                className="form-input"
                value={newProduct.seller_whatsapp}
                onChange={(e) => setNewProduct({ ...newProduct, seller_whatsapp: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Product details, material, origin..."
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmittingProduct}
            >
              {isSubmittingProduct
                ? 'Submitting...'
                : isSeller
                ? 'Submit Request to Admin 🚀'
                : 'Publish Product Live 🚀'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
