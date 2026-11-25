import React, { useMemo, useRef, useState } from 'react';
import {
  HiPhotograph,
  HiCamera,
  HiPlus,
  HiTrash,
  HiSearch,
  HiTag,
  HiChevronDown,
  HiChevronUp,
  HiX,
} from 'react-icons/hi';
import { uploadMerchantMedia } from '../../api/merchantApi';

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

export default function SubProductVariantCard({
  index,
  variant,
  allCategories = [],
  onChange,
  onRemove,
  onError,
}) {
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return allCategories;
    const q = catSearch.toLowerCase().trim();
    return allCategories.filter((c) => String(c.name || c.title || c || '').toLowerCase().includes(q));
  }, [allCategories, catSearch]);

  const patch = (fields) => onChange(index, { ...variant, ...fields });

  const toggleSize = (sz) => {
    const cur = variant.selectedSizes || ['Free Size'];
    if (cur.includes(sz)) {
      const next = cur.filter((s) => s !== sz);
      patch({ selectedSizes: next.length > 0 ? next : [sz] });
    } else {
      patch({ selectedSizes: [...cur, sz] });
    }
  };

  const uploadFilesToServer = async (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;
    setUploadingPhotos(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('photos', file, file.name || `variant_${Date.now()}.jpg`);
        const res = await uploadMerchantMedia(fd);
        const urls = res?.photos || res?.all_urls || [];
        if (urls.length > 0) uploaded.push(...urls);
      }
      if (uploaded.length > 0) {
        patch({ uploadedPhotos: [...(variant.uploadedPhotos || []), ...uploaded] });
      }
    } catch (err) {
      if (onError) onError(err.message || 'Failed to upload sub-product photo.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleOpenCamera = async () => {
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
    borderRadius: 14,
    padding: '16px',
    marginBottom: 14,
  };

  return (
    <div
      style={{
        marginTop: 22,
        background: '#f8fafc',
        border: '2px solid #bfdbfe',
        borderRadius: 18,
        padding: 20,
      }}
    >
      {/* Variant Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #dbeafe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
            #{index + 1}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1e3a8a' }}>
              Sub-Product Variant #{index + 1} (Same Product with Differences)
            </h4>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Saved as an independent linked product with Categories, Sizes, Photos, Highlights & Additional Details
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            borderRadius: 9,
            padding: '7px 12px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <HiTrash size={14} /> Remove Sub-Product
        </button>
      </div>

      {/* Same Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div>
          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>1. Product Information</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Sub-Product Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Maroon Cotton Kasavu Saree (Large / Different Color)"
                value={variant.name || ''}
                onChange={(e) => patch({ name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
              <div>
                <label style={labelStyle}>Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 850"
                  value={variant.price || ''}
                  onChange={(e) => patch({ price: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>MRP (₹)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1200"
                  value={variant.originalPrice || ''}
                  onChange={(e) => patch({ originalPrice: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Stock Qty *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="10"
                  value={variant.stockQuantity ?? '10'}
                  onChange={(e) => patch({ stockQuantity: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>2. Product Category *</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setShowCatPicker(!showCatPicker)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {showCatPicker ? <HiChevronUp size={13} /> : <HiSearch size={13} />}
                  <span>Browse ({allCategories.length || QUICK_CATEGORIES.length})</span>
                </button>
                <button type="button" onClick={() => setShowCustomCatInput(!showCustomCatInput)} style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                  + Separate Category
                </button>
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
              <HiTag size={13} /> Selected: {variant.category}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {QUICK_CATEGORIES.map((cat) => {
                const active = variant.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => patch({ category: cat })}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 9999,
                      border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                      background: active ? '#eff6ff' : '#f8fafc',
                      color: active ? '#1d4ed8' : '#475569',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {showCustomCatInput && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="Enter separate category..."
                  value={customCatInput}
                  onChange={(e) => setCustomCatInput(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customCatInput.trim()) {
                      patch({ category: customCatInput.trim() });
                      setCustomCatInput('');
                      setShowCustomCatInput(false);
                    }
                  }}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  Set
                </button>
              </div>
            )}

            {showCatPicker && (
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: 8, marginTop: 10, background: '#f8fafc' }}>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 6 }}
                />
                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {(filteredCategories.length > 0 ? filteredCategories : QUICK_CATEGORIES).map((c) => {
                    const catName = c.name || c.title || c;
                    return (
                      <button
                        key={c.id || catName}
                        type="button"
                        onClick={() => {
                          patch({ category: catName });
                          setShowCatPicker(false);
                        }}
                        style={{ textAlign: 'left', padding: '6px 9px', borderRadius: 6, border: 'none', background: variant.category === catName ? '#dbeafe' : '#fff', color: '#0f172a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {catName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>3. Sizes / Dimensions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {QUICK_SIZES.map((sz) => {
                const active = (variant.selectedSizes || []).includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 7,
                      border: `1.5px solid ${active ? '#2563eb' : '#cbd5e1'}`,
                      background: active ? '#eff6ff' : '#fff',
                      color: active ? '#1d4ed8' : '#334155',
                      fontSize: 12,
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
              placeholder="Or enter custom size / dimensions e.g. 32, 1 Kg, 500g"
              value={variant.customSize || ''}
              onChange={(e) => patch({ customSize: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>4. Product Description</label>
            <textarea
              rows={3}
              placeholder="Describe quality, color difference, fabric, usage..."
              value={variant.description || ''}
              onChange={(e) => patch({ description: e.target.value })}
              style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div style={cardStyle}>
            <label style={labelStyle}>5. Photos ({(variant.uploadedPhotos || []).length} added)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <label style={{ flex: 1, minWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#eff6ff', color: '#2563eb', border: '1.5px dashed #93c5fd', padding: '9px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                <HiPhotograph size={16} />
                <span>{uploadingPhotos ? 'Uploading...' : 'Choose Photos'}</span>
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
              <button type="button" onClick={handleOpenCamera} disabled={uploadingPhotos} style={{ flex: 1, minWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f0fdf4', color: '#15803d', border: '1.5px dashed #86efac', padding: '9px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                <HiCamera size={16} /> Take Photo
              </button>
            </div>

            {cameraOpen && (
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 10, marginBottom: 10, textAlign: 'center' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: 220, borderRadius: 8 }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                  <button type="button" onClick={handleCaptureCameraFrame} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Capture</button>
                  <button type="button" onClick={handleCloseCamera} style={{ background: '#475569', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {(variant.uploadedPhotos || []).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8 }}>
                {(variant.uploadedPhotos || []).map((imgUrl, pIdx) => (
                  <div key={pIdx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={imgUrl} alt={`Variant ${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => patch({ uploadedPhotos: variant.uploadedPhotos.filter((_, i) => i !== pIdx) })}
                      style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(15,23,42,0.75)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <HiX size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>6. Product Highlights</label>
              <button
                type="button"
                onClick={() => patch({ highlights: [...(variant.highlights || [{ label: '', value: '' }]), { label: '', value: '' }] })}
                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '4px 9px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                <HiPlus size={13} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(variant.highlights || [{ label: '', value: '' }]).map((row, rIdx) => (
                <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Heading (e.g. Color)"
                    value={row.label}
                    onChange={(e) =>
                      patch({
                        highlights: variant.highlights.map((r, i) => (i === rIdx ? { ...r, label: e.target.value } : r)),
                      })
                    }
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Answer (e.g. Maroon)"
                    value={row.value}
                    onChange={(e) =>
                      patch({
                        highlights: variant.highlights.map((r, i) => (i === rIdx ? { ...r, value: e.target.value } : r)),
                      })
                    }
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        highlights: variant.highlights.length > 1 ? variant.highlights.filter((_, i) => i !== rIdx) : [{ label: '', value: '' }],
                      })
                    }
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0 9px', cursor: 'pointer' }}
                  >
                    <HiTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>7. Additional Details</label>
              <button
                type="button"
                onClick={() => patch({ additionalDetails: [...(variant.additionalDetails || [{ label: '', value: '' }]), { label: '', value: '' }] })}
                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '4px 9px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                <HiPlus size={13} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(variant.additionalDetails || [{ label: '', value: '' }]).map((row, dIdx) => (
                <div key={dIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Heading (e.g. Fabric / Brand)"
                    value={row.label}
                    onChange={(e) =>
                      patch({
                        additionalDetails: variant.additionalDetails.map((r, i) => (i === dIdx ? { ...r, label: e.target.value } : r)),
                      })
                    }
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Answer (e.g. Cotton / Maxi)"
                    value={row.value}
                    onChange={(e) =>
                      patch({
                        additionalDetails: variant.additionalDetails.map((r, i) => (i === dIdx ? { ...r, value: e.target.value } : r)),
                      })
                    }
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        additionalDetails:
                          variant.additionalDetails.length > 1
                            ? variant.additionalDetails.filter((_, i) => i !== dIdx)
                            : [{ label: '', value: '' }],
                      })
                    }
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0 9px', cursor: 'pointer' }}
                  >
                    <HiTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}>8. Contact & Location</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="text" placeholder="Seller Name" value={variant.sellerName || ''} onChange={(e) => patch({ sellerName: e.target.value })} style={inputStyle} />
              <input type="tel" required placeholder="WhatsApp Phone *" value={variant.sellerPhone || ''} onChange={(e) => patch({ sellerPhone: e.target.value })} style={inputStyle} />
              <select value={variant.district || 'Ernakulam'} onChange={(e) => patch({ district: e.target.value })} style={inputStyle}>
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input type="text" placeholder="City / Town" value={variant.city || ''} onChange={(e) => patch({ city: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
