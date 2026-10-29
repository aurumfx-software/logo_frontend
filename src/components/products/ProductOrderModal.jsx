import React, { useState } from 'react';
import {
  HiX,
  HiShoppingBag,
  HiCheckCircle,
  HiLocationMarker,
  HiPhone,
  HiUser,
  HiCheck,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { placeProductOrder } from '../../api/productApi';

export default function ProductOrderModal({ product, customerUser, isOpen, onClose }) {
  if (!isOpen || !product) return null;

  const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes
    : ['Standard'];

  const [selectedSize, setSelectedSize] = useState(availableSizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: customerUser?.name && !customerUser.name.startsWith('Customer (') ? customerUser.name : '',
    phone: customerUser?.phone ? customerUser.phone.replace(/[^0-9]/g, '').slice(-10) : '',
    address: customerUser?.address || '',
    city: customerUser?.city || '',
    district: customerUser?.district || 'Kannur',
    pincode: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const unitPrice = Number(product.price) || 0;
  const totalPrice = unitPrice * quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = formData.phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Please enter your complete delivery street address');
      return;
    }
    const cleanPincode = formData.pincode.trim().replace(/[^0-9]/g, '');
    if (!cleanPincode || cleanPincode.length < 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        product_id: product.id,
        buyer_name: formData.name.trim() || `Customer (${cleanPhone.slice(-4)})`,
        buyer_phone: cleanPhone,
        buyer_address: formData.address.trim(),
        buyer_location: formData.city.trim() || formData.district,
        buyer_city: formData.city.trim() || formData.district,
        buyer_district: formData.district,
        buyer_pincode: cleanPincode,
        selected_size: selectedSize,
        quantity: quantity,
        notes: formData.notes.trim() || null,
      };

      const res = await placeProductOrder(orderPayload);
      setOrderResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (orderResult?.whatsapp_url) {
      window.open(orderResult.whatsapp_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 540,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <HiShoppingBag size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                {orderResult ? 'Order Placed!' : 'Order Product'}
              </h2>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {orderResult ? 'Direct contact with local seller' : 'Delivered directly by verified seller'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <HiX size={18} />
          </button>
        </div>

        {orderResult ? (
          /* SUCCESS VIEW */
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div
              style={{
                width: 68,
                height: 68,
                background: '#dcfce7',
                color: '#16a34a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 34,
              }}
            >
              <HiCheckCircle size={44} />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
              Order Confirmed!
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>
              Your order has been recorded in the Logo Kerala system.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: 14,
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Order Code:</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>
                  #{orderResult.order_code}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Item:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  {product.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Size & Quantity:</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  {orderResult.selected_size || 'Standard'} &times; {orderResult.quantity}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Total Amount:</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#16a34a' }}>
                  ₹{orderResult.total_price.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              Tap the button below to send your full delivery address and order details directly to{' '}
              <strong>{product.seller_name || 'the seller'}</strong> on WhatsApp:
            </p>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              style={{
                width: '100%',
                padding: '14px',
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                marginBottom: 12,
              }}
            >
              <FaWhatsapp size={22} />
              <span>Send Order to Seller on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close & Browse More Products
            </button>
          </div>
        ) : (
          /* ORDER FORM */
          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            {/* Product Summary Row */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                padding: 12,
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                marginBottom: 18,
              }}
            >
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80'}
                alt={product.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 10,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#2563eb',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {product.category}
                </span>
                <h4
                  style={{
                    margin: '2px 0 6px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {product.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#16a34a' }}>
                    ₹{unitPrice.toLocaleString('en-IN')}
                  </span>
                  {product.original_price && Number(product.original_price) > unitPrice && (
                    <span
                      style={{
                        fontSize: 13,
                        color: '#94a3b8',
                        textDecoration: 'line-through',
                      }}
                    >
                      ₹{Number(product.original_price).toLocaleString('en-IN')}
                    </span>
                  )}
                  {product.district && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 7px',
                        borderRadius: 6,
                        fontWeight: 600,
                        marginLeft: 'auto',
                      }}
                    >
                      📍 {product.district}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sizes & Quantity Controls */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: availableSizes.length > 1 ? '1fr 120px' : '1fr',
                gap: 14,
                marginBottom: 18,
              }}
            >
              {availableSizes.length > 1 && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: 6,
                    }}
                  >
                    Select Size / Variant *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {availableSizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: selectedSize === sz ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: selectedSize === sz ? '#eff6ff' : '#ffffff',
                          color: selectedSize === sz ? '#1d4ed8' : '#475569',
                          transition: 'all 0.15s',
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  Quantity
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 10,
                    overflow: 'hidden',
                    width: 120,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{
                      width: 36,
                      height: 34,
                      background: '#f8fafc',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <div
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                      color: '#1e293b',
                    }}
                  >
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    style={{
                      width: 36,
                      height: 34,
                      background: '#f8fafc',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Buyer Details Fields */}
            <h4
              style={{
                margin: '0 0 10px',
                fontSize: 13,
                fontWeight: 800,
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Delivery & Contact Details
            </h4>

            {errorMsg && (
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  borderLeft: '4px solid #ef4444',
                  color: '#b91c1c',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10 digit number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                Delivery Address (House/Flat, Street, Landmark) *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Complete address where seller can deliver your order"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Town / City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payyanur"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  District *
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 8px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                    background: '#ffffff',
                  }}
                >
                  {[
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
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6 digits"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Total Bar & Submit Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 14,
                borderTop: '1.5px solid #f1f5f9',
                marginTop: 6,
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Total Amount</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#16a34a' }}>
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
