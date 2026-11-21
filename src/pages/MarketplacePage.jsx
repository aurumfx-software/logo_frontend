import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiShoppingBag,
  HiLocationMarker,
  HiTag,
  HiPlus,
  HiSearch,
  HiX,
  HiChevronLeft,
  HiSparkles,
  HiOutlineAdjustments,
} from 'react-icons/hi';
import { fetchPublicProducts } from '../api/productApi';
import ProductOrderModal from '../components/products/ProductOrderModal';
import CustomerAddProductModal from '../components/products/CustomerAddProductModal';
import { useAuth } from '../context/AuthContext';

const KERALA_DISTRICTS = [
  'All Kerala',
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Categories', icon: '✨' },
  { id: 'Fashion', label: 'Fashion & Traditional', icon: '👗' },
  { id: 'Organic', label: 'Organic & Agro', icon: '🌿' },
  { id: 'Handicrafts', label: 'Handicrafts & Decor', icon: '🏺' },
  { id: 'Spices', label: 'Spices & Gourmet', icon: '🌶️' },
  { id: 'Electronics', label: 'Electronics & Gadgets', icon: '📱' },
  { id: 'Home', label: 'Home & Kitchen', icon: '🏠' },
  { id: 'Health', label: 'Health & Beauty', icon: '🧴' },
  { id: 'Other', label: 'Other Goods', icon: '📦' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'discount', label: 'Top Discounts' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'All Prices', min: null, max: null },
  { id: 'under_500', label: 'Under ₹500', min: 0, max: 500 },
  { id: '500_2000', label: '₹500 - ₹2,000', min: 500, max: 2000 },
  { id: '2000_10000', label: '₹2,000 - ₹10,000', min: 2000, max: 10000 },
  { id: 'above_10000', label: 'Above ₹10,000', min: 10000, max: null },
];

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('All Kerala');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals
  const [selectedOrderProduct, setSelectedOrderProduct] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load Products
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPublicProducts({});
      setProducts(data || []);
    } catch (err) {
      console.warn('Failed to load marketplace products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleRefresh = () => loadProducts();
    window.addEventListener('logo:refresh_products', handleRefresh);
    return () => window.removeEventListener('logo:refresh_products', handleRefresh);
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.district || '').toLowerCase().includes(q) ||
          (p.city || '').toLowerCase().includes(q) ||
          (p.seller_name || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter((p) => (p.category || '').toLowerCase().includes(catLower));
    }

    // District filter
    if (selectedDistrict !== 'All Kerala') {
      const distLower = selectedDistrict.toLowerCase();
      list = list.filter((p) => {
        const text = `${p.district || ''} ${p.city || ''} ${p.address || ''}`.toLowerCase();
        return text.includes(distLower);
      });
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const range = PRICE_RANGES.find((r) => r.id === selectedPriceRange);
      if (range) {
        list = list.filter((p) => {
          const price = Number(p.price) || 0;
          if (range.min !== null && price < range.min) return false;
          if (range.max !== null && price > range.max) return false;
          return true;
        });
      }
    }

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => {
        const discA = a.original_price ? Math.max(0, Number(a.original_price) - Number(a.price)) : 0;
        const discB = b.original_price ? Math.max(0, Number(b.original_price) - Number(b.price)) : 0;
        return discB - discA;
      });
    } else {
      // newest
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return list;
  }, [products, searchQuery, selectedCategory, selectedDistrict, selectedPriceRange, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDistrict('All Kerala');
    setSelectedPriceRange('all');
    setSortBy('newest');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Top Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Back & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#eff6ff',
                color: '#2563eb',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
              title="Back to Home"
            >
              <HiChevronLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Kerala Marketplace</span>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  LIVE DIRECT
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Handloom, Organic Goods, Crafts &amp; Spices from verified Kerala sellers
              </p>
            </div>
          </div>

          {/* Search bar & Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 640 }}>
            <div
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <HiSearch size={18} style={{ position: 'absolute', left: 14, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search Sarees, Organic Spices, Handicrafts, Gadgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 40px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                  background: '#f8fafc',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <HiX size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.28)',
              }}
            >
              <HiPlus size={16} />
              <span>Sell Your Product</span>
            </button>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '8px 20px',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: active ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  background: active ? '#2563eb' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  boxShadow: active ? '0 3px 10px rgba(37, 99, 235, 0.2)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: 1360, margin: '24px auto', padding: '0 20px' }}>
        {/* Filter and Sort Toolbar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Price Range Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginRight: 4 }}>
              PRICE:
            </span>
            {PRICE_RANGES.map((r) => {
              const active = selectedPriceRange === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedPriceRange(r.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    background: active ? '#eff6ff' : '#ffffff',
                    color: active ? '#2563eb' : '#475569',
                    transition: 'all 0.15s',
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* District & Sort Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* District Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiLocationMarker size={15} color="#2563eb" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e293b',
                  background: '#f8fafc',
                  border: selectedDistrict !== 'All Kerala' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e293b',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {(selectedCategory !== 'all' ||
              selectedDistrict !== 'All Kerala' ||
              selectedPriceRange !== 'all' ||
              searchQuery.trim() ||
              sortBy !== 'newest') && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ef4444',
                  background: '#fee2e2',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            {selectedCategory !== 'all'
              ? `${selectedCategory} Products`
              : 'All Verified Kerala Products'}{' '}
            <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>
              ({filteredProducts.length} items)
            </span>
          </h2>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Loading Kerala marketplace products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#ffffff',
              borderRadius: 20,
              border: '1.5px dashed #cbd5e1',
              maxWidth: 600,
              margin: '40px auto',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>🛍️</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#1e293b', fontWeight: 800 }}>
              No products found
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
              We couldn't find any products matching your selected filters. Try searching for something else or reset your filters.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                + List Your Product
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 22,
            }}
          >
            {filteredProducts.map((item) => {
              const unitP = Number(item.price) || 0;
              const origP = item.original_price ? Number(item.original_price) : 0;
              const discount = origP > unitP ? Math.round(((origP - unitP) / origP) * 100) : 0;
              const mainImg =
                item.images?.[0] ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1.5px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 0, 0, 0.12)';
                    e.currentTarget.style.borderColor = '#bfdbfe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {/* Image container */}
                  <div style={{ position: 'relative', width: '100%', height: 220, overflow: 'hidden' }}>
                    <img
                      src={mainImg}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                    />

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: '#ef4444',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        {discount}% OFF
                      </div>
                    )}

                    {/* District location badge */}
                    {item.district && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          background: 'rgba(15, 23, 42, 0.8)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <HiLocationMarker size={12} color="#38bdf8" />
                        <span>{item.city || item.district}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#2563eb',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 4,
                      }}
                    >
                      {item.category}
                    </span>

                    <h3
                      style={{
                        margin: '0 0 8px',
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#0f172a',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 40,
                      }}
                    >
                      {item.name}
                    </h3>

                    {/* Sizes Pill row */}
                    {Array.isArray(item.sizes) && item.sizes.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {item.sizes.slice(0, 3).map((sz, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 11,
                              background: '#f1f5f9',
                              color: '#475569',
                              padding: '2px 7px',
                              borderRadius: 4,
                              fontWeight: 600,
                            }}
                          >
                            {sz}
                          </span>
                        ))}
                        {item.sizes.length > 3 && (
                          <span style={{ fontSize: 11, color: '#94a3b8', padding: '2px 4px' }}>
                            +{item.sizes.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price and Order Row */}
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: 12,
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>
                            ₹{unitP.toLocaleString('en-IN')}
                          </span>
                          {origP > unitP && (
                            <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{origP.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          By {item.seller_name || 'Verified Seller'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderProduct(item);
                          setIsOrderModalOpen(true);
                        }}
                        style={{
                          padding: '9px 16px',
                          borderRadius: 10,
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
                      >
                        <HiShoppingBag size={15} />
                        <span>Order Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Order Modal */}
      <ProductOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setSelectedOrderProduct(null);
        }}
        product={selectedOrderProduct}
        customerUser={user}
      />

      {/* Customer Add Product Modal */}
      <CustomerAddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        customerUser={user}
        onProductCreated={() => {
          loadProducts();
        }}
      />
    </div>
  );
}
