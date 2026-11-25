import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiX,
  HiPhotograph,
  HiCamera,
  HiPlus,
  HiTrash,
  HiCheckCircle,
  HiLockClosed,
  HiCreditCard,
  HiSearch,
  HiTag,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { createCustomerProduct } from '../../api/productApi';
import { isCustomerAuthenticated, fetchCustomerProfile } from '../../api/customerApi';
import { uploadMerchantMedia } from '../../api/merchantApi';
import { fetchCategoriesList } from '../../api/categoryApi';
import {
  fetchAdminSubscriptionPackages,
  hasActiveSellerSubscription,
  startCustomerRazorpaySubscription,
} from '../../api/subscriptionApi';

const QUICK_CATEGORIES = [
  'Kerala Kasavu Sarees',
  'Fashion & Clothing',
  'Kerala Spices & Masalas',
  'Grocery & Food',
  'Organic & Agro Products',
  'Handicrafts & Decor',
  'Home & Kitchen',
  'Electronics & Mobiles',
  'Jewellery',
  'Footwear',
  'Ayurvedic & Healthcare',
  'General',
];

const QUICK_SIZES = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const KERALA_DISTRICTS = [
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
];

export default function CustomerAddProductModal({
  customerUser,
  isOpen,
  onClose,
  onProductCreated,
  embedded = false,
}) {
  const canSell = isCustomerAuthenticated() && hasActiveSellerSubscription(customerUser);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kerala Kasavu Sarees');
  const [allCategories, setAllCategories] = useState([]);
  const [catSearch, setCatSearch] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  const [selectedSizes, setSelectedSizes] = useState(['Free Size']);
  const [customSize, setCustomSize] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');

  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [description, setDescription] = useState('');

  // Dynamic unlimited Product Highlights & Additional Details (empty placeholders only!)
  const [highlights, setHighlights] = useState([{ label: '', value: '' }]);
  const [additionalDetails, setAdditionalDetails] = useState([{ label: '', value: '' }]);

  const [sellerName, setSellerName] = useState(
    customerUser?.name && !customerUser.name.startsWith('Customer (') ? customerUser.name : ''
  );
  const [sellerPhone, setSellerPhone] = useState(
    customerUser?.phone ? customerUser.phone.replace(/[^0-9]/g, '').slice(-10) : ''
  );
  const [district, setDistrict] = useState(customerUser?.district || 'Ernakulam');
  const [city, setCity] = useState(customerUser?.city || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (customerUser) {
      if (!sellerName && customerUser.name && !customerUser.name.startsWith('Customer (')) {
        setSellerName(customerUser.name);
      }
      if (!sellerPhone && customerUser.phone) {
        setSellerPhone(customerUser.phone.replace(/[^0-9]/g, '').slice(-10));
      }
      if (customerUser.district) setDistrict(customerUser.district);
      if (customerUser.city) setCity(customerUser.city);
    }
  }, [customerUser]);

  useEffect(() => {
    if (!isOpen) return;
    fetchCategoriesList()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setAllCategories(cats);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return allCategories;
    const q = catSearch.toLowerCase().trim();
    return allCategories.filter((c) => String(c.name || c.title || c || '').toLowerCase().includes(q));
  }, [allCategories, catSearch]);

  if (!isOpen) return null;

  const toggleSize = (sz) => {
    setSelectedSizes((prev) => {
      if (prev.includes(sz)) {
        const next = prev.filter((s) => s !== sz);
        return next.length > 0 ? next : [sz];
      }
      return [...prev, sz];
    });
  };

  const uploadFilesToServer = async (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;
    setUploadingPhotos(true);
    setErrorMsg('');
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('photos', file, file.name || `product_${Date.now()}.jpg`);
        const res = await uploadMerchantMedia(fd);
        const urls = res?.photos || res?.all_urls || [];
        if (urls.length > 0) {
          setUploadedPhotos((prev) => [...prev, ...urls]);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleOpenCamera = async () => {
    setErrorMsg('');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        streamRef.current = stream;
        setCameraOpen(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 80);
        return;
      } catch (_) {}
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => uploadFilesToServer(e.target.files);
    input.click();
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const handleCaptureCameraFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      handleCloseCamera();
      if (blob) {
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        await uploadFilesToServer([file]);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleAddHighlightRow = () => {
    setHighlights((prev) => [...prev, { label: '', value: '' }]);
  };

  const handleUpdateHighlightRow = (idx, key, val) => {
    setHighlights((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row)));
  };

  const handleRemoveHighlightRow = (idx) => {
    setHighlights((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [{ label: '', value: '' }]));
  };

  const handleAddDetailRow = () => {
    setAdditionalDetails((prev) => [...prev, { label: '', value: '' }]);
  };

  const handleUpdateDetailRow = (idx, key, val) => {
    setAdditionalDetails((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row)));
  };

  const handleRemoveDetailRow = (idx) => {
    setAdditionalDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [{ label: '', value: '' }]));
  };

  const handleApplyCustomCategory = () => {
    const clean = customCatInput.trim();
    if (!clean) return;
    setCategory(clean);
    setCustomCatInput('');
    setShowCustomCatInput(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isCustomerAuthenticated() || !canSell) {
      setErrorMsg('Only customers with an active ₹500 Seller Plan subscription can create products.');
      return;
    }

    if (!name.trim()) return setErrorMsg('Please enter Product Title / Name');
    if (!category.trim()) return setErrorMsg('Please select or add a Category');

    const numPrice = Number(price);
    if (!numPrice || numPrice <= 0) return setErrorMsg('Please enter a valid Selling Price in ₹');

    const cleanPhone = sellerPhone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return setErrorMsg('Please enter your 10-digit WhatsApp/phone number for receiving orders');
    }

    const finalSizes = [...selectedSizes];
    if (customSize.trim() && !finalSizes.includes(customSize.trim())) {
      finalSizes.push(customSize.trim());
    }

    const cleanHighlights = highlights
      .map((h) => ({ label: h.label.trim(), value: h.value.trim() }))
      .filter((h) => h.label || h.value);

    const cleanAdditionalDetails = additionalDetails
      .map((d) => ({ label: d.label.trim(), value: d.value.trim() }))
      .filter((d) => d.label || d.value);

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim(),
        price: numPrice,
        original_price: originalPrice ? Number(originalPrice) : null,
        stock_quantity: stockQuantity !== '' ? Math.max(0, parseInt(stockQuantity, 10) || 0) : 10,
        stock_status: stockQuantity !== '' && parseInt(stockQuantity, 10) === 0 ? 'OUT_OF_STOCK' : 'IN_STOCK',
        sizes: finalSizes.length > 0 ? finalSizes : ['Free Size'],
        images: uploadedPhotos,
        highlights: cleanHighlights,
        additional_details: cleanAdditionalDetails,
        district,
        city: city.trim() || district,
        seller_name: sellerName.trim() || customerUser?.name || 'Local Seller',
        seller_phone: cleanPhone,
        seller_whatsapp: cleanPhone,
      };

      const res = await createCustomerProduct(payload);
      setSuccessMsg('Your product has been published to Logo Kerala Marketplace!');
      if (onProductCreated) onProductCreated(res);
      if (!embedded) {
        setTimeout(() => onClose(), 1300);
      } else {
        setName('');
        setPrice('');
        setOriginalPrice('');
        setUploadedPhotos([]);
        setDescription('');
        setHighlights([{ label: '', value: '' }]);
        setAdditionalDetails([{ label: '', value: '' }]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not publish product. Please check your ₹500 Seller Plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRazorpay500Subscribe = async () => {
    setIsSubscribing(true);
    setErrorMsg('');
    try {
      if (!isCustomerAuthenticated() || !customerUser) {
        alert('Please sign in first to subscribe to the ₹500 Seller Plan.');
        return;
      }
      const pkgs = await fetchAdminSubscriptionPackages({ audience: 'USER', activeOnly: true });
      const userPkg =
        (Array.isArray(pkgs) ? pkgs : []).find((p) => Number(p.price ?? p.amount) === 500) ||
        (Array.isArray(pkgs) ? pkgs[0] : null) || {
          code: 'USER_SELLER_500',
          name: '₹500 Seller Plan',
          price: 500,
        };

      await startCustomerRazorpaySubscription({ packageItem: userPkg, customerUser });
      await fetchCustomerProfile().catch(() => null);
      setSuccessMsg('₹500 Seller Plan activated! You can now publish products.');
    } catch (err) {
      setErrorMsg(err.message || 'Razorpay checkout failed.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleContactAdminFor500Plan = () => {
    const text = encodeURIComponent(
      `Hello Logo Kerala Admin, I am interested in the ₹500 Seller Plan. Name: ${customerUser?.name || ''}, Phone: ${customerUser?.phone || ''}.`
    );
    window.open(`https://api.whatsapp.com/send?phone=919847123456&text=${text}`, '_blank');
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1.5px solid #cbd5e1',
    fontSize: 13.5,
    boxSizing: 'border-box',
    background: '#ffffff',
    color: '#0f172a',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 6,
  };

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 18,
  };

  const innerContent = (
    <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
      {/* Top Bar */}
      <div
        style={{
          padding: embedded ? '0 0 18px' : '18px 28px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: embedded ? 'transparent' : '#ffffff',
          position: embedded ? 'static' : 'sticky',
          top: 0,
          zIndex: 20,
          marginBottom: embedded ? 20 : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <HiPlus size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
              Sell Your Product
            </h2>
            <span style={{ fontSize: 12.5, color: '#64748b' }}>
              Publish full-featured listings with Categories, Sizes, Photos, Highlights & Additional Details
            </span>
          </div>
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 10,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <HiX size={20} />
          </button>
        )}
      </div>

      <div style={{ padding: embedded ? 0 : '24px 28px 48px' }}>
        {!canSell ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '44px 24px', maxWidth: 600, margin: '24px auto' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#d97706' }}>
              <HiLockClosed size={30} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 800, color: '#1e293b' }}>
              ₹500 Seller Plan Required
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
              Activate the <strong>₹500 Seller Plan</strong> to publish unlimited products, upload galleries, and receive orders directly from Kerala buyers.
            </p>
            <button
              type="button"
              onClick={handleRazorpay500Subscribe}
              disabled={isSubscribing}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <HiCreditCard size={18} />
              <span>{isSubscribing ? 'Connecting Razorpay...' : 'Pay ₹500 Online via Razorpay'}</span>
            </button>
            <button
              type="button"
              onClick={handleContactAdminFor500Plan}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                border: 'none',
                background: '#16a34a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <FaWhatsapp size={17} />
              <span>Or Message Admin on WhatsApp</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, marginBottom: 16, border: '1px solid #fecaca' }}>
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 700, marginBottom: 16, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiCheckCircle size={20} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Two-Column Full-Screen Responsive Form Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
              {/* LEFT COLUMN */}
              <div>
                {/* 1. Product Basic Details */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    1. Product Information
                  </h3>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Product Title / Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pure Kerala Kasavu Saree or V-Neck Kaftan Dress"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Pricing & Stock */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Selling Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 850"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>MRP / Original Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1200"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Stock Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="10"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Category Selection (Quick Chips + Browse All + Separate Custom Category) BEFORE Description */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>2. Product Category *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setShowCatPicker(!showCatPicker)}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: 8,
                          padding: '5px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {showCatPicker ? <HiChevronUp size={14} /> : <HiSearch size={14} />}
                        <span>{showCatPicker ? 'Hide Categories' : `Browse All (${allCategories.length || QUICK_CATEGORIES.length})`}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                        style={{
                          background: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          borderRadius: 8,
                          padding: '5px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        + Add Separate Category
                      </button>
                    </div>
                  </div>

                  {/* Active Category Pill */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dbeafe', color: '#1d4ed8', padding: '5px 12px', borderRadius: 9999, fontSize: 12.5, fontWeight: 800, marginBottom: 10 }}>
                    <HiTag size={14} />
                    <span>Selected: {category}</span>
                  </div>

                  {/* Quick Category Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: showCatPicker || showCustomCatInput ? 12 : 0 }}>
                    {QUICK_CATEGORIES.map((cat) => {
                      const active = category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          style={{
                            padding: '6px 11px',
                            borderRadius: 9999,
                            border: `1.5px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                            background: active ? '#eff6ff' : '#f8fafc',
                            color: active ? '#1d4ed8' : '#475569',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom / Separate Category Input */}
                  {showCustomCatInput && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 10 }}>
                      <input
                        type="text"
                        placeholder="Enter separate category name (e.g. Women Kurtis / Brassware)..."
                        value={customCatInput}
                        onChange={(e) => setCustomCatInput(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomCategory}
                        style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Set Category
                      </button>
                    </div>
                  )}

                  {/* Browse All Server Categories Dropdown Box */}
                  {showCatPicker && (
                    <div style={{ border: '1.5px solid #cbd5e1', borderRadius: 12, padding: 10, marginTop: 10, background: '#f8fafc' }}>
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 8 }}
                      />
                      <div style={{ maxHeight: 190, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(filteredCategories.length > 0 ? filteredCategories : QUICK_CATEGORIES).map((c) => {
                          const catName = c.name || c.title || c;
                          const isSel = category === catName;
                          return (
                            <button
                              key={c.id || catName}
                              type="button"
                              onClick={() => {
                                setCategory(catName);
                                setShowCatPicker(false);
                              }}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: 'none',
                                background: isSel ? '#dbeafe' : '#ffffff',
                                color: isSel ? '#1d4ed8' : '#0f172a',
                                fontSize: 12.5,
                                fontWeight: isSel ? 800 : 600,
                                cursor: 'pointer',
                              }}
                            >
                              <span>{catName}</span>
                              {isSel && <span>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Sizes & Dimensions */}
                <div style={cardStyle}>
                  <label style={labelStyle}>3. Sizes / Dimensions</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {QUICK_SIZES.map((sz) => {
                      const active = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSize(sz)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: `1.5px solid ${active ? '#2563eb' : '#cbd5e1'}`,
                            background: active ? '#eff6ff' : '#ffffff',
                            color: active ? '#1d4ed8' : '#334155',
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter custom size / dimensions e.g. 32, 1 Kg, 500g, 6x4 ft"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* 4. Product Description */}
                <div style={cardStyle}>
                  <label style={labelStyle}>4. Product Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe product quality, material, usage instructions, origin, or warranty..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                {/* 5. Unlimited Product Photos (Upload + Take Photo, NO URL input) */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                      5. Product Photos ({uploadedPhotos.length} added)
                    </label>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Add as many photos as needed</span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                    <label
                      style={{
                        flex: 1,
                        minWidth: 150,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1.5px dashed #93c5fd',
                        padding: '11px 14px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <HiPhotograph size={18} />
                      <span>{uploadingPhotos ? 'Uploading...' : 'Choose Photos (Gallery)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          uploadFilesToServer(e.target.files);
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleOpenCamera}
                      disabled={uploadingPhotos}
                      style={{
                        flex: 1,
                        minWidth: 150,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#f0fdf4',
                        color: '#15803d',
                        border: '1.5px dashed #86efac',
                        padding: '11px 14px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <HiCamera size={18} />
                      <span>Take Photo (Camera)</span>
                    </button>
                  </div>

                  {cameraOpen && (
                    <div style={{ background: '#0f172a', borderRadius: 12, padding: 12, marginBottom: 14, textAlign: 'center' }}>
                      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: 260, borderRadius: 8, background: '#000' }} />
                      <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'center' }}>
                        <button type="button" onClick={handleCaptureCameraFrame} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                          Capture Photo
                        </button>
                        <button type="button" onClick={handleCloseCamera} style={{ background: '#475569', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadedPhotos.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 10 }}>
                      {uploadedPhotos.map((imgUrl, idx) => (
                        <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img src={imgUrl} alt={`Product ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(15,23,42,0.75)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <HiX size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Product Highlights (Unlimited Empty Placeholders: Heading + Answer) */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Product Highlights</h3>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>Add highlight headings & answers one by one</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddHighlightRow}
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <HiPlus size={14} /> Add Highlight
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {highlights.map((row, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Heading (e.g. Color)"
                          value={row.label}
                          onChange={(e) => handleUpdateHighlightRow(idx, 'label', e.target.value)}
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          placeholder="Answer (e.g. Maroon)"
                          value={row.value}
                          onChange={(e) => handleUpdateHighlightRow(idx, 'value', e.target.value)}
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlightRow(idx)}
                          title="Remove"
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, width: 34, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <HiTrash size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Additional Details (Unlimited Empty Placeholders: Bold Heading + Answer) */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Additional Details</h3>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>Add detailed specs shown on the product page</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDetailRow}
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <HiPlus size={14} /> Add Detail
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {additionalDetails.map((row, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Heading (e.g. Fabric / Brand)"
                          value={row.label}
                          onChange={(e) => handleUpdateDetailRow(idx, 'label', e.target.value)}
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          placeholder="Answer (e.g. Cotton / Maxi)"
                          value={row.value}
                          onChange={(e) => handleUpdateDetailRow(idx, 'value', e.target.value)}
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDetailRow(idx)}
                          title="Remove"
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, width: 34, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <HiTrash size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8. Seller Contact & Location */}
                <div style={cardStyle}>
                  <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    Seller Contact & Location
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Seller Name</label>
                      <input type="text" placeholder="Your Store or Name" value={sellerName} onChange={(e) => setSellerName(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>WhatsApp Phone *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit WhatsApp"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>District *</label>
                      <select value={district} onChange={(e) => setDistrict(e.target.value)} style={inputStyle}>
                        {KERALA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>City / Town</label>
                      <input type="text" placeholder="e.g. Kochi / Payyanur" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
              {!embedded && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 700, fontSize: 14, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || uploadingPhotos}
                style={{
                  padding: '13px 32px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  boxShadow: '0 6px 18px rgba(22, 163, 74, 0.25)',
                }}
              >
                {isSubmitting ? 'Publishing Product...' : 'Publish Product to Marketplace →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return innerContent;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#f8fafc',
        overflowY: 'auto',
      }}
    >
      {innerContent}
    </div>
  );
}
