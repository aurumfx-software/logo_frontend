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
  HiOutlineClock,
  HiOutlineChevronRight,
  HiExclamationCircle,
  HiExternalLink,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  getMarketCart,
  updateMarketCartQty,
  removeFromMarketCart,
  clearMarketCart,
  getSavedDeliveryAddress,
  getBuyerOrders,
  cancelBuyerOrder,
} from '../../api/productApi';

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received by seller' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Verified & packed' },
  { key: 'SHIPPED', label: 'Shipped', desc: 'In transit with courier' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Arriving soon' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Package handed over' },
];

export default function MarketCartDrawer({
  isOpen,
  onClose,
  initialTab = 'cart',
  onOpenAddressModal,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [cartItems, setCartItems] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [items, addr, orders] = await Promise.all([
        getMarketCart(),
        getSavedDeliveryAddress(),
        getBuyerOrders(),
      ]);
      setCartItems(items || []);
      setDeliveryAddress(addr || null);
      setBuyerOrders(orders || []);
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

  // Real-time synchronization event listeners
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

    // Minimum order check
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
    // Pass the first cart item's checkout or multi-item checkout params
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <HiOutlineShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-800">Kerala Marketplace</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 px-5 pt-2 gap-4 bg-white">
            <button
              onClick={() => setActiveTab('cart')}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === 'cart'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Shopping Cart ({totalItemsCount})
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === 'track'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Track Orders ({buyerOrders.length})
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mx-4 mt-3 p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <HiExclamationCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'cart' ? (
              cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <HiOutlineShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Your Cart is Empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Explore Kasavu Sarees, Malabar Spices, Traditional Sweets, and Authentic Kerala Goods!
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* Delivery Address Pill */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <HiLocationMarker className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">Deliver To</span>
                          {deliveryAddress?.name && (
                            <span className="text-xs font-semibold text-slate-600">
                              • {deliveryAddress.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {deliveryAddress?.address
                            ? `${deliveryAddress.address}, ${deliveryAddress.city || deliveryAddress.district}, Kerala - ${deliveryAddress.pincode}`
                            : 'No delivery address saved yet.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenAddressModal && onOpenAddressModal()}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0 px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {deliveryAddress?.address ? 'Change' : 'Add'}
                    </button>
                  </div>

                  {/* Free Delivery Banner */}
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <HiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free Delivery across Kerala on all marketplace orders!</span>
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-3">
                    {cartItems.map((item, idx) => {
                      const itemPrice = Number(item.product?.price || 0);
                      const originalPrice = Number(item.product?.originalPrice || item.product?.original_price || 0);
                      const qty = Number(item.quantity || 1);
                      const minRequiredQty =
                        itemPrice > 0 && itemPrice < 150 ? Math.ceil(150 / itemPrice) : 1;
                      const isBelowMin = itemPrice * qty < 150;

                      return (
                        <div
                          key={`${item.product?.id}-${item.size}-${idx}`}
                          className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex gap-3 relative group"
                        >
                          <img
                            src={
                              item.product?.image ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
                            }
                            alt={item.product?.name}
                            className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                          />

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                                  {item.product?.name}
                                </h4>
                                <button
                                  onClick={() => handleRemove(item.product?.id, item.size)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                                  title="Remove"
                                >
                                  <HiTrash className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="inline-block text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                                Size: {item.size || 'Standard'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-black text-slate-900">
                                  ₹{(itemPrice * qty).toLocaleString('en-IN')}
                                </span>
                                {originalPrice > itemPrice && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    ₹{(originalPrice * qty).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                                <button
                                  onClick={() =>
                                    handleQtyChange(item.product?.id, item.size, qty - 1)
                                  }
                                  className="p-1 hover:bg-slate-200 text-slate-600 rounded-l transition-colors"
                                >
                                  <HiMinus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-xs font-bold text-slate-800 font-mono">
                                  {qty}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQtyChange(item.product?.id, item.size, qty + 1)
                                  }
                                  className="p-1 hover:bg-slate-200 text-slate-600 rounded-r transition-colors"
                                >
                                  <HiPlus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Min order reminder pill */}
                            {itemPrice < 150 && (
                              <div className="mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
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
              <div className="space-y-3">
                {buyerOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <HiOutlineTruck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">No orders placed yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Your placed orders will show up here with live delivery status.
                    </p>
                  </div>
                ) : (
                  buyerOrders.map((ord, idx) => {
                    const status = (ord.delivery_status || ord.status || 'ORDERED').toUpperCase();
                    const isCancelled = ord.is_cancelled || status === 'CANCELLED';
                    const isDelivered = status === 'DELIVERED';

                    return (
                      <div
                        key={ord.id || ord.order_code || idx}
                        className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-black text-slate-800">
                              #{ord.order_code || ord.id}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {ord.placed_at ? new Date(ord.placed_at).toLocaleDateString() : 'Recent'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                              isCancelled
                                ? 'bg-rose-100 text-rose-700'
                                : isDelivered
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        {/* Item Details */}
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              ord.product_image ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
                            }
                            alt={ord.product_name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">
                              {ord.product_name || 'Marketplace Item'}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Size: {ord.selected_size || 'Standard'} • Qty: {ord.quantity || 1}
                            </p>
                            <span className="text-xs font-black text-blue-600">
                              ₹{(Number(ord.total_amount) || Number(ord.price) || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Cancelled Banner */}
                        {isCancelled && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
                            <span className="font-bold">Cancellation Reason:</span>{' '}
                            {ord.cancellation_reason || 'Buyer requested cancellation'}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                          <button
                            onClick={() => {
                              onClose();
                              navigate(`/order/${ord.id || ord.order_code}`);
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <span>Live Tracking</span>
                            <HiOutlineChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-2">
                            {(ord.seller_phone || ord.seller_whatsapp) && (
                              <a
                                href={`https://wa.me/91${String(
                                  ord.seller_whatsapp || ord.seller_phone
                                ).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                  `Inquiring regarding my order #${ord.order_code || ord.id}`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="Contact Seller on WhatsApp"
                              >
                                <FaWhatsapp className="w-4 h-4" />
                              </a>
                            )}

                            {!isCancelled && !isDelivered && (
                              <button
                                onClick={() => handleCancelOrder(ord.id || ord.order_code)}
                                disabled={cancellingId === (ord.id || ord.order_code)}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                              >
                                {cancellingId === (ord.id || ord.order_code)
                                  ? 'Cancelling...'
                                  : 'Cancel'}
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

          {/* Footer (Checkout Button) */}
          {activeTab === 'cart' && cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span className="font-semibold text-slate-800">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span className="text-base text-blue-600">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>Proceed to Checkout</span>
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
