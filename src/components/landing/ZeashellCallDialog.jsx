import React, { useState } from 'react';
import { HiX, HiPhone, HiCheckCircle } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

export default function ZeashellCallDialog({
  isOpen,
  onClose,
  merchant,
  phoneNumber,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !merchant) return null;

  const shopName = merchant.business_name || merchant.name || 'Verified Merchant';
  const category = merchant.category || 'Local Shop';
  const rawPhone =
    phoneNumber ||
    merchant.phone ||
    merchant.phone_number ||
    merchant.contact_number ||
    merchant.whatsapp ||
    merchant.mobile ||
    '';
  const cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '');

  const handleCall = () => {
    if (!cleanPhone) return;
    window.open(`tel:${cleanPhone}`, '_self');
  };

  const handleWhatsApp = () => {
    if (!cleanPhone) return;
    const num = cleanPhone.startsWith('+') ? cleanPhone.replace('+', '') : `91${cleanPhone.replace(/^0+/, '')}`;
    const text = encodeURIComponent(`Hello ${shopName}, I found your shop on Logo App and would like to inquire about your products/services.`);
    window.open(`https://wa.me/${num}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    if (!cleanPhone) return;
    navigator.clipboard.writeText(cleanPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden',
          position: 'relative',
          padding: '24px',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          <HiX size={18} />
        </button>

        {/* Icon Circle */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
          }}
        >
          <HiPhone size={26} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HiCheckCircle size={14} /> Verified Merchant
          </span>
          <span style={{ color: '#cbd5e1' }}>&bull;</span>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{category}</span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px' }}>
          {shopName}
        </h3>

        {/* Phone Number Pill */}
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', letterSpacing: '0.5px' }}>
            {cleanPhone || 'No phone number available'}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied ? '#16a34a' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={handleCall}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            <HiPhone size={18} /> Call Merchant Now
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
            }}
          >
            <FaWhatsapp size={18} /> Chat on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
