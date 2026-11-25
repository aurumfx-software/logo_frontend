import React, { useState, useEffect } from 'react';
import {
  HiX,
  HiLocationMarker,
  HiCheckCircle,
  HiPhone,
  HiUser,
} from 'react-icons/hi';
import { saveDeliveryAddress, getSavedDeliveryAddress } from '../../api/productApi';
import './market-web.css';

export const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
];

export default function DeliveryAddressModal({ isOpen, onClose, onAddressSaved, initialAddress }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    district: '',
    pincode: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function init() {
      if (initialAddress) {
        setFormData({
          name: initialAddress.name || '',
          phone: (initialAddress.phone || '').replace(/[^0-9]/g, '').slice(-10),
          address: initialAddress.address || initialAddress.address_line1 || '',
          landmark: initialAddress.landmark || initialAddress.address_line2 || '',
          city: initialAddress.city || '',
          district: initialAddress.district || '',
          pincode: initialAddress.pincode || '',
        });
      } else {
        const saved = await getSavedDeliveryAddress();
        if (saved) {
          setFormData({
            name: saved.name || '',
            phone: (saved.phone || '').replace(/[^0-9]/g, '').slice(-10),
            address: saved.address || '',
            landmark: saved.landmark || '',
            city: saved.city || '',
            district: saved.district || '',
            pincode: saved.pincode || '',
          });
        } else {
          setFormData({
            name: '',
            phone: '',
            address: '',
            landmark: '',
            city: '',
            district: '',
            pincode: '',
          });
        }
      }
    }
    init();
  }, [initialAddress, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    const cleanPhone = formData.phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!formData.address.trim()) {
      setErrorMsg('Please enter your complete house/building street address');
      return;
    }

    if (!formData.district) {
      setErrorMsg('Please select your Kerala district');
      return;
    }

    const cleanPincode = formData.pincode.trim().replace(/[^0-9]/g, '');
    if (!cleanPincode || cleanPincode.length < 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: cleanPhone.slice(-10),
        address: formData.address.trim(),
        landmark: formData.landmark.trim(),
        city: formData.city.trim() || formData.district,
        district: formData.district,
        pincode: cleanPincode.slice(0, 6),
      };

      await saveDeliveryAddress(payload);
      if (onAddressSaved) onAddressSaved(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to save delivery address');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mkt-modal-backdrop" onClick={onClose}>
      <div className="mkt-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mkt-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiLocationMarker size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Delivery Address</h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Shipped across all 14 Kerala districts</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="mkt-nav-back-btn" style={{ width: '32px', height: '32px' }}>
            <HiX size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mkt-modal-body">
          {errorMsg && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '14px' }}>
              {errorMsg}
            </div>
          )}

          <div className="mkt-form-grid-2">
            <div className="mkt-form-group">
              <label className="mkt-form-label">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Nair"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mkt-form-input"
              />
            </div>

            <div className="mkt-form-group">
              <label className="mkt-form-label">10-Digit Mobile Phone *</label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10),
                  })
                }
                className="mkt-form-input"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="mkt-form-group">
            <label className="mkt-form-label">Building / House Name / Flat No & Street *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. TC 14/235, Green Villa, Temple Road"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mkt-form-textarea"
            />
          </div>

          <div className="mkt-form-grid-2">
            <div className="mkt-form-group">
              <label className="mkt-form-label">Landmark / Area (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Near HP Petrol Pump"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="mkt-form-input"
              />
            </div>

            <div className="mkt-form-group">
              <label className="mkt-form-label">City / Town *</label>
              <input
                type="text"
                required
                placeholder="e.g. Payyanur / Neyyattinkara"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mkt-form-input"
              />
            </div>
          </div>

          <div className="mkt-form-grid-2">
            <div className="mkt-form-group">
              <label className="mkt-form-label">Kerala District *</label>
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="mkt-form-select"
              >
                <option value="">-- Select District --</option>
                {KERALA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div className="mkt-form-group">
              <label className="mkt-form-label">6-Digit Postal Pincode *</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 695121"
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                  })
                }
                className="mkt-form-input"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              className="mkt-btn-secondary"
              style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="mkt-btn-buy-now"
              style={{ flex: 1.5, padding: '10px 16px', display: 'flex', justifyContent: 'center' }}
            >
              {isSaving ? 'Saving...' : 'Save Delivery Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
