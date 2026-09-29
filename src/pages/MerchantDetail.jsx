import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineGlobe,
  HiOutlineStar,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlineShare,
  HiOutlinePencil,
  HiCheckCircle,
  HiOutlineMap,
} from 'react-icons/hi';
import { FaWhatsapp, FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import StatusBadge from '../components/UI/StatusBadge';
import { fetchMerchantsList } from '../api/merchantApi';
import { useAuth } from '../context/AuthContext';

export default function MerchantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const userId = user?.id || user?.user_id;
        const userCode = user?.user_code || user?.userCode;
        const list = await fetchMerchantsList(userId, userCode);
        const found = Array.isArray(list)
          ? list.find((m) => String(m.id) === String(id))
          : null;
        setMerchant(found || null);
      } catch {
        setMerchant(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Collect valid photos
  const photos = merchant
    ? [
        merchant.image,
        ...(Array.isArray(merchant.photos) ? merchant.photos : []),
        merchant.photo_1,
        merchant.photo_2,
        merchant.photo_3,
        merchant.photo_4,
      ].filter(Boolean)
    : [];

  const socialLinks = merchant
    ? [
        { icon: <FaWhatsapp />, color: '#25D366', label: 'WhatsApp', href: merchant.whatsapp ? `https://wa.me/${merchant.whatsapp.replace(/\D/g, '')}` : null, value: merchant.whatsapp },
        { icon: <FaFacebook />, color: '#1877F2', label: 'Facebook', href: merchant.facebook, value: merchant.facebook },
        { icon: <FaInstagram />, color: '#E1306C', label: 'Instagram', href: merchant.instagram, value: merchant.instagram },
        { icon: <FaTwitter />, color: '#1DA1F2', label: 'Twitter / X', href: merchant.twitter, value: merchant.twitter },
        { icon: <FaYoutube />, color: '#FF0000', label: 'YouTube', href: merchant.youtube, value: merchant.youtube },
      ].filter((s) => s.value)
    : [];

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #E2E8F0', borderTopColor: '#6C63FF', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748B', fontWeight: 600 }}>Loading merchant details...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏪</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, margin: '0 0 8px' }}>Merchant Not Found</h2>
          <p style={{ color: '#64748B', marginBottom: 24 }}>This merchant may have been removed or the link is incorrect.</p>
          <button className="btn btn-primary" onClick={() => navigate('/merchants')}>
            <HiOutlineArrowLeft /> Back to Merchants
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/merchants')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <HiOutlineArrowLeft size={16} /> Back to Merchants
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-outline"
            onClick={handleCopyLink}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {copied ? <HiCheckCircle style={{ color: '#10B981' }} /> : <HiOutlineShare />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/merchants?edit=${merchant.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <HiOutlinePencil size={15} /> Edit Merchant
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 20, maxWidth: 1100, margin: '0 auto' }}>

        {/* ── HERO CARD ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Photo Gallery */}
          {photos.length > 0 && (
            <div style={{ position: 'relative', background: '#0F172A' }}>
              {/* Main photo */}
              <img
                src={photos[activePhoto]}
                alt={merchant.name}
                style={{ width: '100%', height: 'clamp(200px, 40vw, 360px)', objectFit: 'cover', display: 'block', opacity: 0.92 }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop&q=80'; }}
              />
              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      style={{
                        width: 52, height: 38, borderRadius: 6, overflow: 'hidden', padding: 0,
                        border: i === activePhoto ? '2.5px solid white' : '2px solid rgba(255,255,255,0.4)',
                        cursor: 'pointer', background: 'none',
                        boxShadow: i === activePhoto ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <img src={p} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; }} />
                    </button>
                  ))}
                </div>
              )}
              {/* Photo count badge */}
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <HiOutlinePhotograph size={13} /> {activePhoto + 1}/{photos.length}
              </div>
            </div>
          )}

          {/* Merchant name + meta */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, margin: '0 0 6px', color: '#0F172A' }}>{merchant.name}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 14, color: '#64748B' }}>
                  <span style={{ background: '#EDE9FE', color: '#5B21B6', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{merchant.category}</span>
                  <StatusBadge status={merchant.status || 'active'} />
                  {merchant.rating && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#F59E0B' }}>
                      <HiOutlineStar /> {merchant.rating}
                      <span style={{ color: '#94A3B8', fontWeight: 400 }}>({merchant.reviews || 0} reviews)</span>
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>ID: <code style={{ fontFamily: 'monospace' }}>{merchant.id}</code></div>
            </div>
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}>

          {/* Location */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <HiOutlineLocationMarker style={{ color: '#6C63FF' }} /> Location
            </h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {merchant.address && <InfoRow label="Address" value={merchant.address} />}
              {merchant.city && <InfoRow label="City / Town" value={merchant.city} />}
              {merchant.district && <InfoRow label="District" value={merchant.district} />}
              {merchant.state && <InfoRow label="State" value={merchant.state} />}
            </div>
            {merchant.latitude && merchant.longitude && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <HiOutlineMap style={{ color: '#6C63FF' }} />
                  GPS: <code style={{ fontFamily: 'monospace', color: '#1E293B' }}>{Number(merchant.latitude).toFixed(6)}, {Number(merchant.longitude).toFixed(6)}</code>
                </div>
                <iframe
                  title="Merchant Location"
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: 10 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${merchant.latitude},${merchant.longitude}&hl=en&z=16&output=embed`}
                />
                <a
                  href={`https://www.google.com/maps?q=${merchant.latitude},${merchant.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}
                >
                  <HiOutlineLocationMarker /> Open in Google Maps ↗
                </a>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <HiOutlinePhone style={{ color: '#6C63FF' }} /> Contact Details
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {merchant.phone && (
                <ContactRow icon={<HiOutlinePhone />} label="Mobile" value={merchant.phone} href={`tel:${merchant.phone}`} color="#6C63FF" />
              )}
              {merchant.whatsapp && (
                <ContactRow icon={<FaWhatsapp />} label="WhatsApp" value={merchant.whatsapp} href={`https://wa.me/${merchant.whatsapp.replace(/\D/g, '')}`} color="#25D366" />
              )}
              {merchant.landline && (
                <ContactRow icon={<HiOutlinePhone />} label="Landline" value={merchant.landline} href={`tel:${merchant.landline}`} color="#475569" />
              )}
              {merchant.email && (
                <ContactRow icon={<HiOutlineMail />} label="Email" value={merchant.email} href={`mailto:${merchant.email}`} color="#6C63FF" />
              )}
              {merchant.website && (
                <ContactRow icon={<HiOutlineGlobe />} label="Website" value={merchant.website} href={merchant.website} color="#2563EB" external />
              )}
              {!merchant.phone && !merchant.whatsapp && !merchant.email && !merchant.website && (
                <p style={{ color: '#94A3B8', fontSize: 13 }}>No contact details available.</p>
              )}
            </div>

            {/* Social Media */}
            {socialLinks.length > 0 && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Social Media</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {socialLinks.map((s, i) => (
                    <a
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.label}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 22, border: `1.5px solid ${s.color}22`, background: `${s.color}10`, color: s.color, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = `${s.color}20`; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = `${s.color}10`; }}
                    >
                      <span style={{ fontSize: 16 }}>{s.icon}</span> {s.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── VIDEO ── */}
        {merchant.videoUrl && (
          <div className="card" style={{ padding: '20px 22px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <HiOutlineVideoCamera style={{ color: '#6C63FF' }} /> Store Tour / Promo Video
            </h3>
            <div style={{ background: '#0F172A', borderRadius: 12, overflow: 'hidden' }}>
              <video
                controls
                src={merchant.videoUrl}
                style={{ width: '100%', maxHeight: 380, display: 'block' }}
                poster={photos[0] || undefined}
              >
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        )}

        {/* ── ADDITIONAL INFO ── */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Additional Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <InfoBox label="Joined" value={merchant.joined || merchant.created_at?.slice(0, 10) || '—'} icon="📅" />
            <InfoBox label="Status" value={merchant.status || 'Active'} icon="✅" />
            <InfoBox label="Rating" value={merchant.rating ? `⭐ ${merchant.rating}` : '—'} icon="⭐" />
            <InfoBox label="Reviews" value={merchant.reviews || 0} icon="💬" />
            <InfoBox label="Category" value={merchant.category || '—'} icon="🏷️" />
            {merchant.owner && <InfoBox label="Owner / Contact" value={merchant.owner} icon="👤" />}
          </div>
        </div>
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

/* ── Helper sub-components ── */

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', minWidth: 72, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 500, flex: 1 }}>{value}</span>
    </div>
  );
}

function ContactRow({ icon, label, value, href, color, external }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #F1F5F9', background: '#FAFAFA', textDecoration: 'none', transition: 'all 0.15s', color: '#1E293B' }}
      onMouseOver={(e) => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#C7D2FE'; }}
      onMouseOut={(e) => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#F1F5F9'; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 18, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
      <div style={{ fontSize: 12, color: color, fontWeight: 700 }}>↗</div>
    </a>
  );
}

function InfoBox({ label, value, icon }) {
  return (
    <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{value}</div>
    </div>
  );
}
