import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiX,
  HiOutlineShoppingBag,
  HiTrash,
  HiPlus,
  HiMinus,
  HiLocationMarker,
  HiCheckCircle,
  HiOutlineTruck,
  HiOutlineChevronRight,
  HiExclamationCircle,
  HiHeart,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  getMarketCart,
  updateMarketCartQty,
  removeFromMarketCart,
  getSavedDeliveryAddress,
  getBuyerOrders,
  cancelBuyerOrder,
  getMarketplaceWishlist,
  removeFromMarketplaceWishlist,
} from '../../api/productApi';
import { isCustomerAuthenticated } from '../../api/customerApi';
import './market-web.css';

export default function MarketCartDrawer({
  isOpen,
  onClose,
  initialTab = 'cart',
  onOpenAddressModal,
  onRequireAuth,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [cartItems, setCartItems] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [items, addr, orders, wish] = await Promise.all([
        getMarketCart(),
        getSavedDeliveryAddress(),
        getBuyerOrders(),
        getMarketplaceWishlist().catch(() => null),
      ]);
      setCartItems(items || []);
      setDeliveryAddress(addr || null);
      setBuyerOrders(orders || []);
      setWishlistItems(wish?.items || []);
    } catch (err) {
      console.warn('Failed to load cart/orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setActiveTab(initialTab);
      loadData();
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleCartChanged = (e) => {
      if (e?.detail) setCartItems(e.detail);
    };
    const handleOrdersChanged = (e) => {
      if (e?.detail) setBuyerOrders(e.detail);
    };
    const handleAddressChanged = (e) => {
      if (e?.detail) setDeliveryAddress(e.detail);
    };

    window.addEventListener('logo-cart-changed', handleCartChanged);
    window.addEventListener('logo-buyer-orders-changed', handleOrdersChanged);
    window.addEventListener('logo-delivery-address-changed', handleAddressChanged);

    return () => {
      window.removeEventListener('logo-cart-changed', handleCartChanged);
      window.removeEventListener('logo-buyer-orders-changed', handleOrdersChanged);
      window.removeEventListener('logo-delivery-address-changed', handleAddressChanged);
    };
  }, []);

  const handleQtyChange = async (productId, size, newQty) => {
    const item = cartItems.find((it) => it.product?.id === productId && it.size === size);
    const itemPrice = Number(item?.product?.price || 0);
    const minQty = itemPrice > 0 && itemPrice < 150 ? Math.ceil(150 / itemPrice) : 1;

    if (newQty < minQty) {
      setErrorMsg(
        `"${item?.product?.name || 'Item'}" requires a min. order value of ₹150. Minimum ${minQty} items required.`
      );
      return;
    }
    setErrorMsg('');
    const updated = await updateMarketCartQty(productId, size, newQty);
    setCartItems(updated);
  };

  const handleRemove = async (productId, size) => {
    const updated = await removeFromMarketCart(productId, size);
    setCartItems(updated);
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    const p = Number(item.product?.price || 0);
    const q = Number(item.quantity || 1);
    return sum + p * q;
  }, 0);

  const totalItemsCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;

    if (!isCustomerAuthenticated()) {
      setErrorMsg('Please sign in first to proceed to purchase.');
      if (onRequireAuth) {
        onClose();
        onRequireAuth('Please sign in to proceed with checkout and payment.');
      }
      return;
    }

    for (const item of cartItems) {
      const itemPrice = Number(item.product?.price || 0);
      const itemQty = Number(item.quantity || 1);
      const itemTotal = itemPrice * itemQty;
      if (itemPrice > 0 && itemTotal < 150) {
        const reqQty = Math.ceil(150 / itemPrice);
        setErrorMsg(
          `"${item.product?.name || 'Item'}" requires a minimum order of ₹150. Increase quantity to at least ${reqQty} (Total: ₹${itemPrice * reqQty}).`
        );
        return;
      }
    }

    if (!deliveryAddress || !deliveryAddress.address || !deliveryAddress.phone) {
      setErrorMsg('Please add your delivery address before checkout');
      if (onOpenAddressModal) onOpenAddressModal();
      return;
    }

    onClose();
    const firstItem = cartItems[0];
    navigate(
      `/checkout?product_id=${firstItem.product.id}&selected_size=${encodeURIComponent(
        firstItem.size
      )}&quantity=${firstItem.quantity}`
    );
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Please enter a cancellation reason:', 'Changed my mind');
    if (!reason) return;

    setCancellingId(orderId);
    try {
      const updated = await cancelBuyerOrder(orderId, reason);
      setBuyerOrders(updated);
    } catch (err) {
      alert(err?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRemoveWishlist = async (productId) => {
    try {
      await removeFromMarketplaceWishlist(productId);
      setWishlistItems((prev) => prev.filter((it) => String(it.product_id || it.id) !== String(productId)));
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <div className="mkt-drawer-backdrop" onClick={onClose}>
      <div className="mkt-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mkt-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineShoppingBag size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Kerala Marketplace</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mkt-nav-back-btn"
            style={{ width: '32px', height: '32px' }}
          >
            <HiX size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mkt-drawer-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('cart')}
            className={`mkt-drawer-tab-btn ${activeTab === 'cart' ? 'is-active' : ''}`}
          >
            Cart ({totalItemsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`mkt-drawer-tab-btn ${activeTab === 'wishlist' ? 'is-active' : ''}`}
          >
            Liked ({wishlistItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`mkt-drawer-tab-btn ${activeTab === 'track' ? 'is-active' : ''}`}
          >
            Orders ({buyerOrders.length})
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiExclamationCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Drawer Body Content */}
        <div className="mkt-drawer-body">
          {activeTab === 'wishlist' ? (
            wishlistItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 10px', margin: 'auto 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <HiHeart size={28} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>No Liked Items Yet</h4>
                <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748b' }}>
                  Click the heart icon on any product in the marketplace to save your favorites here.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '8px 20px', fontSize: '12.5px', fontWeight: 800, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {wishlistItems.map((item) => {
                  const p = item.product || item;
                  const price = Number(p.price || 0);
                  const pId = item.product_id || p.id;
                  return (
                    <div
                      key={pId}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        alignItems: 'center',
                      }}
                    >
                      <img
                        src={p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                        alt={p.name}
                        style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          onClick={() => {
                            onClose();
                            navigate(`/product/${pId}`);
                          }}
                          style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                        >
                          {p.name}
                        </h4>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#2563eb', marginBottom: '6px' }}>
                          ₹{price.toLocaleString('en-IN')}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate(`/checkout?product_id=${pId}&selected_size=${encodeURIComponent(p.sizes?.[0] || 'Standard')}&quantity=1`);
                            }}
                            className="mkt-btn-buy-now"
                            style={{ padding: '4px 10px', fontSize: '11px', flex: 'unset' }}
                          >
                            Buy Now
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWishlist(pId)}
                            style={{ background: 'none', border: '1px solid #e2e8f0', color: '#94a3b8', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'cart' ? (
            cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 10px', margin: 'auto 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <HiOutlineShoppingBag size={28} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Your Cart is Empty</h4>
                <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748b' }}>
                  Explore Kasavu Sarees, Malabar Spices, and authentic goods from local Kerala merchants!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '8px 20px', fontSize: '12.5px', fontWeight: 800, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Delivery Address Pill */}
                <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <HiLocationMarker size={16} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                        {deliveryAddress?.address ? `Deliver To: ${deliveryAddress.name}` : 'Delivery Address'}
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                        {deliveryAddress?.address
                          ? `${deliveryAddress.address}, ${deliveryAddress.city || deliveryAddress.district}, Kerala - ${deliveryAddress.pincode}`
                          : 'No delivery address saved yet.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCustomerAuthenticated()) {
                        onClose();
                        if (onRequireAuth) onRequireAuth('Please sign in to save a delivery address.');
                        return;
                      }
                      onOpenAddressModal && onOpenAddressModal();
                    }}
                    style={{ fontSize: '11.5px', fontWeight: 800, color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    {deliveryAddress?.address ? 'Change' : '+ Add'}
                  </button>
                </div>

                {/* Free Delivery Banner */}
                <div style={{ padding: '8px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HiCheckCircle size={15} color="#059669" />
                  <span>Free Delivery Across Kerala on All Orders</span>
                </div>

                {/* Cart Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cartItems.map((item, idx) => {
                    const itemPrice = Number(item.product?.price || 0);
                    const origPrice = Number(item.product?.originalPrice || item.product?.original_price || 0);
                    const qty = Number(item.quantity || 1);
                    const minRequiredQty = itemPrice > 0 && itemPrice < 150 ? Math.ceil(150 / itemPrice) : 1;

                    return (
                      <div key={`${item.product?.id}-${item.size}-${idx}`} className="mkt-cart-item">
                        <img
                          src={item.product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                          alt={item.product?.name}
                          className="mkt-cart-item-img"
                        />
                        <div className="mkt-cart-item-details">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <h5 style={{ margin: 0, fontSize: '12.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                                {item.product?.name}
                              </h5>
                              <button
                                type="button"
                                onClick={() => handleRemove(item.product?.id, item.size)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                title="Remove"
                              >
                                <HiTrash size={15} />
                              </button>
                            </div>
                            <span style={{ display: 'inline-block', fontSize: '10.5px', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginTop: '3px' }}>
                              Size: {item.size || 'Standard'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                                ₹{(itemPrice * qty).toLocaleString('en-IN')}
                              </span>
                              {origPrice > itemPrice && (
                                <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                  ₹{(origPrice * qty).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="mkt-qty-selector" style={{ height: '30px' }}>
                              <button
                                type="button"
                                onClick={() => handleQtyChange(item.product?.id, item.size, qty - 1)}
                                className="mkt-qty-btn"
                                style={{ padding: '4px 8px' }}
                              >
                                <HiMinus size={11} />
                              </button>
                              <span className="mkt-qty-val" style={{ padding: '0 8px', fontSize: '12.5px' }}>{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleQtyChange(item.product?.id, item.size, qty + 1)}
                                className="mkt-qty-btn"
                                style={{ padding: '4px 8px' }}
                              >
                                <HiPlus size={11} />
                              </button>
                            </div>
                          </div>

                          {itemPrice < 150 && (
                            <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#92400e', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                              Min. ₹150 order required (Min. {minRequiredQty} items)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          ) : (
            /* Track Orders Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {buyerOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 10px', color: '#64748b' }}>
                  <HiOutlineTruck size={42} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>No orders placed yet</h4>
                  <p style={{ margin: 0, fontSize: '12px' }}>Your placed orders will show up here with live tracking.</p>
                </div>
              ) : (
                buyerOrders.map((ord, idx) => {
                  const status = (ord.delivery_status || ord.status || 'ORDERED').toUpperCase();
                  const isCancelled = ord.is_cancelled || status === 'CANCELLED';
                  const isDelivered = status === 'DELIVERED';

                  return (
                    <div key={ord.id || ord.order_code || idx} className="mkt-cart-item" style={{ flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>#{ord.order_code || ord.id}</strong>
                          <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>
                            {ord.placed_at ? new Date(ord.placed_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background: isCancelled ? '#fee2e2' : isDelivered ? '#d1fae5' : '#dbeafe',
                            color: isCancelled ? '#dc2626' : isDelivered ? '#059669' : '#2563eb',
                          }}
                        >
                          {status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img
                          src={ord.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                          alt={ord.product_name}
                          style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', background: '#f1f5f9' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h6 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ord.product_name}
                          </h6>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Size: {ord.selected_size || 'Standard'} • Qty: {ord.quantity || 1}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb' }}>
                            ₹{(Number(ord.total_amount) || Number(ord.price) || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {isCancelled && (
                        <div style={{ marginTop: '8px', padding: '6px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '11px', color: '#991b1b' }}>
                          <strong>Cancelled:</strong> {ord.cancellation_reason || 'Buyer requested cancellation'}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(`/order/${ord.id || ord.order_code}`);
                          }}
                          style={{ fontSize: '11.5px', fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <span>Live Tracking</span>
                          <HiOutlineChevronRight size={14} />
                        </button>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(ord.seller_phone || ord.seller_whatsapp) && (
                            <a
                              href={`https://wa.me/91${String(ord.seller_whatsapp || ord.seller_phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Inquiring regarding order #${ord.order_code || ord.id}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ padding: '4px 8px', background: '#ecfdf5', color: '#059669', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, textDecoration: 'none' }}
                            >
                              <FaWhatsapp size={13} />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {!isCancelled && !isDelivered && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(ord.id || ord.order_code)}
                              disabled={cancellingId === (ord.id || ord.order_code)}
                              style={{ padding: '4px 8px', background: '#fff', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {cancellingId === (ord.id || ord.order_code) ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer (Checkout CTA) */}
        {activeTab === 'cart' && cartItems.length > 0 && (
          <div className="mkt-drawer-footer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Items Total</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery</span>
                <strong style={{ color: '#059669' }}>FREE</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                <span>Total Payable</span>
                <span style={{ color: '#2563eb' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="mkt-btn-buy-now"
              style={{ width: '100%', flex: 'unset', padding: '12px 16px' }}
            >
              <span>Proceed to Checkout</span>
              <HiOutlineChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
