import { apiFetch, getAccessToken } from './apiClient';
import {
  isCustomerAuthenticated,
  getCustomerHeaders,
  getStoredCustomerUser,
  getCustomerToken,
} from './customerApi';

function _getActorToken() {
  const cTok = getCustomerToken();
  if (cTok && cTok.trim().length > 10) return cTok.trim();
  const mTok = typeof window !== 'undefined' ? localStorage.getItem('logo_merchant_token') : '';
  if (mTok && mTok.trim().length > 10) return mTok.trim();
  const accTok = getAccessToken();
  if (accTok && accTok.trim().length > 10) return accTok.trim();
  return '';
}

function _isActorAuthenticated() {
  return isCustomerAuthenticated() || _getActorToken().length > 10;
}

function _getActorHeaders(extra = {}) {
  const tok = _getActorToken();
  if (tok) {
    return {
      'Content-Type': 'application/json',
      Authorization: tok.startsWith('Bearer ') ? tok : `Bearer ${tok}`,
      ...extra,
    };
  }
  return getCustomerHeaders(extra);
}

function _getCustomerDeliveryAddressKey() {
  const user = getStoredCustomerUser();
  const uid = user?.id || user?.user_id || user?.phone || user?.email;
  return uid ? `@logo_delivery_address_${uid}` : null;
}

function _getOptionalCustomerHeaders() {
  return _getActorToken() ? _getActorHeaders() : { 'Content-Type': 'application/json' };
}

/**
 * Format media URL to ensure proper full URL with fallback
 */
export const formatMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  if (/^(https?:|data:|\/\/)/.test(cleanUrl)) {
    if (typeof window !== 'undefined' && window.location?.protocol === 'https:') {
      return cleanUrl.replace(/^http:\/\/168\.144\.18\.149:8000/i, 'https://168.144.18.149.sslip.io');
    }
    return cleanUrl;
  }
  const baseUrl = (window.__LOGO_API_BASE__ || '').replace(/\/$/, '');
  return `${baseUrl}${cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`}`;
};

/**
 * Normalize raw backend product object to unified schema (matches mobile app)
 */
export function normalizeProduct(p) {
  if (!p) return null;
  let images = p.images || [];
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }
  images = (Array.isArray(images) ? images : []).map(formatMediaUrl).filter(Boolean);
  if (images.length === 0 && p.image_url) {
    images = [formatMediaUrl(p.image_url)];
  }
  if (images.length === 0 && p.image) {
    images = [formatMediaUrl(p.image)];
  }

  const price = Number(p.price || 0);
  const originalPrice = p.original_price ? Number(p.original_price) : null;
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : Number(p.discount_percent || p.discountPercent || 0);

  const stockQuantity =
    p.stock_quantity !== undefined && p.stock_quantity !== null
      ? Number(p.stock_quantity)
      : p.stockQuantity !== undefined && p.stockQuantity !== null
      ? Number(p.stockQuantity)
      : null;

  const stockStatus = (
    p.stock_status ||
    p.stockStatus ||
    (stockQuantity !== null && stockQuantity <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK')
  ).toUpperCase();

  const inStock =
    p.in_stock !== undefined
      ? Boolean(p.in_stock)
      : stockStatus !== 'OUT_OF_STOCK' && (stockQuantity === null || stockQuantity > 0);

  const canAddStock =
    p.can_add_stock !== undefined
      ? Boolean(p.can_add_stock)
      : stockQuantity === 0 || !inStock || stockStatus === 'OUT_OF_STOCK';

  let sizes = ['Standard'];
  if (Array.isArray(p.sizes) && p.sizes.length > 0) {
    sizes = p.sizes;
  } else if (typeof p.sizes === 'string') {
    try {
      const parsed = JSON.parse(p.sizes);
      if (Array.isArray(parsed) && parsed.length > 0) sizes = parsed;
    } catch {
      sizes = p.sizes.split(',').map((s) => s.trim()).filter(Boolean);
    }
  } else if (p.size && typeof p.size === 'string') {
    sizes = p.size.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (sizes.length === 0) sizes = ['Standard'];

  const parseKvList = (raw) => {
    let list = raw;
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch {
        list = [];
      }
    }
    if (!Array.isArray(list)) return [];
    return list
      .filter((it) => it && typeof it === 'object' && (String(it.label || '').trim() || String(it.value || '').trim()))
      .map((it) => ({ label: String(it.label || '').trim(), value: String(it.value || '').trim() }));
  };

  const normHighlights = parseKvList(p.highlights);
  const normDetails = parseKvList(p.additional_details ?? p.additionalDetails);

  const normSubProducts = (Array.isArray(p.sub_products) ? p.sub_products : [])
    .filter((s) => s && typeof s === 'object' && s.id !== undefined)
    .map((s) => {
      const sImgs = (Array.isArray(s.images) ? s.images : s.image ? [s.image] : [])
        .map(formatMediaUrl)
        .filter(Boolean);
      const sPrice = Number(s.price || 0);
      const sOrig = s.original_price ? Number(s.original_price) : null;
      const sDiscount = sOrig && sOrig > sPrice ? Math.round(((sOrig - sPrice) / sOrig) * 100) : 0;
      return {
        id: String(s.id),
        parent_product_id: s.parent_product_id ?? null,
        name: s.name || 'Variant',
        description: s.description || '',
        category: s.category || p.category || 'General',
        price: sPrice,
        originalPrice: sOrig,
        original_price: sOrig,
        discountPercent: sDiscount,
        discount_percent: sDiscount,
        images: sImgs,
        image:
          sImgs[0] ||
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
        sizes: Array.isArray(s.sizes) ? s.sizes : [],
        size_stocks: s.size_stocks && typeof s.size_stocks === 'object' ? s.size_stocks : {},
        sizeStocks: s.size_stocks && typeof s.size_stocks === 'object' ? s.size_stocks : {},
        highlights: parseKvList(s.highlights),
        additional_details: parseKvList(s.additional_details ?? s.additionalDetails),
        stockQuantity: s.stock_quantity ?? null,
        stock_quantity: s.stock_quantity ?? null,
        stockStatus: s.stock_status || 'IN_STOCK',
        inStock: s.in_stock !== false,
        in_stock: s.in_stock !== false,
        district: s.district || p.district || 'Kerala',
        city: s.city || p.city || '',
        sellerName: s.seller_name || p.seller_name || '',
        sellerPhone: s.seller_phone || p.seller_phone || '',
        sellerWhatsapp: s.seller_whatsapp || s.seller_phone || p.seller_whatsapp || '',
      };
    });

  return {
    id: String(p.id),
    parent_product_id: p.parent_product_id ?? p.parentProductId ?? null,
    parentProductId: p.parent_product_id ?? p.parentProductId ?? null,
    sub_products: normSubProducts,
    subProducts: normSubProducts,
    sellerId: p.seller_id ?? p.sellerId ?? null,
    seller_id: p.seller_id ?? p.sellerId ?? null,
    name: p.name || 'Kerala Marketplace Item',
    description: p.description || '',
    category: p.category || 'General',
    price,
    originalPrice,
    original_price: originalPrice,
    discountPercent,
    discount_percent: discountPercent,
    images:
      images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
    image:
      images[0] ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    sizes,
    size_stocks: p.size_stocks && typeof p.size_stocks === 'object' ? p.size_stocks : {},
    sizeStocks: p.size_stocks && typeof p.size_stocks === 'object' ? p.size_stocks : {},
    stockStatus,
    stock_status: stockStatus,
    stockQuantity,
    stock_quantity: stockQuantity,
    inStock,
    in_stock: inStock,
    canAddStock,
    can_add_stock: canAddStock,
    is_active: p.is_active !== false,
    isActive: p.is_active !== false,
    approval_status: p.approval_status || 'APPROVED',
    district: p.district || 'Kerala',
    city: p.city || '',
    sellerName: p.seller_name || p.merchant_name || 'Subscribed Seller',
    seller_name: p.seller_name || p.merchant_name || 'Subscribed Seller',
    sellerPhone: p.seller_phone || '',
    seller_phone: p.seller_phone || '',
    sellerWhatsapp: p.seller_whatsapp || p.seller_phone || '',
    seller_whatsapp: p.seller_whatsapp || p.seller_phone || '',
    ordersCount: Number(p.orders_count ?? p.ordersCount ?? 0),
    orders_count: Number(p.orders_count ?? p.ordersCount ?? 0),
    viewsCount: Number(p.views_count ?? 0),
    rating: p.rating_average || p.rating || 4.8,
    reviewsCount: p.rating_count ?? p.reviews_count ?? p.reviews ?? 0,
    highlights: normHighlights,
    additional_details: normDetails,
    additionalDetails: normDetails,
  };
}

/**
 * Determine whether the currently signed-in customer is the seller of this product.
 */
export function isOwnProduct(product, user) {
  if (!product || !user) return false;
  const uid = String(user.id ?? user.user_id ?? '').trim();
  const sid = String(product.sellerId ?? product.seller_id ?? '').trim();
  if (uid && sid && uid === sid) return true;
  const uPhone = String(user.phone || '').replace(/[^0-9]/g, '').slice(-10);
  const sPhone = String(
    product.sellerWhatsapp || product.sellerPhone || product.seller_whatsapp || product.seller_phone || ''
  )
    .replace(/[^0-9]/g, '')
    .slice(-10);
  return uPhone.length === 10 && sPhone.length === 10 && uPhone === sPhone;
}

/**
 * Public: Fetch marketplace products (with category, district, search, sort, min_price, max_price)
 */
export async function fetchPublicProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.district && params.district !== 'all' && params.district !== 'All Kerala') {
    query.set('district', params.district);
  }
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  if (params.min_price !== undefined && params.min_price !== null) {
    query.set('min_price', String(params.min_price));
  }
  if (params.max_price !== undefined && params.max_price !== null) {
    query.set('max_price', String(params.max_price));
  }
  if (params.limit) query.set('limit', String(params.limit));
  if (params.skip) query.set('skip', String(params.skip));

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/v1/products${qs}`, { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to load marketplace products');
  }
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.products || data?.items || [];
  return list.map(normalizeProduct).filter((p) => !p.parent_product_id);
}

/**
 * Public: Fetch distinct product categories from backend
 */
export async function fetchProductCategories() {
  try {
    const res = await apiFetch('/api/v1/products/categories', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('fetchProductCategories error, using default categories:', err);
  }
  return [
    'Kerala Kasavu Sarees',
    'Fashion & Traditional Wear',
    'Organic & Agro Products',
    'Traditional Spices',
    'Handicrafts & Decor',
    'Jewellery & Accessories',
    'Home & Kitchen',
    'Health & Beauty',
    'Electronics & Accessories',
    'Other Local Goods',
  ];
}

/**
 * Public: Get single product details by ID
 */
export async function fetchProductById(id) {
  const cleanId = String(id || '').trim();
  try {
    const res = await apiFetch(`/api/v1/products/${cleanId}`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      const raw = data?.data || data?.product || data;
      return normalizeProduct(raw);
    }
  } catch (err) {
    console.warn(`fetchProductById(${cleanId}) endpoint notice:`, err?.message || err);
  }

  // Fallback: search in public products list
  try {
    const list = await fetchPublicProducts({ limit: 100 });
    const found = list.find((p) => String(p.id) === cleanId);
    if (found) return found;
  } catch (_) {}

  return null;
}

/**
 * Public: Fetch checkout rules (min_order_value, free_delivery_above, cod_fee, etc.)
 */
export async function fetchCheckoutRules() {
  try {
    const res = await apiFetch('/api/v1/orders/checkout-rules', { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return {
    min_order_value: 150.0,
    free_delivery_above: 499.0,
    delivery_fee: 40.0,
    cod_available: true,
    cod_fee: 40.0,
    free_cod_above: 500.0,
    online_discount_percentage: 0.0,
    online_discount_max_amount: 0.0,
  };
}

/**
 * Public: Fetch product ratings and reviews
 */
export async function fetchProductReviews(productId) {
  try {
    const res = await apiFetch(`/api/v1/products/${productId}/reviews`, { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return { reviews: [], total: 0, rating_average: 0, rating_count: 0 };
}

export async function submitProductReview(productId, { rating, title = '', comment = '' }) {
  if (!isCustomerAuthenticated()) {
    throw new Error('Please sign in to submit a review.');
  }
  const res = await apiFetch(`/api/v1/products/${productId}/reviews`, {
    method: 'POST',
    headers: getCustomerHeaders(),
    body: JSON.stringify({
      rating: Number(rating),
      title: title || undefined,
      comment: comment || undefined,
    }),
  });
  if (res.ok) return await res.json();
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || err.detail || 'Failed to submit review');
}

/**
 * Public / Buyer: Place single product order
 */
export async function placeProductOrder(orderData) {
  if (!isCustomerAuthenticated()) {
    throw new Error('Please sign in first to purchase products.');
  }
  const res = await apiFetch('/api/v1/products/order', {
    method: 'POST',
    headers: getCustomerHeaders(),
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!res.ok) {
    let msg = 'Failed to place order';
    if (Array.isArray(data.detail)) {
      msg = data.detail.map((e) => (typeof e === 'object' ? `${e.loc?.slice(-1)[0] || 'Field'}: ${e.msg}` : String(e))).join(', ');
    } else if (typeof data.detail === 'string') {
      msg = data.detail;
    } else if (data.message) {
      msg = data.message;
    }
    throw new Error(msg);
  }

  // Save receipt locally
  await saveBuyerOrderReceipt({
    id: data.id || data.order_code || data.code || Date.now(),
    order_code: data.order_code || data.code || `ORD-${Date.now()}`,
    product_id: orderData.product_id,
    product_name: data.product_name || orderData.product_name || orderData.product?.name || orderData.name,
    product_image: data.product_image || orderData.product_image || orderData.product?.image || orderData.image,
    seller_name: data.seller_name || orderData.seller_name || orderData.product?.seller_name || orderData.sellerName,
    seller_phone: data.seller_phone || orderData.seller_phone || orderData.product?.seller_phone || orderData.sellerPhone,
    seller_whatsapp: data.seller_whatsapp || orderData.seller_whatsapp || orderData.product?.seller_whatsapp || orderData.sellerWhatsapp,
    buyer_name: orderData.buyer_name,
    buyer_phone: orderData.buyer_phone,
    buyer_address: orderData.buyer_address,
    buyer_city: orderData.buyer_city,
    buyer_district: orderData.buyer_district,
    buyer_pincode: orderData.buyer_pincode,
    selected_size: orderData.selected_size,
    quantity: orderData.quantity,
    price: data.price || orderData.price || orderData.product?.price,
    total_amount: data.total_amount || orderData.total_amount,
    payment_method: orderData.payment_method || 'cod',
    delivery_status: 'ORDERED',
    status: 'ORDERED',
    created_at: new Date().toISOString(),
  });

  return data;
}

// ═════════════════════════════════════════════════════════════════════════════
// 🛒 MARKETPLACE CART STORAGE & SYNCHRONIZATION (Key: @logo_marketplace_cart)
// ═════════════════════════════════════════════════════════════════════════════

const CART_STORAGE_KEY = '@logo_marketplace_cart';

export async function getMarketCart() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (_) {}
  return [];
}

export async function saveMarketCart(cartItems) {
  try {
    const list = Array.isArray(cartItems) ? cartItems : [];
    const str = JSON.stringify(list);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CART_STORAGE_KEY, str);
      window.dispatchEvent(new CustomEvent('logo-cart-changed', { detail: list }));
    }
  } catch (_) {}
  return cartItems;
}

export async function addToMarketCart(product, quantity = 1, size = 'Standard') {
  const current = await getMarketCart();
  const cleanSize = size || product.sizes?.[0] || 'Standard';
  const existingIdx = current.findIndex(
    (item) => String(item.product?.id) === String(product.id) && item.size === cleanSize
  );

  if (existingIdx > -1) {
    current[existingIdx].quantity = (Number(current[existingIdx].quantity) || 1) + Number(quantity);
  } else {
    current.push({
      product,
      quantity: Number(quantity) || 1,
      size: cleanSize,
      addedAt: new Date().toISOString(),
    });
  }

  await saveMarketCart(current);
  return current;
}

export async function updateMarketCartQty(productId, size, quantity) {
  let current = await getMarketCart();
  if (quantity <= 0) {
    current = current.filter(
      (item) => !(String(item.product?.id) === String(productId) && item.size === size)
    );
  } else {
    const item = current.find(
      (item) => String(item.product?.id) === String(productId) && item.size === size
    );
    if (item) item.quantity = Number(quantity);
  }
  await saveMarketCart(current);
  return current;
}

export async function removeFromMarketCart(productId, size) {
  let current = await getMarketCart();
  current = current.filter(
    (item) => !(String(item.product?.id) === String(productId) && item.size === size)
  );
  await saveMarketCart(current);
  return current;
}

export async function clearMarketCart() {
  await saveMarketCart([]);
  return [];
}

// ═════════════════════════════════════════════════════════════════════════════
// 📍 DELIVERY ADDRESS MANAGEMENT (Key: @logo_delivery_address)
// ═════════════════════════════════════════════════════════════════════════════

const DELIVERY_ADDRESS_KEY = '@logo_delivery_address';

export async function getSavedDeliveryAddress() {
  if (!isCustomerAuthenticated()) {
    return null;
  }
  try {
    const key = _getCustomerDeliveryAddressKey();
    if (key && typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.address && parsed.phone) return parsed;
      }
    }
    // Check server addresses explicitly saved for this authenticated customer
    const serverAddrs = await getMarketplaceAddresses().catch(() => []);
    if (Array.isArray(serverAddrs) && serverAddrs.length > 0) {
      const def = serverAddrs.find((a) => a.is_default) || serverAddrs[0];
      if (def && (def.address_line1 || def.address || def.address_line)) {
        return {
          name: def.full_name || def.recipient_name || def.name || '',
          phone: def.phone || '',
          address: def.address_line1 || def.address_line || def.address || '',
          landmark: def.landmark || def.address_line2 || '',
          city: def.city || '',
          district: def.district || '',
          pincode: def.pincode || '',
        };
      }
    }
  } catch (_) {}
  return null;
}

export async function saveDeliveryAddress(addressData) {
  if (!isCustomerAuthenticated()) {
    throw new Error('Please sign in first to save a delivery address.');
  }
  try {
    const key = _getCustomerDeliveryAddressKey();
    const str = JSON.stringify(addressData);
    if (key && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, str);
      window.dispatchEvent(new CustomEvent('logo-delivery-address-changed', { detail: addressData }));
    }
    // Also attempt server sync for this logged-in customer
    createMarketplaceAddress({
      full_name: addressData.name,
      phone: addressData.phone,
      address_line1: addressData.address,
      landmark: addressData.landmark || '',
      city: addressData.city,
      district: addressData.district,
      pincode: addressData.pincode,
      is_default: true,
    }).catch(() => null);
  } catch (_) {}
  return addressData;
}

// ═════════════════════════════════════════════════════════════════════════════
// 📦 BUYER ORDERS & TRACKING (Key: @logo_buyer_orders + Backend Sync)
// ═════════════════════════════════════════════════════════════════════════════

const BUYER_ORDERS_KEY = '@logo_buyer_orders';

export async function getMarketplaceOrderHistory({ status, limit = 50, offset = 0 } = {}) {
  if (!_isActorAuthenticated()) return [];
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (limit) query.set('limit', String(limit));
  if (offset) query.set('offset', String(offset));
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/v1/marketplace/orders/history${qs}`, {
    method: 'GET',
    headers: _getActorHeaders(),
  });
  if (res.ok) {
    const json = await res.json();
    if (Array.isArray(json?.orders)) return json.orders;
    if (Array.isArray(json)) return json;
  }
  return [];
}

export async function getMarketplaceOrderTracking(orderId) {
  const res = await apiFetch(`/api/v1/marketplace/orders/${orderId}/tracking`, {
    method: 'GET',
    headers: _getOptionalCustomerHeaders(),
  });
  if (res.ok) return await res.json();
  throw new Error('Failed to load live tracking details');
}

export async function getMarketplaceOrderDetail(orderId) {
  const res = await apiFetch(`/api/v1/marketplace/orders/${orderId}`, {
    method: 'GET',
    headers: _getOptionalCustomerHeaders(),
  });
  if (res.ok) return await res.json();
  throw new Error('Failed to load order details');
}

export async function cancelMarketplaceOrder(orderId, reason = 'Buyer cancelled order') {
  const res = await apiFetch(`/api/v1/marketplace/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: _getOptionalCustomerHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (res.ok) return await res.json();
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || err.detail || 'Failed to cancel order');
}

export async function submitOrderReview(orderId, { rating, title = '', comment = '' }) {
  if (!isCustomerAuthenticated()) {
    throw new Error('Please sign in to submit a review.');
  }
  const res = await apiFetch(`/api/v1/marketplace/orders/${orderId}/review`, {
    method: 'POST',
    headers: getCustomerHeaders(),
    body: JSON.stringify({
      rating: Number(rating),
      title: title || undefined,
      comment: comment || undefined,
    }),
  });
  if (res.ok) return await res.json();
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || err.detail || 'Failed to submit review');
}

export async function getBuyerOrders() {
  if (!_isActorAuthenticated()) {
    return [];
  }
  let serverOrders = [];
  try {
    const list = await getMarketplaceOrderHistory({ limit: 50 });
    serverOrders = list.map((ord) => ({
      id: ord.id,
      order_code: ord.order_code,
      product_id: ord.product_id,
      product_name: ord.product_name,
      product_image: ord.product_image,
      seller_name: ord.seller_name,
      seller_phone: ord.seller_phone,
      seller_whatsapp: ord.seller_whatsapp,
      buyer_name: ord.buyer_name,
      buyer_phone: ord.buyer_phone,
      buyer_address: ord.buyer_address,
      buyer_city: ord.buyer_city,
      buyer_district: ord.buyer_district,
      buyer_pincode: ord.buyer_pincode,
      selected_size: ord.selected_size,
      quantity: ord.quantity,
      unit_price: Number(ord.unit_price ?? ord.price ?? 0),
      price: Number(ord.unit_price ?? ord.price ?? 0),
      total_price: Number(ord.total_price ?? ord.total_amount ?? 0),
      total_amount: Number(ord.total_price ?? ord.total_amount ?? 0),
      payment_status: ord.payment_status,
      payment_method: ord.payment_method,
      delivery_status: ord.delivery_status || ord.status || 'ORDERED',
      status: ord.status || ord.delivery_status || 'ORDERED',
      is_cancelled: Boolean(ord.is_cancelled),
      cancellation_reason: ord.cancellation_reason,
      cancelled_at: ord.cancelled_at,
      placed_at: ord.placed_at || ord.created_at,
      created_at: ord.created_at || ord.placed_at,
      estimated_delivery_date: ord.estimated_delivery_date,
      courier_partner: ord.courier_partner,
      tracking_number: ord.tracking_number,
      tracking_url: ord.tracking_url,
      whatsapp_url: ord.whatsapp_url,
    }));
  } catch (_) {}

  let localList = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(BUYER_ORDERS_KEY);
      if (raw) localList = JSON.parse(raw);
    }
  } catch (_) {}

  if (serverOrders.length === 0) return localList;

  // Merge server orders with local receipts
  const mergedMap = new Map();
  for (const ord of serverOrders) {
    const code = String(ord.id || ord.order_code);
    mergedMap.set(code, ord);
  }
  for (const ord of localList) {
    const code = String(ord.id || ord.order_code);
    if (!mergedMap.has(code)) {
      mergedMap.set(code, ord);
    }
  }

  return Array.from(mergedMap.values());
}

export async function saveBuyerOrderReceipt(orderData) {
  const list = await getBuyerOrders();
  const orderId = orderData.id || orderData.order_code || Date.now();
  const existingIdx = list.findIndex(
    (o) => String(o.id || o.order_code) === String(orderId)
  );

  let updated = [...list];
  if (existingIdx > -1) {
    updated[existingIdx] = { ...updated[existingIdx], ...orderData };
  } else {
    updated.unshift({
      id: orderId,
      ...orderData,
      placed_at: orderData.placed_at || new Date().toISOString(),
    });
  }

  const sliced = updated.slice(0, 100);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(BUYER_ORDERS_KEY, JSON.stringify(sliced));
      window.dispatchEvent(new CustomEvent('logo-buyer-orders-changed', { detail: sliced }));
    }
  } catch (_) {}
  return sliced;
}

export async function cancelBuyerOrder(orderId, reason = 'Buyer cancelled order') {
  try {
    await cancelMarketplaceOrder(orderId, reason);
  } catch (err) {
    console.warn('Backend cancel order notice:', err?.message || err);
  }

  const list = await getBuyerOrders();
  const updated = list.map((ord) => {
    if (String(ord.id || ord.order_code) === String(orderId)) {
      return {
        ...ord,
        status: 'CANCELLED',
        delivery_status: 'CANCELLED',
        is_cancelled: true,
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      };
    }
    return ord;
  });

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(BUYER_ORDERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('logo-buyer-orders-changed', { detail: updated }));
    }
  } catch (_) {}
  return updated;
}

export async function getBuyerOrderById(id) {
  // Try live fetch from backend tracking & detail
  try {
    const [tracking, detail] = await Promise.all([
      getMarketplaceOrderTracking(id).catch(() => null),
      getMarketplaceOrderDetail(id).catch(() => null),
    ]);
    if (tracking || detail) {
      return {
        id: detail?.id || tracking?.order_id || id,
        order_code: tracking?.order_code || detail?.order_code || id,
        status: tracking?.status || detail?.status || 'ORDERED',
        delivery_status: tracking?.delivery_status || detail?.delivery_status || 'ORDERED',
        is_cancelled: Boolean(tracking?.is_cancelled || detail?.is_cancelled),
        cancellation_reason: tracking?.cancellation_reason || detail?.cancellation_reason,
        cancelled_at: tracking?.cancelled_at || detail?.cancelled_at,
        created_at: tracking?.placed_at || detail?.created_at,
        placed_at: tracking?.placed_at || detail?.placed_at || detail?.created_at,
        estimated_delivery_date: tracking?.estimated_delivery_date || detail?.estimated_delivery_date,
        courier_partner: tracking?.courier_partner || detail?.courier_partner,
        tracking_number: tracking?.tracking_number || detail?.tracking_number,
        tracking_url: tracking?.tracking_url || detail?.tracking_url,
        product_id: detail?.product_id,
        product_name: detail?.product_name,
        product_image: detail?.product_image,
        selected_size: detail?.selected_size,
        quantity: detail?.quantity,
        unit_price: Number(detail?.unit_price ?? detail?.price ?? 0),
        price: Number(detail?.unit_price ?? detail?.price ?? 0),
        total_price: Number(detail?.total_price ?? detail?.total_amount ?? 0),
        total_amount: Number(detail?.total_price ?? detail?.total_amount ?? 0),
        payment_status: detail?.payment_status || tracking?.payment_status,
        payment_method: detail?.payment_method,
        delivery_steps: detail?.delivery_steps || tracking?.delivery_steps,
        buyer_name: detail?.buyer_name,
        buyer_phone: detail?.buyer_phone,
        buyer_address: detail?.buyer_address,
        buyer_city: detail?.buyer_city,
        buyer_district: detail?.buyer_district,
        buyer_pincode: detail?.buyer_pincode,
        seller_name: detail?.seller_name,
        seller_phone: detail?.seller_phone,
        seller_whatsapp: detail?.seller_whatsapp,
        whatsapp_url: detail?.whatsapp_url,
      };
    }
  } catch (_) {}

  // Fallback to local storage list
  const list = await getBuyerOrders();
  return (
    list.find((o) => String(o.id) === String(id) || String(o.order_code) === String(id)) || null
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ❤️ WISHLIST MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

export async function getMarketplaceWishlist() {
  if (!isCustomerAuthenticated()) return { items: [], total: 0 };
  try {
    const res = await apiFetch('/api/v1/marketplace/wishlist', {
      method: 'GET',
      headers: getCustomerHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (_) {}
  return { items: [], total: 0 };
}

export async function addToMarketplaceWishlist(productId) {
  if (!isCustomerAuthenticated()) {
    throw new Error('Please sign in to save items to your wishlist.');
  }
  const res = await apiFetch(`/api/v1/marketplace/wishlist/${productId}`, {
    method: 'POST',
    headers: getCustomerHeaders(),
  });
  if (res.ok) return await res.json();
  return { success: true };
}

export async function removeFromMarketplaceWishlist(productId) {
  if (!isCustomerAuthenticated()) {
    throw new Error('Please sign in to manage your wishlist.');
  }
  const res = await apiFetch(`/api/v1/marketplace/wishlist/${productId}`, {
    method: 'DELETE',
    headers: getCustomerHeaders(),
  });
  if (res.ok) return await res.json();
  return { success: true };
}

// ═════════════════════════════════════════════════════════════════════════════
// 🏡 SAVED ADDRESSES (BACKEND)
// ═════════════════════════════════════════════════════════════════════════════

export async function getMarketplaceAddresses() {
  if (!isCustomerAuthenticated()) return [];
  const res = await apiFetch('/api/v1/marketplace/addresses', {
    method: 'GET',
    headers: getCustomerHeaders(),
  });
  if (res.ok) {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  return [];
}

export async function createMarketplaceAddress(addressData) {
  if (!isCustomerAuthenticated()) return null;
  const res = await apiFetch('/api/v1/marketplace/addresses', {
    method: 'POST',
    headers: getCustomerHeaders(),
    body: JSON.stringify(addressData),
  });
  if (res.ok) return await res.json();
  return null;
}

export async function updateMarketplaceAddress(addressId, addressData) {
  if (!isCustomerAuthenticated()) return null;
  const res = await apiFetch(`/api/v1/marketplace/addresses/${addressId}`, {
    method: 'PATCH',
    headers: getCustomerHeaders(),
    body: JSON.stringify(addressData),
  });
  if (res.ok) return await res.json();
  return null;
}

export async function deleteMarketplaceAddress(addressId) {
  if (!isCustomerAuthenticated()) return false;
  const res = await apiFetch(`/api/v1/marketplace/addresses/${addressId}`, {
    method: 'DELETE',
    headers: getCustomerHeaders(),
  });
  return res.ok;
}

// ═════════════════════════════════════════════════════════════════════════════
// 🛠️ ADMIN & SELLER ENDPOINTS (PRESERVED)
// ═════════════════════════════════════════════════════════════════════════════

export async function fetchAdminProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (typeof params.is_active === 'boolean') query.set('is_active', String(params.is_active));
  if (params.search) query.set('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/v1/admin/products${qs}`, { method: 'GET' });
  if (!res.ok) throw new Error('Failed to load admin products');
  return await res.json();
}

export async function updateAdminProductStatus(productId, statusPayload) {
  const res = await apiFetch(`/api/v1/admin/products/${productId}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusPayload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.detail || 'Failed to update product status');
  return data;
}

export async function deleteAdminProduct(productId) {
  const res = await apiFetch(`/api/v1/admin/products/${productId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
  return await res.json();
}

export async function fetchAdminOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/v1/admin/products/orders${qs}`, { method: 'GET' });
  if (!res.ok) throw new Error('Failed to load orders');
  return await res.json();
}

export async function toggleUserSellerPermission(userId, payload) {
  const res = await apiFetch(`/api/v1/admin/users/${userId}/seller-permission`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.detail || 'Failed to update seller permission');
  return data;
}

export async function createAdminProduct(productData) {
  let res = await apiFetch('/api/v1/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }).catch(() => null);

  if (!res || !res.ok) {
    res = await apiFetch('/api/v1/customer/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = 'Failed to publish product';
    if (Array.isArray(data.detail)) {
      msg = data.detail.map((e) => (typeof e === 'object' ? `${e.loc?.slice(-1)[0] || 'Field'}: ${e.msg}` : String(e))).join(', ');
    } else if (typeof data.detail === 'string') {
      msg = data.detail;
    } else if (data.message) {
      msg = data.message;
    }
    throw new Error(msg);
  }
  return data;
}

export async function createCustomerProduct(productData) {
  if (!_isActorAuthenticated()) {
    throw new Error('Please sign in first to create products.');
  }
  const res = await apiFetch('/api/v1/customer/products', {
    method: 'POST',
    headers: _getActorHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = 'Failed to publish product';
    if (Array.isArray(data.detail)) {
      msg = data.detail.map((e) => (typeof e === 'object' ? `${e.loc?.slice(-1)[0] || 'Field'}: ${e.msg}` : String(e))).join(', ');
    } else if (typeof data.detail === 'string') {
      msg = data.detail;
    } else if (data.message) {
      msg = data.message;
    }
    throw new Error(msg);
  }
  return data;
}

export async function fetchMyProducts() {
  if (!_isActorAuthenticated()) return [];
  const res = await apiFetch('/api/v1/customer/products/my-products', {
    method: 'GET',
    headers: _getActorHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch your products');
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.products || data?.items || [];
  return list.map(normalizeProduct).filter((p) => !p.parent_product_id);
}

export async function fetchSellerAnalytics(period = 'all') {
  if (!_isActorAuthenticated()) return null;
  const res = await apiFetch(
    `/api/v1/customer/products/seller-analytics?period=${encodeURIComponent(period)}`,
    { method: 'GET', headers: _getActorHeaders() }
  );
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.data || json || null;
}

export async function addStockToProduct(id, quantity = 5) {
  if (!_isActorAuthenticated()) throw new Error('Please sign in to manage stock');
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const res = await apiFetch(`/api/v1/customer/products/${id}/add-stock`, {
    method: 'POST',
    headers: _getActorHeaders(),
    body: JSON.stringify({ quantity: qty }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || 'Failed to add stock');
  return normalizeProduct(data?.data || data?.product || data);
}

export async function fetchMyOrders() {
  if (!_isActorAuthenticated()) return [];
  const res = await apiFetch('/api/v1/customer/products/my-orders', {
    method: 'GET',
    headers: _getActorHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch received orders');
  return await res.json();
}

export async function updateSellerOrderStatus(orderId, status, notes = '', reason = '') {
  if (!_isActorAuthenticated()) throw new Error('Please sign in to update order status');
  const noteText = reason || notes || '';
  const res = await apiFetch(`/api/v1/customer/products/orders/${orderId}/status`, {
    method: 'PUT',
    headers: _getActorHeaders(),
    body: JSON.stringify({ status, notes: noteText, reason: noteText }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || 'Failed to update order status');
  return data;
}

export async function dispatchSellerOrder(orderId, dispatchData) {
  if (!_isActorAuthenticated()) throw new Error('Please sign in to dispatch order');
  const res = await apiFetch(`/api/v1/customer/products/orders/${orderId}/dispatch`, {
    method: 'PUT',
    headers: _getActorHeaders(),
    body: JSON.stringify(dispatchData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || 'Failed to dispatch order');
  return data;
}

export async function updateCustomerProduct(id, productData) {
  if (!_isActorAuthenticated()) throw new Error('Please sign in to update products');
  const res = await apiFetch(`/api/v1/customer/products/${id}`, {
    method: 'PUT',
    headers: _getActorHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.detail || 'Failed to update product');
  return normalizeProduct(data?.data || data?.product || data);
}

export async function deleteCustomerProduct(id) {
  if (!_isActorAuthenticated()) throw new Error('Please sign in to delete products');
  const res = await apiFetch(`/api/v1/customer/products/${id}`, {
    method: 'DELETE',
    headers: _getActorHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return await res.json();
}

// ═════════════════════════════════════════════════════════════════════════════
// 💳 RAZORPAY PAYMENT GATEWAY INTEGRATION (Matches Mobile App Razorpay Flow)
// ═════════════════════════════════════════════════════════════════════════════

export const DEFAULT_RAZORPAY_KEY = 'rzp_test_TvBAWzKfk5F60i';

let razorpayScriptLoadingPromise = null;

export function loadRazorpayWebScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }
  if (window.Razorpay) {
    return Promise.resolve(true);
  }
  if (razorpayScriptLoadingPromise) {
    return razorpayScriptLoadingPromise;
  }

  razorpayScriptLoadingPromise = new Promise((resolve) => {
    const existing = document.getElementById('razorpay-checkout-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptLoadingPromise;
}

/**
 * Call backend to start order payment session and generate Razorpay order ID
 */
export async function startOrderPayment(orderId, method = 'RAZORPAY') {
  if (!isCustomerAuthenticated()) {
    throw new Error('Please sign in to proceed with payment.');
  }
  const res = await apiFetch(`/api/v1/marketplace/orders/${orderId}/pay`, {
    method: 'POST',
    headers: getCustomerHeaders(),
    body: JSON.stringify({ method }),
  });
  const data = await res.json();
  if (!res.ok) {
    let msg = 'Failed to initialize payment';
    if (Array.isArray(data.detail)) {
      msg = data.detail.map((e) => (typeof e === 'object' ? e.msg : String(e))).join(', ');
    } else if (typeof data.detail === 'string') {
      msg = data.detail;
    } else if (data.message) {
      msg = data.message;
    }
    throw new Error(msg);
  }
  return data;
}

/**
 * Call backend to verify payment signature and mark order paid
 */
export async function verifyOrderPayment(orderId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!isCustomerAuthenticated()) {
    throw new Error('Please sign in to verify payment.');
  }
  const res = await apiFetch(`/api/v1/marketplace/orders/${orderId}/pay/verify`, {
    method: 'POST',
    headers: getCustomerHeaders(),
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    let msg = 'Failed to verify payment';
    if (Array.isArray(data.detail)) {
      msg = data.detail.map((e) => (typeof e === 'object' ? e.msg : String(e))).join(', ');
    } else if (typeof data.detail === 'string') {
      msg = data.detail;
    } else if (data.message) {
      msg = data.message;
    }
    throw new Error(msg);
  }
  return data;
}

/**
 * Full Razorpay Checkout orchestrator on Web (Matches Mobile App razorpayService.js)
 */
export async function startProductOrderRazorpayCheckout({
  orderId,
  orderCode,
  productName,
  amount,
  user,
  onSuccess,
  onError,
  onDismiss,
}) {
  if (!isCustomerAuthenticated()) {
    const authErr = new Error('Please sign in to complete online payment.');
    if (onError) onError(authErr);
    throw authErr;
  }
  try {
    // 1. Call backend to start payment session and generate Razorpay order
    const paySession = await startOrderPayment(orderId, 'RAZORPAY');

    const keyId = paySession?.razorpay_key_id || DEFAULT_RAZORPAY_KEY;
    const razorpayOrderId = paySession?.razorpay_order_id;
    const amountPaise = paySession?.amount_paise || Math.round(Number(amount) * 100);

    // If backend returned dev simulated order
    if (razorpayOrderId && razorpayOrderId.startsWith('order_dev_')) {
      try {
        const verifyRes = await verifyOrderPayment(orderId, {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `pay_dev_${Date.now()}`,
          razorpay_signature: 'dev_signature_ok',
        });
        if (onSuccess) {
          onSuccess({
            isSimulated: true,
            orderId,
            orderCode,
            verifyRes,
          });
        }
        return { success: true, isSimulated: true, verifyRes };
      } catch (devErr) {
        if (onError) onError(devErr);
        throw devErr;
      }
    }

    // 2. Open standard Razorpay Checkout Modal on Web
    await loadRazorpayWebScript();

    if (!window.Razorpay) {
      throw new Error('Razorpay payment gateway could not be loaded. Please check your internet connection.');
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount: amountPaise,
        currency: 'INR',
        name: 'LOGO Marketplace',
        description: `Order #${orderCode || orderId} - ${productName || 'Marketplace Item'}`,
        image: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/logo.png',
        ...(razorpayOrderId ? { order_id: razorpayOrderId } : {}),
        prefill: {
          name: user?.name || user?.business_name || '',
          contact: user?.phone || user?.phone_number || '',
          email: user?.email || '',
        },
        theme: {
          color: '#2563EB',
        },
        handler: async (response) => {
          try {
            let verifyRes = null;
            try {
              verifyRes = await verifyOrderPayment(orderId, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
            } catch (vErr) {
              console.warn('Payment verify notice:', vErr);
            }

            if (onSuccess) {
              onSuccess({
                isSimulated: false,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id || orderId,
                verifyRes,
              });
            }
            resolve({ success: true, verifyRes });
          } catch (verErr) {
            console.error('Payment verification failed:', verErr);
            if (onError) onError(verErr);
            reject(verErr);
          }
        },
        modal: {
          ondismiss: () => {
            if (onDismiss) onDismiss();
            resolve({ dismissed: true });
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    });
  } catch (err) {
    if (onError) onError(err);
    throw err;
  }
}
