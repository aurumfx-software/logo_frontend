import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiShoppingBag,
  HiLocationMarker,
  HiSearch,
  HiX,
  HiChevronLeft,
  HiSparkles,
  HiOutlineAdjustments,
  HiOutlineTruck,
  HiPlus,
} from 'react-icons/hi';
import {
  fetchPublicProducts,
  fetchProductCategories,
  getMarketCart,
  addToMarketCart,
  getMarketplaceWishlist,
  addToMarketplaceWishlist,
  removeFromMarketplaceWishlist,
} from '../api/productApi';
import ProductCard from '../components/market/ProductCard';
import MarketCartDrawer from '../components/market/MarketCartDrawer';
import DeliveryAddressModal, { KERALA_DISTRICTS } from '../components/market/DeliveryAddressModal';
import CustomerAddProductModal from '../components/products/CustomerAddProductModal';
import { useAuth } from '../context/AuthContext';
import '../components/market/market-web.css';

const CATEGORY_ICONS = {
  'Kerala Kasavu Sarees': '✨',
  'Fashion & Traditional Wear': '👗',
  'Organic & Agro Products': '🌿',
  'Traditional Spices': '🌶️',
  'Handicrafts & Decor': '🏺',
  'Jewellery & Accessories': '💍',
  'Home & Kitchen': '🏠',
  'Health & Beauty': '🧴',
  'Electronics & Accessories': '📱',
  'Other Local Goods': '📦',
};

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
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || 'All Kerala');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Cart & Wishlist
  const [cartCount, setCartCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTab, setCartTab] = useState('cart');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Load Categories & Products
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, prods, cart, wish] = await Promise.all([
        fetchProductCategories().catch(() => []),
        fetchPublicProducts({}).catch(() => []),
        getMarketCart().catch(() => []),
        getMarketplaceWishlist().catch(() => null),
      ]);

      setCategoriesList(cats || []);
      setProducts(prods || []);
      setCartCount((cart || []).reduce((sum, it) => sum + Number(it.quantity || 1), 0));

      if (wish?.items && Array.isArray(wish.items)) {
        setWishlistIds(new Set(wish.items.map((it) => String(it.product_id || it.id))));
      }
    } catch (err) {
      console.warn('Failed to load marketplace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const handleCartChanged = (e) => {
      const items = e?.detail || [];
      setCartCount(items.reduce((sum, it) => sum + Number(it.quantity || 1), 0));
    };
    const handleRefresh = () => loadData();

    window.addEventListener('logo-cart-changed', handleCartChanged);
    window.addEventListener('logo:refresh_products', handleRefresh);

    return () => {
      window.removeEventListener('logo-cart-changed', handleCartChanged);
      window.removeEventListener('logo:refresh_products', handleRefresh);
    };
  }, []);

  // Wishlist Toggle
  const handleToggleWishlist = async (productId) => {
    const pId = String(productId);
    const newSet = new Set(wishlistIds);
    if (newSet.has(pId)) {
      newSet.delete(pId);
      setWishlistIds(newSet);
      await removeFromMarketplaceWishlist(pId);
      showToast('Removed from Wishlist');
    } else {
      newSet.add(pId);
      setWishlistIds(newSet);
      await addToMarketplaceWishlist(pId);
      showToast('Saved to Wishlist ❤️');
    }
  };

  // Quick Add to Cart
  const handleQuickAdd = async (product) => {
    const itemPrice = Number(product.price || 0);
    const minQty = itemPrice > 0 && itemPrice < 150 ? Math.ceil(150 / itemPrice) : 1;
    await addToMarketCart(product, minQty, product.sizes?.[0] || 'Standard');
    showToast(`Added ${product.name} to cart! 🛍️`);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.sellerName || '').toLowerCase().includes(q) ||
          (p.district || '').toLowerCase().includes(q)
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter((p) => (p.category || '').toLowerCase().includes(catLower));
    }

    if (selectedDistrict && selectedDistrict !== 'All Kerala') {
      list = list.filter(
        (p) => (p.district || '').toLowerCase() === selectedDistrict.toLowerCase()
      );
    }

    const activeRange = PRICE_RANGES.find((r) => r.id === selectedPriceRange);
    if (activeRange) {
      if (activeRange.min !== null) list = list.filter((p) => Number(p.price || 0) >= activeRange.min);
      if (activeRange.max !== null) list = list.filter((p) => Number(p.price || 0) <= activeRange.max);
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => Number(b.discountPercent || 0) - Number(a.discountPercent || 0));
    } else {
      list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
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

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'all' ||
    selectedDistrict !== 'All Kerala' ||
    selectedPriceRange !== 'all' ||
    sortBy !== 'newest';

  return (
    <div className="mkt-page-wrapper">
      {/* ── Top Navbar ── */}
      <header className="mkt-navbar">
        <div className="mkt-container">
          <div className="mkt-navbar-inner">
            {/* Left: Back & Title */}
            <div className="mkt-nav-left">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mkt-nav-back-btn"
                title="Back to Home"
              >
                <HiChevronLeft size={20} />
              </button>
              <div className="mkt-nav-title-group">
                <div className="mkt-nav-title-row">
                  <h1 className="mkt-nav-title">Kerala Marketplace</h1>
                  <span className="mkt-nav-verified-badge">
                    <HiSparkles size={12} />
                    Verified Local Sellers
                  </span>
                </div>
                <p className="mkt-nav-subtitle">
                  Kasavu Sarees, Malabar Spices, Organic Produce & Authentic Crafts
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="mkt-nav-actions">
              <button
                type="button"
                onClick={() => {
                  setCartTab('track');
                  setIsCartOpen(true);
                }}
                className="mkt-btn-secondary"
              >
                <HiOutlineTruck size={16} />
                <span>My Orders</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mkt-btn-sell"
              >
                <HiPlus size={16} />
                <span>Sell Product</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCartTab('cart');
                  setIsCartOpen(true);
                }}
                className="mkt-cart-trigger"
                title="View Shopping Cart"
              >
                <HiShoppingBag size={20} />
                {cartCount > 0 && <span className="mkt-cart-badge">{cartCount}</span>}
              </button>
            </div>
          </div>

          {/* Search & Location Bar */}
          <div className="mkt-search-bar-row">
            <div className="mkt-search-input-wrap">
              <HiSearch className="mkt-search-icon" />
              <input
                type="text"
                placeholder="Search Sarees, Spices, Handicrafts, Jewellery, Gadgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mkt-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mkt-search-clear-btn"
                >
                  <HiX size={16} />
                </button>
              )}
            </div>

            <div className="mkt-district-select-wrap">
              <HiLocationMarker className="mkt-pin-icon" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="mkt-district-select"
              >
                <option value="All Kerala">All Kerala (14 Districts)</option>
                {KERALA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Categories Pills Row */}
        <div className="mkt-categories-nav">
          <div className="mkt-container">
            <div className="mkt-categories-scroll">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`mkt-cat-pill ${selectedCategory === 'all' ? 'is-active' : ''}`}
              >
                <span>✨</span>
                <span>All Products</span>
              </button>

              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat;
                const icon = CATEGORY_ICONS[cat] || '📦';
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`mkt-cat-pill ${isSelected ? 'is-active' : ''}`}
                  >
                    <span>{icon}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ── Secondary Filter Bar: Price Range & Sorting ── */}
      <div className="mkt-subfilter-bar">
        <div className="mkt-container">
          <div className="mkt-subfilter-inner">
            <div className="mkt-price-chips">
              <span className="mkt-filter-label">Price:</span>
              {PRICE_RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedPriceRange(r.id)}
                  className={`mkt-price-chip ${selectedPriceRange === r.id ? 'is-active' : ''}`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="mkt-sort-controls">
              <span className="mkt-product-count">
                <strong>{filteredProducts.length}</strong> items
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mkt-sort-select"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="mkt-reset-btn">
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Responsive Product Grid ── */}
      <main className="mkt-container">
        {isLoading ? (
          <div className="mkt-product-grid">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="mkt-card"
                style={{ padding: '12px', animation: 'pulse 1.5s infinite' }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    background: '#e2e8f0',
                    borderRadius: '10px',
                    marginBottom: '10px',
                  }}
                />
                <div
                  style={{
                    height: '14px',
                    background: '#e2e8f0',
                    borderRadius: '4px',
                    width: '80%',
                    marginBottom: '6px',
                  }}
                />
                <div
                  style={{
                    height: '14px',
                    background: '#e2e8f0',
                    borderRadius: '4px',
                    width: '45%',
                  }}
                />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <HiOutlineAdjustments size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
              No products found
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                maxWidth: '360px',
                margin: '0 auto 16px',
              }}
            >
              We couldn't find any items matching your selected filters or search query.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#ffffff',
                background: '#2563eb',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="mkt-product-grid">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                isWishlisted={wishlistIds.has(String(prod.id))}
                onToggleWishlist={handleToggleWishlist}
                onQuickAddToCart={handleQuickAdd}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Toast Notification ── */}
      {toastMessage && <div className="mkt-toast">{toastMessage}</div>}

      {/* ── Slide-Out Cart Drawer ── */}
      <MarketCartDrawer
        isOpen={isCartOpen}
        initialTab={cartTab}
        onClose={() => setIsCartOpen(false)}
        onOpenAddressModal={() => setIsAddressModalOpen(true)}
      />

      {/* ── Delivery Address Modal ── */}
      <DeliveryAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSaved={() => {
          showToast('Delivery address updated!');
        }}
      />

      {/* ── Add Product Modal (Seller) ── */}
      <CustomerAddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        customerUser={user}
        onProductCreated={() => {
          showToast('Product published successfully!');
          loadData();
        }}
      />
    </div>
  );
}
