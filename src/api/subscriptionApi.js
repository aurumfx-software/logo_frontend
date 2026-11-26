import { apiFetch } from './apiClient';
import { getCustomerHeaders, getCustomerToken, fetchCustomerProfile } from './customerApi';
import { getMerchantToken } from './merchantApi';

function _getSubscriberHeaders(audience = 'USER') {
  const mToken = getMerchantToken();
  const cToken = getCustomerToken();
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('logo_admin_token') || '' : '';
  if (audience === 'MERCHANT') {
    const tok = mToken || adminToken || cToken;
    return tok
      ? { 'Content-Type': 'application/json', Authorization: tok.startsWith('Bearer ') ? tok : `Bearer ${tok}` }
      : { 'Content-Type': 'application/json' };
  }
  if (cToken) {
    return getCustomerHeaders();
  }
  if (adminToken) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
  }
  return { 'Content-Type': 'application/json' };
}

/**
 * Fetch all subscription packages (Optionally filter by USER or MERCHANT, or activeOnly)
 */
export async function fetchAdminSubscriptionPackages({ audience, activeOnly = false } = {}) {
  const query = new URLSearchParams();
  if (audience) query.append('audience', audience);
  if (activeOnly !== undefined) query.append('active_only', String(activeOnly));

  const url = `/api/v1/subscriptions/packages${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiFetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch subscription packages');
  }
  return data.data || data.packages || data || [];
}

/**
 * Fetch a single package by ID
 */
export async function fetchSubscriptionPackageById(packageId) {
  const response = await apiFetch(`/api/v1/subscriptions/packages/${packageId}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch package details');
  }
  return data.data || data;
}

/**
 * Admin: Create a new subscription package
 */
export async function createAdminSubscriptionPackage(packageData) {
  const response = await apiFetch('/api/v1/subscriptions/admin/packages', {
    method: 'POST',
    body: JSON.stringify(packageData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to create subscription package');
  }
  return data.data || data;
}

/**
 * Admin: Update an existing subscription package
 */
export async function updateAdminSubscriptionPackage(packageId, updateData) {
  const response = await apiFetch(`/api/v1/subscriptions/admin/packages/${packageId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to update subscription package');
  }
  return data.data || data;
}

/**
 * Admin: Deactivate / Delete a subscription package
 */
export async function deleteAdminSubscriptionPackage(packageId) {
  return updateAdminSubscriptionPackage(packageId, { is_active: false });
}

/**
 * Admin: Manually assign a subscription to a user or merchant shop
 */
export async function assignAdminSubscription(payload) {
  const response = await apiFetch('/api/v1/subscriptions/admin/assign', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to assign subscription');
  }
  return data.data || data;
}

/**
 * Customer/Merchant: Fetch current user's active subscriptions
 */
export async function fetchMyActiveSubscriptions(audience = 'USER', merchantProfileId = null) {
  const headers = _getSubscriberHeaders(audience);
  if (!headers.Authorization && !getCustomerToken() && !getMerchantToken()) {
    return null;
  }
  const qs = merchantProfileId ? `?merchant_profile_id=${encodeURIComponent(merchantProfileId)}` : '';
  const response = await apiFetch(`/api/v1/subscriptions/me/active${qs}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  return data?.data || data;
}

/**
 * Customer/Merchant: Subscribe to package
 */
export async function subscribeToPackage({
  package_id,
  merchant_profile_id = null,
  payment_reference = null,
  audience = 'USER',
}) {
  const body = { package_id: Number(package_id) };
  if (merchant_profile_id) body.merchant_profile_id = Number(merchant_profile_id);
  if (payment_reference) body.payment_reference = String(payment_reference);

  const response = await apiFetch('/api/v1/subscriptions/subscribe', {
    method: 'POST',
    headers: _getSubscriberHeaders(audience),
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.detail === 'string'
        ? data.detail
        : data.message || 'Failed to activate subscription'
    );
  }
  if (audience !== 'MERCHANT') {
    await fetchCustomerProfile().catch(() => null);
  }
  return data?.data || data;
}

/**
 * Customer/Merchant: Cancel an active subscription
 */
export async function cancelMySubscription(subscriptionId, audience = 'USER') {
  const response = await apiFetch(`/api/v1/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: _getSubscriberHeaders(audience),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to cancel subscription');
  }
  if (audience !== 'MERCHANT') {
    await fetchCustomerProfile().catch(() => null);
  }
  return data?.data || data;
}

/**
 * Check if customer has unlocked ₹500 Seller Plan to create products
 */
export function hasActiveSellerSubscription(customerUser, activeSubData = null) {
  if (!customerUser) return false;
  if (
    Boolean(customerUser.can_sell_products) ||
    Boolean(customerUser.is_subscriber) ||
    customerUser.subscription_plan === '500_SELLER'
  ) {
    return true;
  }
  const userSubs = activeSubData?.user_subscriptions || activeSubData?.subscriptions || [];
  if (Array.isArray(userSubs) && userSubs.length > 0) {
    return userSubs.some((s) => {
      const st = String(s.status || 'ACTIVE').toUpperCase();
      return st === 'ACTIVE' || st === 'PAID';
    });
  }
  return false;
}

/**
 * Launch Razorpay checkout for ₹500 Seller Subscription (exact match to mobile razorpayService.js)
 */
export async function startCustomerRazorpaySubscription({
  packageItem,
  packageObj,
  customerUser,
  audience = 'USER',
  merchantProfileId = null,
  onSuccess,
  onError,
  onDismiss,
}) {
  const pkg = packageItem || packageObj;
  if (!customerUser) {
    throw new Error('Please sign in first to purchase a subscription plan.');
  }
  if (!pkg) {
    throw new Error('Subscription package details missing.');
  }
  const pkgPrice = Number(pkg.price ?? pkg.amount ?? 500);
  const headers = _getSubscriberHeaders(audience);

  let targetPackageId = pkg.id;
  if (!targetPackageId || String(targetPackageId).startsWith('default')) {
    const serverPkgs = await fetchAdminSubscriptionPackages({ audience, activeOnly: true }).catch(() => []);
    const matched = Array.isArray(serverPkgs)
      ? serverPkgs.find((p) => Number(p.price ?? p.amount) === pkgPrice || p.code === pkg.code) || serverPkgs[0]
      : null;
    if (matched?.id) {
      targetPackageId = matched.id;
    } else {
      throw new Error('No active subscription package found on server.');
    }
  }

  if (pkgPrice <= 0) {
    const subRes = await subscribeToPackage({
      package_id: targetPackageId,
      merchant_profile_id: merchantProfileId,
      audience,
    });
    if (onSuccess) await onSuccess(subRes);
    return subRes;
  }

  if (!window.Razorpay) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout SDK'));
      document.body.appendChild(script);
    });
  }

  let orderRes = await apiFetch('/api/v1/subscriptions/razorpay/order', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      package_id: targetPackageId,
      package_code: pkg.code || undefined,
      merchant_profile_id: merchantProfileId ? Number(merchantProfileId) : undefined,
    }),
  });
  if (orderRes.status === 404) {
    orderRes = await apiFetch('/api/v1/wallet/topup/razorpay/order', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: pkgPrice, purpose: 'SUBSCRIPTION' }),
    });
  }
  const orderData = await orderRes.json().catch(() => ({}));
  if (!orderRes.ok) {
    throw new Error(
      typeof orderData.detail === 'string'
        ? orderData.detail
        : orderData.message || 'Failed to initialize Razorpay subscription order'
    );
  }

  const completeVerifiedSubscription = async (rzpPayload) => {
    const verifyRes = await apiFetch('/api/v1/subscriptions/razorpay/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        package_id: orderData.package_id || targetPackageId,
        package_code: orderData.package_code || pkg.code || undefined,
        merchant_profile_id: orderData.merchant_profile_id || (merchantProfileId ? Number(merchantProfileId) : undefined),
        razorpay_order_id: rzpPayload.razorpay_order_id,
        razorpay_payment_id: rzpPayload.razorpay_payment_id,
        razorpay_signature: rzpPayload.razorpay_signature,
      }),
    });
    if (verifyRes.ok) {
      const vJson = await verifyRes.json().catch(() => ({}));
      if (audience !== 'MERCHANT') {
        await fetchCustomerProfile().catch(() => null);
      }
      return vJson?.data || vJson;
    }
    if (verifyRes.status === 404) {
      return subscribeToPackage({
        package_id: targetPackageId,
        merchant_profile_id: merchantProfileId,
        payment_reference: rzpPayload.razorpay_payment_id || rzpPayload.razorpay_order_id,
        audience,
      });
    }
    const vErr = await verifyRes.json().catch(() => ({}));
    throw new Error(
      typeof vErr.detail === 'string' ? vErr.detail : vErr.message || 'Razorpay payment verification failed'
    );
  };

  // Dev simulated mode (does NOT touch personal user wallet)
  if (orderData.razorpay_order_id && orderData.razorpay_order_id.startsWith('order_dev_')) {
    const subRes = await completeVerifiedSubscription({
      razorpay_order_id: orderData.razorpay_order_id,
      razorpay_payment_id: `pay_dev_sub_${Date.now()}`,
      razorpay_signature: 'dev_signature_ok',
    });
    if (onSuccess) await onSuccess(subRes);
    return subRes;
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: orderData.razorpay_key_id,
      amount: orderData.amount_paise || Math.round(pkgPrice * 100),
      currency: orderData.currency || 'INR',
      name: 'Logo Kerala Marketplace',
      description: `${pkg?.name || 'Seller Plan'} (₹${pkgPrice})`,
      order_id: orderData.razorpay_order_id,
      prefill: {
        name: customerUser?.name || '',
        email: customerUser?.email || '',
        contact: customerUser?.phone || customerUser?.phone_number || '',
      },
      theme: { color: '#2563eb' },
      handler: async (response) => {
        try {
          const subRes = await completeVerifiedSubscription({
            razorpay_order_id: response.razorpay_order_id || orderData.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature || 'verified_sdk_sig',
          });
          if (onSuccess) await onSuccess(subRes);
          resolve(subRes);
        } catch (err) {
          if (onError) onError(err);
          reject(err);
        }
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
          resolve({ cancelled: true });
        },
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  });
}
