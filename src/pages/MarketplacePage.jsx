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
  HiOutlineHeart,
  HiOutlineTruck,
  HiCheck,
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
  getSavedDeliveryAddress,
} from '../api/productApi';
import ProductCard from '../components/market/ProductCard';
import MarketCartDrawer from '../components/market/MarketCartDrawer';
import DeliveryAddressModal, { KERALA_DISTRICTS } from '../components/market/DeliveryAddressModal';
import CustomerAddProductModal from '../components/products/CustomerAddProductModal';
import { useAuth } from '../context/AuthContext';

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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [cartItems, setCartItems] = useState([]);
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
      setCartItems(cart || []);
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

  // Real-time synchronization event listeners
  useEffect(() => {
    const handleCartChanged = (e) => {
      const items = e?.detail || [];
      setCartItems(items);
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

    // Search query
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

    // Category
    if (selectedCategory && selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter((p) => (p.category || '').toLowerCase().includes(catLower));
    }

    // District
    if (selectedDistrict && selectedDistrict !== 'All Kerala') {
      list = list.filter(
        (p) => (p.district || '').toLowerCase() === selectedDistrict.toLowerCase()
      );
    }

    // Price range
    const activeRange = PRICE_RANGES.find((r) => r.id === selectedPriceRange);
    if (activeRange) {
      if (activeRange.min !== null) list = list.filter((p) => Number(p.price || 0) >= activeRange.min);
      if (activeRange.max !== null) list = list.filter((p) => Number(p.price || 0) <= activeRange.max);
    }

    // Sort
    if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => Number(b.discountPercent || 0) - Number(a.discountPercent || 0));
    } else {
      // Newest
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Back to Home"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">
                    Kerala Marketplace
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                    <HiSparkles className="w-3 h-3 text-blue-600" />
                    Verified Local Sellers
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Kasavu Sarees, Malabar Spices, Organic Produce & Authentic Kerala Crafts
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* My Orders Button */}
              <button
                onClick={() => {
                  setCartTab('track');
                  setIsCartOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <HiOutlineTruck className="w-4 h-4 text-slate-600" />
                <span>My Orders</span>
              </button>

              {/* Sell on Logo */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
              >
                <HiPlus className="w-4 h-4" />
                <span>Sell Product</span>
              </button>

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => {
                  setCartTab('cart');
                  setIsCartOpen(true);
                }}
                className="relative p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center"
                title="View Shopping Cart"
              >
                <HiShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search & Location Bar */}
          <div className="pb-3 flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <HiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Sarees, Spices, Handicrafts, Jewellery, Gadgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Kerala District Selector */}
            <div className="relative w-full sm:w-56 shrink-0">
              <HiLocationMarker className="absolute left-3 top-2.5 text-blue-600 w-4 h-4 pointer-events-none" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all cursor-pointer text-slate-800"
              >
                <option value="All Kerala">📍 All Kerala (14 Districts)</option>
                {KERALA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Horizontal Scrollable Categories ── */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
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
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
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
      <div className="bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Price Range Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Price:
              </span>
              {PRICE_RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedPriceRange(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    selectedPriceRange === r.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Sort & Stats */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                <span className="font-bold text-slate-900">{filteredProducts.length}</span> items
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 outline-none focus:border-blue-600 cursor-pointer shadow-sm"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-300"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Products Grid Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3">
                <div className="w-full aspect-square bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
              <HiOutlineAdjustments className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any items matching your selected filters or search query.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
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
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-slate-900/95 text-white text-xs font-bold shadow-2xl backdrop-blur-sm animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

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
