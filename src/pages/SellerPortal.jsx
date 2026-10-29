import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiShoppingBag,
  HiPlus,
  HiTrash,
  HiEye,
  HiLocationMarker,
  HiPhone,
  HiUser,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiArrowRight,
  HiLogout,
  HiSparkles,
  HiTag,
  HiChevronRight,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  fetchMyProducts,
  fetchMyOrders,
  createCustomerProduct,
} from '../api/productApi';
import {
  customerPhoneLogin,
  clearCustomerSession,
  getCustomerToken,
} from '../api/customerApi';
import { apiFetch } from '../api/apiClient';

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

export default function SellerPortal() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('logo_customer_user') || 'null');
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders'
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Seller Data
  const [myProducts, setMyProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Fashion & Traditional Wear',
    price: '',
    original_price: '',
    sizes: 'Free Size',
    image_url: '',
    description: '',
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const isLoggedIn = Boolean(currentUser && (currentUser.phone || currentUser.id));
  const isSellerAllowed = Boolean(currentUser?.can_sell_products || currentUser?.is_subscriber);

  const loadSellerData = async () => {
    if (!isLoggedIn) return;
    setLoadingData(true);
    try {
      const [prods, ords] = await Promise.all([
        fetchMyProducts().catch(() => []),
        fetchMyOrders().catch(() => []),
      ]);
      setMyProducts(prods || []);
      setMyOrders(ords || []);
    } catch (err) {
      console.warn('Failed to load seller data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadSellerData();
    }
  }, [isLoggedIn]);

  // Handle Quick Mobile Phone Login
  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const cleanPhone = phoneInput.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await customerPhoneLogin({
        phone: cleanPhone,
        name: nameInput.trim() || undefined,
      });
      setCurrentUser(res.customer);
      setPhoneInput('');
      setNameInput('');
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearCustomerSession();
    setCurrentUser(null);
    setMyProducts([]);
    setMyOrders([]);
  };

  // Handle Creating New Product
  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newProduct.name.trim()) {
      setFormError('Please enter a product title');
      return;
    }
    const numPrice = Number(newProduct.price);
    if (!numPrice || numPrice <= 0) {
      setFormError('Please enter a valid price in ₹');
      return;
    }

    setSubmittingProduct(true);
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
        seller_name: currentUser.name || 'Verified Seller',
        seller_phone: currentUser.phone || '',
        seller_whatsapp: currentUser.phone || '',
        district: currentUser.district || 'Kannur',
        city: currentUser.city || 'Payyanur',
      };

      const created = await createCustomerProduct(payload);
      setFormSuccess('Product published successfully to Logo Kerala marketplace!');
      setMyProducts((prev) => [created, ...prev]);
      setNewProduct({
        name: '',
        category: 'Fashion & Traditional Wear',
        price: '',
        original_price: '',
        sizes: 'Free Size',
        image_url: '',
        description: '',
      });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to publish product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiFetch(`/api/v1/customer/products/${productId}`, { method: 'DELETE' });
      setMyProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // Handle Product On/Off Toggle
  const handleToggleProductLive = async (product) => {
    try {
      const res = await apiFetch(`/api/v1/customer/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMyProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: updated.is_active } : p))
        );
      }
    } catch (err) {
      alert('Could not update visibility');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Navbar */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '16px 24px',
          boxShadow: '0 4px 20px rgba(2, 132, 199, 0.25)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#ffffff', color: '#0284c7', borderRadius: 8, padding: '6px 8px', fontWeight: 900, fontSize: 16 }}>
                LOGO
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Seller Hub <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20 }}>₹500 Plan</span>
              </span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              to="/#products-section"
              style={{
                textDecoration: 'none',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.15)',
                padding: '6px 14px',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <HiShoppingBag size={16} />
              <span>View Live Marketplace</span>
            </Link>

            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ffffff',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <HiLogout size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        {!isLoggedIn ? (
          /* LOGIN CARD FOR SELLER */
          <div style={{ maxWidth: 480, margin: '40px auto', background: '#ffffff', borderRadius: 20, boxShadow: '0 12px 36px rgba(0,0,0,0.08)', padding: '32px 28px', border: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px', boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)' }}>
                🛍️
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                ₹500 Subscriber Seller Hub
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                Enter your registered mobile number to manage your products, add items, and track orders received on WhatsApp.
              </p>
            </div>

            {authError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                {authError}
              </div>
            )}

            <form onSubmit={handlePhoneLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Your Mobile Number (ID)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '0 12px', height: 46 }}>
                  <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700, marginRight: 8 }}>+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 98471 23456"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 15, fontWeight: 600, color: '#0f172a' }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Your Name (Optional for first time login)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Saranya / Boutique Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '12px', fontSize: 14, color: '#0f172a', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: loginLoading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  transition: 'transform 0.15s',
                }}
              >
                {loginLoading ? 'Logging In...' : 'Enter Seller Dashboard →'}
              </button>
            </form>

            <div style={{ marginTop: 24, padding: '16px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                <HiSparkles />
                <span>₹500 Seller Subscription Perks:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                <li>Sell unlimited physical goods & home-made items</li>
                <li>Instant WhatsApp order routing with customer address & pincode</li>
                <li>Admin verified seller status on Logo Kerala</li>
              </ul>
            </div>
          </div>
        ) : (
          /* LOGGED IN SELLER DASHBOARD */
          <div>
            {/* Seller Profile & Banner */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '24px',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  {(currentUser.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                      {currentUser.name || 'Subscriber Seller'}
                    </h1>
                    {isSellerAllowed ? (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          padding: '3px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        ⭐ ₹500 Verified Seller
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '3px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        Pending ₹500 Activation
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, color: '#64748b', fontSize: 13 }}>
                    <span>📞 +91 {currentUser.phone}</span>
                    <span>•</span>
                    <span>📍 {currentUser.city || currentUser.district || 'Kerala'}</span>
                  </div>
                </div>
              </div>

              {isSellerAllowed ? (
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    padding: '12px 22px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <HiPlus size={18} />
                  <span>+ Post New Product</span>
                </button>
              ) : (
                <a
                  href="https://api.whatsapp.com/send?phone=918606080074&text=Hello%20Admin%2C%20I%20want%20to%20activate%20my%20%E2%82%B9500%20Seller%20Subscription%20Plan%20to%20sell%20my%20products."
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#25D366',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <FaWhatsapp size={16} />
                  <span>Activate ₹500 Seller Plan</span>
                </a>
              )}
            </div>

            {/* KPI Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  My Listed Products
                </span>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0284c7', marginTop: 4 }}>
                  {myProducts.length}
                </div>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Live on marketplace</span>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Customer Views
                </span>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', marginTop: 4 }}>
                  {myProducts.reduce((acc, p) => acc + (p.views_count || 0), 0)}
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Shopper impressions</span>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Orders Received
                </span>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>
                  {myOrders.length}
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Via direct WhatsApp</span>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #e2e8f0', marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'products' ? '3px solid #0284c7' : '3px solid transparent',
                  color: activeTab === 'products' ? '#0284c7' : '#64748b',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>📦 My Products ({myProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'orders' ? '3px solid #0284c7' : '3px solid transparent',
                  color: activeTab === 'orders' ? '#0284c7' : '#64748b',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>📋 Customer Orders ({myOrders.length})</span>
              </button>
            </div>

            {/* Tab 1: Products List */}
            {activeTab === 'products' && (
              <div>
                {loadingData ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    Loading your products...
                  </div>
                ) : myProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: 16, border: '1.5px dashed #cbd5e1' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🛍️</div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#1e293b' }}>No products listed yet</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                      Start selling your items on Logo Kerala today!
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      style={{ padding: '10px 20px', borderRadius: 10, background: '#0284c7', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Your First Product
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {myProducts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: 16,
                          border: '1.5px solid #e2e8f0',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', top: 10, left: 10 }}>
                            <span
                              style={{
                                background: p.is_active ? '#22c55e' : '#64748b',
                                color: '#ffffff',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {p.is_active ? '● LIVE' : '○ HIDDEN'}
                            </span>
                          </div>
                        </div>

                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                            {p.category}
                          </span>
                          <h3 style={{ margin: '4px 0 8px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                            {p.name}
                          </h3>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>₹{p.price}</span>
                            {p.original_price && (
                              <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>
                                ₹{p.original_price}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                            <span>👁️ {p.views_count || 0} views</span>
                            <span>•</span>
                            <span>📦 {p.orders_count || 0} orders</span>
                          </div>

                          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleProductLive(p)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 8,
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#334155',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {p.is_active ? 'Hide from Web' : 'Show on Web'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#dc2626',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="Delete Product"
                            >
                              <HiTrash size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Orders List */}
            {activeTab === 'orders' && (
              <div>
                {loadingData ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    Loading orders...
                  </div>
                ) : myOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: 16, border: '1.5px dashed #cbd5e1' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#1e293b' }}>No orders received yet</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                      When customers place orders from the marketplace, their full address and order details will appear here and on your WhatsApp!
                    </p>
                  </div>
                ) : (
                  <div style={{ background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                          <tr>
                            <th style={{ padding: '14px 16px' }}>Order Code</th>
                            <th style={{ padding: '14px 16px' }}>Product</th>
                            <th style={{ padding: '14px 16px' }}>Buyer Name & Contact</th>
                            <th style={{ padding: '14px 16px' }}>Delivery Address</th>
                            <th style={{ padding: '14px 16px' }}>Qty & Size</th>
                            <th style={{ padding: '14px 16px' }}>Total Amount</th>
                            <th style={{ padding: '14px 16px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody style={{ divideY: '1px solid #f1f5f9' }}>
                          {myOrders.map((ord) => (
                            <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0284c7' }}>
                                {ord.order_code}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{ord.product_name || 'Product'}</div>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{ord.buyer_name}</div>
                                <div style={{ color: '#64748b', fontSize: 12 }}>📞 {ord.buyer_phone}</div>
                              </td>
                              <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                                <div style={{ color: '#334155' }}>{ord.buyer_address}</div>
                                <div style={{ color: '#0284c7', fontSize: 11, fontWeight: 700 }}>
                                  PIN: {ord.buyer_pincode} • {ord.buyer_city || ord.buyer_district}
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ fontWeight: 700 }}>{ord.quantity}x</span>
                                <span style={{ color: '#64748b', marginLeft: 4 }}>({ord.selected_size || 'Free Size'})</span>
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 800, color: '#16a34a', fontSize: 14 }}>
                                ₹{ord.total_price}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <a
                                  href={`https://api.whatsapp.com/send?phone=91${ord.buyer_phone.replace(/[^0-9]/g, '').slice(-10)}&text=Hello%20${encodeURIComponent(ord.buyer_name)}%2C%20thank%20you%20for%20your%20order%20%2A${ord.order_code}%2A%20on%20Logo%20Kerala%21`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    background: '#25D366',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    fontSize: 12,
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
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                + Post Product for Sale
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateProductSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Product Title / Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kasavu Saree / Wild Honey / Handmade Crafts"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Selling Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 999"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Original MRP (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1499"
                    value={newProduct.original_price}
                    onChange={(e) => setNewProduct({ ...newProduct, original_price: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Available Sizes (comma separated)</label>
                <input
                  type="text"
                  placeholder="Free Size, S, M, L, XL"
                  value={newProduct.sizes}
                  onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Product Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Tell buyers about material, quality, origin..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingProduct}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: submittingProduct ? 'wait' : 'pointer',
                }}
              >
                {submittingProduct ? 'Publishing Product...' : 'Publish to Marketplace 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
