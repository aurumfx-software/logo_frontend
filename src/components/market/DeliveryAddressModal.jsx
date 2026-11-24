import React, { useState, useEffect } from 'react';
import {
  HiX,
  HiLocationMarker,
  HiCheckCircle,
  HiPhone,
  HiUser,
  HiHome,
  HiOfficeBuilding,
} from 'react-icons/hi';
import { saveDeliveryAddress, getSavedDeliveryAddress } from '../../api/productApi';

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
    district: 'Kannur',
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
          district: initialAddress.district || 'Kannur',
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
            district: saved.district || 'Kannur',
            pincode: saved.pincode || '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <HiLocationMarker className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Add Delivery Address</h3>
              <p className="text-xs text-slate-500">Orders will be shipped to this location across Kerala</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <HiUser className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Nair"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                10-Digit Mobile Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <HiPhone className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
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
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Building, House Name / Flat No & Street Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. TC 14/235, Green Villa, Temple Road"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Landmark / Area (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near HP Petrol Pump"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City / Town <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Payyanur / Neyyattinkara"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kerala District <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all cursor-pointer font-medium"
              >
                {KERALA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                6-Digit Postal Pincode <span className="text-rose-500">*</span>
              </label>
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
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-2 py-2.5 px-6 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-60 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <HiCheckCircle className="w-4 h-4" />
                  <span>Save Delivery Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
