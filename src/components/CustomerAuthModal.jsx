import React, { useState, useEffect } from 'react';
import {
  HiX,
  HiLocationMarker,
  HiMail,
  HiLockClosed,
  HiUser,
  HiPhone,
  HiCheckCircle,
} from 'react-icons/hi';
import { registerCustomer, loginCustomer, updateCustomerLocation } from '../api/customerApi';

const KERALA_DISTRICTS = [
  'Kannur',
  'Kozhikode',
  'Ernakulam',
  'Thiruvananthapuram',
  'Thrissur',
  'Malappuram',
  'Palakkad',
  'Kottayam',
  'Alappuzha',
  'Kollam',
  'Wayanad',
  'Idukki',
  'Kasaragod',
  'Pathanamthitta',
];

const POPULAR_TOWNS_MAP = {
  Kannur: ['Payyanur', 'Kannur City', 'Taliparamba', 'Thalassery', 'Mattannur'],
  Kozhikode: ['Calicut', 'Kozhikode City', 'Beach Road', 'Vadakara', 'Koyilandy', 'Feroke'],
  Ernakulam: ['Kochi', 'Edappally', 'Kaloor', 'Marine Drive', 'Aluva', 'Kakkanad'],
  Thiruvananthapuram: ['Trivandrum City', 'East Fort', 'Kowdiar', 'Technopark', 'Neyyattinkara'],
  Thrissur: ['Thrissur City', 'Chalakudy', 'Guruvayur', 'Kunnamkulam'],
  Wayanad: ['Kalpetta', 'Sulthan Bathery', 'Mananthavady', 'Vythiri'],
  Kasaragod: ['Kasaragod City', 'Kanhangad', 'Bekal', 'Trikaripur', 'Nileshwar'],
  Malappuram: ['Malappuram City', 'Manjeri', 'Perinthalmanna', 'Tirur', 'Kottakkal'],
  Palakkad: ['Palakkad City', 'Ottapalam', 'Chittur', 'Mannarkkad', 'Shoranur'],
  Alappuzha: ['Alappuzha City', 'Cherthala', 'Kayamkulam', 'Haripad'],
  Kollam: ['Kollam City', 'Karunagappally', 'Punalur', 'Kottarakkara'],
  Kottayam: ['Kottayam City', 'Pala', 'Changanassery', 'Vaikom'],
  Idukki: ['Thodupuzha', 'Munnar', 'Kattappana', 'Nedumkandam'],
  Pathanamthitta: ['Pathanamthitta City', 'Adoor', 'Thiruvalla', 'Ranni'],
};

export default function CustomerAuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  currentCustomer = null,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'location'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    district: 'Kannur',
    city: 'Payyanur',
    location: '',
    address: '',
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (currentCustomer) {
      setFormData((prev) => ({
        ...prev,
        name: currentCustomer.name || '',
        email: currentCustomer.email || '',
        phone: currentCustomer.phone || '',
        district: currentCustomer.district || 'Kannur',
        city: currentCustomer.city || 'Payyanur',
        location: currentCustomer.location || '',
        address: currentCustomer.address || '',
        latitude: currentCustomer.latitude || null,
        longitude: currentCustomer.longitude || null,
      }));
    }
  }, [currentCustomer, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleDistrictChange = (e) => {
    const newDist = e.target.value;
    const defaultTown = (POPULAR_TOWNS_MAP[newDist] && POPULAR_TOWNS_MAP[newDist][0]) || newDist;
    setFormData((prev) => ({
      ...prev,
      district: newDist,
      city: defaultTown,
    }));
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingLoc(false);
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location: prev.location || 'Detected GPS Location',
        }));
      },
      () => {
        setIsDetectingLoc(false);
        alert('Could not detect GPS location. Please select your district and city manually.');
      },
      { timeout: 7000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'location') {
        const updated = await updateCustomerLocation({
          district: formData.district,
          city: formData.city,
          location: formData.location || `${formData.city}, ${formData.district}`,
          address: formData.address || `${formData.city}, ${formData.district}`,
          latitude: formData.latitude,
          longitude: formData.longitude,
        });
        if (onAuthSuccess) onAuthSuccess(updated);
        onClose();
        return;
      }

      if (mode === 'register') {
        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
          throw new Error('Please fill in Name, Email, and Password.');
        }
        const { customer, token } = await registerCustomer(formData);
        if (onAuthSuccess) onAuthSuccess(customer, token);
        onClose();
      } else {
        if (!formData.email.trim() && !formData.phone.trim()) {
          throw new Error('Please provide email or phone number.');
        }
        if (!formData.password.trim()) {
          throw new Error('Please enter your password.');
        }
        const { customer, token } = await loginCustomer({
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
        if (onAuthSuccess) onAuthSuccess(customer, token);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableTowns = POPULAR_TOWNS_MAP[formData.district] || [formData.district];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
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
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <HiX size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              📍
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {mode === 'location'
                  ? 'Update My Location'
                  : mode === 'register'
                  ? 'Customer Registration'
                  : 'Customer Login'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, opacity: 0.9 }}>
                {mode === 'location'
                  ? 'Change your district & town to discover nearby merchants'
                  : mode === 'register'
                  ? 'Set your locality to discover nearby merchants'
                  : 'Log in to see merchants closest to your location'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs (Only if not in location update mode) */}
          {mode !== 'location' && (
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 10,
                padding: 4,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 8,
                  background: mode === 'login' ? '#ffffff' : 'transparent',
                  color: mode === 'login' ? '#4F46E5' : '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 8,
                  background: mode === 'register' ? '#ffffff' : 'transparent',
                  color: mode === 'register' ? '#4F46E5' : '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Register (New Customer)
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {errorMsg && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <HiUser style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8', fontSize: 18 }} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Rahul Sharma"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {mode !== 'location' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <HiMail style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8', fontSize: 18 }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="customer@example.com"
                  required={mode === 'register'}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Contact Phone
              </label>
              <div style={{ position: 'relative' }}>
                <HiPhone style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8', fontSize: 18 }} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98470 12345"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {mode !== 'location' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <HiLockClosed style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8', fontSize: 18 }} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Location Fields for Registration or Location Update */}
          {(mode === 'register' || mode === 'location') && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '14px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📍 Locality & Place
                </span>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingLoc}
                  style={{
                    border: 'none',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  {isDetectingLoc ? 'Detecting...' : '🎯 Detect GPS'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                    District
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 13,
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    {KERALA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                    City / Town
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 13,
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    {availableTowns.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                  Area / Locality Landmark
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Near Bus Stand / Beach Road"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {formData.latitude && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HiCheckCircle /> GPS Pin: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'location'
              ? 'Save Location & Discover Nearby'
              : mode === 'register'
              ? 'Create Customer Account & Set Location'
              : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
