import React, { useState, useEffect } from 'react';
import {
  HiShoppingBag,
  HiLocationMarker,
  HiTag,
  HiPlus,
  HiCheckCircle,
  HiSparkles,
} from 'react-icons/hi';
import { fetchPublicProducts } from '../../api/productApi';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Products', icon: '✨' },
  { id: 'Fashion', label: 'Fashion & Handloom', icon: '👗' },
  { id: 'Organic', label: 'Organic & Agro', icon: '🌿' },
  { id: 'Handicrafts', label: 'Handicrafts & Decor', icon: '🏺' },
  { id: 'Spices', label: 'Spices & Gourmet', icon: '🌶️' },
];

export default function LandingProductsSection({
  customerUser,
  onOpenOrderModal,
  onOpenAddProductModal,
}) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPublicProducts({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      setProducts(data || []);
    } catch (err) {
      console.warn('Failed to fetch public products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  useEffect(() => {
    const handleRefresh = () => loadProducts();
    window.addEventListener('logo:refresh_products', handleRefresh);
    return () => window.removeEventListener('logo:refresh_products', handleRefresh);
  }, [selectedCategory]);

  return (
    <section id="products-section" className="zeas-landing-section" style={{ background: '#f8fafc', padding: '60px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              <HiSparkles size={14} />
              <span>Community Marketplace</span>
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(22px, 3.5vw, 32px)',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              Direct from Kerala Sellers &amp; Subscribers
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748b', maxWidth: 640 }}>
              Discover unique handloom sarees, organic Wayanad spices, and handcrafted goods. 
              Orders are sent directly to the seller with your delivery address!
            </p>
          </div>

          {/* Action to list product */}
          <button
            type="button"
            onClick={onOpenAddProductModal}
            style={{
              padding: '11px 20px',
              borderRadius: 12,
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <HiPlus size={18} />
            <span>Sell Your Product (₹500 Plan)</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 12,
            marginBottom: 20,
            scrollbarWidth: 'none',
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
                  padding: '8px 18px',
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: active ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                  background: active ? '#2563eb' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
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

        {/* Products Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🛍️</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Loading marketplace products...</p>
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#ffffff',
              borderRadius: 16,
              border: '1.5px dashed #cbd5e1',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>🛍️</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#1e293b' }}>
              No products found in this category yet
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
              Be the first subscriber to showcase and sell your items here!
            </p>
            <button
              type="button"
              onClick={onOpenAddProductModal}
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
              + List Your Product
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {products.map((item) => {
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
                  <div style={{ position: 'relative', width: '100%', height: 210, overflow: 'hidden' }}>
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
                        onClick={() => onOpenOrderModal(item)}
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
      </div>
    </section>
  );
}
