import React, { useState, useEffect } from 'react';
import {
  HiX,
  HiLocationMarker,
  HiCheckCircle,
  HiSparkles,
} from 'react-icons/hi';
import { saveDeliveryAddress, getSavedDeliveryAddress } from '../../api/productApi';
import { isCustomerAuthenticated } from '../../api/customerApi';
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

const KERALA_DISTRICT_COORDS = [
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { name: 'Kollam', lat: 8.8932, lng: 76.6141 },
  { name: 'Pathanamthitta', lat: 9.2648, lng: 76.7870 },
  { name: 'Alappuzha', lat: 9.4981, lng: 76.3388 },
  { name: 'Kottayam', lat: 9.5916, lng: 76.5222 },
  { name: 'Idukki', lat: 9.9189, lng: 77.1025 },
  { name: 'Ernakulam', lat: 9.9816, lng: 76.2999 },
  { name: 'Thrissur', lat: 10.5276, lng: 76.2144 },
  { name: 'Palakkad', lat: 10.7867, lng: 76.6548 },
  { name: 'Malappuram', lat: 11.0510, lng: 76.0711 },
  { name: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
  { name: 'Wayanad', lat: 11.6854, lng: 76.1320 },
  { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
  { name: 'Kasaragod', lat: 12.4996, lng: 74.9869 },
];

function matchKeralaDistrict(rawDistrict, lat, lng) {
  const clean = String(rawDistrict || '')
    .replace(/\s*district\s*/i, '')
    .trim()
    .toLowerCase();
  if (clean) {
    const exact = KERALA_DISTRICTS.find(
      (d) => d.toLowerCase() === clean || clean.includes(d.toLowerCase()) || d.toLowerCase().includes(clean)
    );
    if (exact) return exact;
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    let best = '';
    let minDist = Infinity;
    for (const c of KERALA_DISTRICT_COORDS) {
      const dist = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
      if (dist < minDist) {
        minDist = dist;
        best = c.name;
      }
    }
    return best;
  }
  return '';
}

export default function DeliveryAddressModal({
  isOpen,
  onClose,
  onAddressSaved,
  onSaveAddress,
  initialAddress,
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    district: '',
    pincode: '',
    state: 'Kerala',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setGpsMessage('');
    async function init() {
      if (initialAddress && (initialAddress.address || initialAddress.name || initialAddress.phone)) {
        setFormData({
          name: initialAddress.name || '',
          phone: String(initialAddress.phone || '').replace(/[^0-9]/g, '').slice(-10),
          address: initialAddress.address || initialAddress.address_line1 || '',
          landmark: initialAddress.landmark || initialAddress.address_line2 || '',
          city: initialAddress.city || '',
          district: initialAddress.district || '',
          pincode: initialAddress.pincode || '',
          state: initialAddress.state || 'Kerala',
        });
      } else if (isCustomerAuthenticated()) {
        const saved = await getSavedDeliveryAddress();
        if (saved && saved.address) {
          setFormData({
            name: saved.name || '',
            phone: String(saved.phone || '').replace(/[^0-9]/g, '').slice(-10),
            address: saved.address || '',
            landmark: saved.landmark || '',
            city: saved.city || '',
            district: saved.district || '',
            pincode: saved.pincode || '',
            state: saved.state || 'Kerala',
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
            state: 'Kerala',
          });
        }
      } else {
        setFormData({
          name: '',
          phone: '',
          address: '',
          landmark: '',
          city: '',
          district: '',
          pincode: '',
          state: 'Kerala',
        });
      }
    }
    init();
  }, [initialAddress, isOpen]);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    setErrorMsg('');
    setGpsMessage('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrorMsg('GPS Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let detectedCity = '';
          let detectedDistrict = '';
          let detectedPincode = '';
          let detectedRoad = '';
          let detectedLandmark = '';
          let detectedState = 'Kerala';

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (res.ok) {
              const data = await res.json();
              const a = data.address || {};
              detectedCity =
                a.town || a.city || a.suburb || a.village || a.neighbourhood || a.county || '';
              detectedDistrict = a.state_district || a.district || a.county || '';
              detectedPincode = (a.postcode || '').replace(/\s+/g, '').slice(0, 6);
              detectedRoad = [a.house_number, a.road, a.residential, a.suburb]
                .filter(Boolean)
                .join(', ');
              detectedLandmark = a.neighbourhood || a.amenity || a.suburb || '';
              if (a.state) detectedState = a.state;
            }
          } catch (_) {}

          const matchedDistrict = matchKeralaDistrict(detectedDistrict, latitude, longitude);

          setFormData((prev) => ({
            ...prev,
            address: prev.address.trim() ? prev.address : detectedRoad || prev.address,
            landmark: prev.landmark.trim() ? prev.landmark : detectedLandmark || prev.landmark,
            city: detectedCity || matchedDistrict || prev.city,
            district: matchedDistrict || prev.district,
            pincode: detectedPincode || prev.pincode,
            state: detectedState || 'Kerala',
          }));

          setGpsMessage(
            `Auto-filled: ${detectedCity || matchedDistrict || 'Location detected'}${
              detectedPincode ? ` (${detectedPincode})` : ''
            }`
          );
        } catch (_) {
          setErrorMsg('Could not auto-fill address details. Please type manually.');
        } finally {
          setDetectingGps(false);
        }
      },
      (geoErr) => {
        setDetectingGps(false);
        setErrorMsg(
          geoErr.code === 1
            ? 'GPS permission denied. Please allow location access in your browser.'
            : 'Could not detect GPS location. Please enter your address manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isCustomerAuthenticated()) {
      setErrorMsg('Please sign in first to save a delivery address.');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMsg('Please enter recipient full name');
      return;
    }

    const cleanPhone = formData.phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!formData.address.trim() || formData.address.trim().length < 5) {
      setErrorMsg('Please enter your complete house/flat, building & street address');
      return;
    }

    if (!formData.city.trim()) {
      setErrorMsg('Please enter city / town');
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
        state: formData.state || 'Kerala',
      };

      await saveDeliveryAddress(payload);
      if (onAddressSaved) onAddressSaved(payload);
      if (onSaveAddress) onSaveAddress(payload);
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
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Where should your marketplace orders be delivered?</p>
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

          {/* GPS Auto-Detect Button (Exact Mobile App Parity) */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingGps}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              marginBottom: gpsMessage ? '10px' : '16px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
              border: '1.5px solid #bfdbfe',
              borderRadius: '12px',
              cursor: detectingGps ? 'wait' : 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                flexShrink: 0,
              }}
            >
              <HiLocationMarker size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e40af' }}>
                {detectingGps ? 'Detecting GPS Location...' : 'Use Current Location (GPS Auto-Fill)'}
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                Auto-fills Street, City / Town, District & PIN Code instantly
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#dbeafe',
                color: '#1d4ed8',
                padding: '4px 8px',
                borderRadius: '9999px',
                fontSize: '10.5px',
                fontWeight: 800,
              }}
            >
              <HiSparkles size={12} />
              GPS
            </span>
          </button>

          {gpsMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#15803d',
                marginBottom: '14px',
              }}
            >
              <HiCheckCircle size={16} />
              <span>{gpsMessage}</span>
            </div>
          )}

          <div className="mkt-form-grid-2">
            <div className="mkt-form-group">
              <label className="mkt-form-label">Recipient Full Name *</label>
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
                placeholder="10-digit number"
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
              placeholder="Flat/House No., Building Name, Street"
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
                placeholder="e.g. Near Temple / Bus Stand"
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
              <label className="mkt-form-label">6-Digit PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit PIN"
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

          <div className="mkt-form-group">
            <label className="mkt-form-label">State</label>
            <input
              type="text"
              value={formData.state || 'Kerala'}
              readOnly
              className="mkt-form-input"
              style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
            />
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
              <HiCheckCircle size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Address'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
