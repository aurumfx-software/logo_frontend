import React, { useState } from 'react';
import { HiX, HiPhotograph, HiPlus, HiCheckCircle, HiLockClosed } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { createCustomerProduct } from '../../api/productApi';

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

export default function CustomerAddProductModal({ customerUser, isOpen, onClose, onProductCreated }) {
  if (!isOpen) return null;

  const canSell = Boolean(customerUser?.can_sell_products || customerUser?.is_subscriber);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Fashion & Traditional Wear',
    price: '',
    original_price: '',
    sizes: 'Free Size',
    image_url: '',
    district: customerUser?.district || 'Kannur',
    city: customerUser?.city || 'Payyanur',
    seller_name: customerUser?.name && !customerUser.name.startsWith('Customer (') ? customerUser.name : '',
    seller_phone: customerUser?.phone ? customerUser.phone.replace(/[^0-9]/g, '').slice(-10) : '',
    seller_whatsapp: customerUser?.phone ? customerUser.phone.replace(/[^0-9]/g, '').slice(-10) : '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter a product title');
      return;
    }
    const numPrice = Number(formData.price);
    if (!numPrice || numPrice <= 0) {
      setErrorMsg('Please enter a valid price in ₹');
      return;
    }

    const cleanPhone = formData.seller_phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter your 10-digit WhatsApp/phone number for receiving orders');
      return;
    }

    const sizesArr = formData.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const imagesArr = formData.image_url.trim()
      ? [formData.image_url.trim()]
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        price: numPrice,
        original_price: formData.original_price ? Number(formData.original_price) : null,
        sizes: sizesArr.length > 0 ? sizesArr : ['Standard'],
        images: imagesArr,
        district: formData.district,
        city: formData.city,
        seller_name: formData.seller_name.trim() || customerUser?.name || 'Local Seller',
        seller_phone: cleanPhone,
        seller_whatsapp: formData.seller_whatsapp.trim().replace(/[^0-9]/g, '') || cleanPhone,
      };

      const res = await createCustomerProduct(payload);
      setSuccessMsg('Your product has been published to the Logo Kerala Marketplace!');
      if (onProductCreated) onProductCreated(res);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Could not publish product. Please check your seller subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactAdminFor500Plan = () => {
    const text = encodeURIComponent(
      `Hello Logo Kerala Admin, I am interested in subscribing to the ₹500 Seller Plan to sell my products on Logo Kerala Marketplace. My Name: ${customerUser?.name || ''}, Phone: ${customerUser?.phone || ''}. Please activate my account.`
    );
    window.open(`https://api.whatsapp.com/send?phone=919847123456&text=${text}`, '_blank');
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
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
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
                background: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <HiPlus size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                Sell Your Product
              </h2>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Logo Kerala ₹500 Subscriber Community Marketplace
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

        {!canSell ? (
          /* SUBSCRIPTION LOCKED VIEW */
          <div style={{ padding: 28, textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: '#fef3c7',
                color: '#d97706',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <HiLockClosed size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
              ₹500 Seller Subscription Required
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
              Subscribe to the Logo Kerala <strong>₹500 Seller Plan</strong> to showcase and sell your own products
              directly to thousands of buyers across all 14 districts of Kerala!
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: 20,
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                ⭐ What you get with ₹500 Subscription:
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                <li>Feature your products on the main Logo Kerala Landing Page</li>
                <li>Instant orders sent directly to your WhatsApp</li>
                <li>Full customer address, size, and quantity details provided</li>
                <li>0% commission on orders — deal directly with buyers</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleContactAdminFor500Plan}
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
                marginBottom: 10,
              }}
            >
              <FaWhatsapp size={22} />
              <span>Subscribe on WhatsApp (₹500 Plan)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 6,
              }}
            >
              Close
            </button>
          </div>
        ) : (
          /* ADD PRODUCT FORM FOR ALLOWED SUBSCRIBERS */
          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
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
            {successMsg && (
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: '#f0fdf4',
                  borderLeft: '4px solid #16a34a',
                  color: '#15803d',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                ✅ {successMsg}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Handmade Handloom Kasavu Saree"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                    background: '#ffffff',
                  }}
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1499"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  MRP / Strike Price (₹, optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1999"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
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
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Available Sizes / Variants *
                </label>
                <input
                  type="text"
                  placeholder="e.g. S, M, L, XL or Free Size"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Product Image URL (e.g. Unsplash or Cloud link)
              </label>
              <input
                type="url"
                placeholder="https://... (or leave empty for default placeholder)"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Product Description
              </label>
              <textarea
                rows={2}
                placeholder="Details about quality, material, usage, or warranty..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Your WhatsApp Number (to receive orders) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10 digit WhatsApp"
                  value={formData.seller_phone}
                  onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value.replace(/[^0-9]/g, '') })}
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
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Your District *
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
