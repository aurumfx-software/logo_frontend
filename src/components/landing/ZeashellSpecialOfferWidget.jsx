import React, { useState, useEffect, useRef } from 'react';
import {
  HiX,
  HiOutlineSparkles,
  HiChevronRight,
  HiOutlineFire,
  HiPhone,
  HiTag,
} from 'react-icons/hi';
import { FaFire } from 'react-icons/fa';

const DEFAULT_SPECIAL_OFFERS = [
  {
    id: 'sp-1',
    title: 'Flash Mega Sale — Flat 50% Off at Bag Bazaar',
    description: 'Get up to 50% discount on branded travel trolleys, backpacks and luggage.',
    merchant: 'BAG BAZAAR',
    category: 'Retail & Shopping',
    badge: 'FLAT 50% OFF',
    validity: 'Limited Time Offer',
    phone: '9400400285',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/f183f22512ae4d35990bbef9cbb018fe.jpeg',
    targetUrl: '#',
  },
  {
    id: 'sp-2',
    title: 'Exclusive Festival Gold Discount — Fatima Jewellery',
    description: 'Special 0% making charges on lightweight wedding collections & diamond jewellery.',
    merchant: 'Fatima Jewellery',
    category: 'Shopping & Fashion',
    badge: '0% MAKING CHARGE',
    validity: 'Festive Season',
    phone: '04985205901',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/7c6b1ef681754e98a7bf2a3f6d50cafa.jpeg',
    targetUrl: '#',
  },
  {
    id: 'sp-3',
    title: 'Free Consultation & Service Voucher — Pavizham',
    description: 'Complimentary modular kitchen 3D visualization and home decor estimate.',
    merchant: 'Pavizham Associates',
    category: 'Interiors & Furniture',
    badge: 'FREE 3D DESIGN',
    validity: 'Valid Till Month End',
    phone: '9847123456',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/aa95cf6a6a1e4ca69e2ec8c7df871d92.jpg',
    targetUrl: '#',
  },
];

export default function ZeashellSpecialOfferWidget({
  offers = [],
  onViewOffer,
  onCallMerchant,
  onExploreAll,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  const displayOffers = React.useMemo(() => {
    return Array.isArray(offers) && offers.length > 0 ? offers : DEFAULT_SPECIAL_OFFERS;
  }, [offers]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Offer Button (Bottom Right) */}
      <button
        ref={buttonRef}
        type="button"
        className={`zeas-floating-special-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View Special Offers & Deals"
        title="Special Offers & Deals"
      >
        <div className="zeas-floating-btn-icon-wrap">
          <FaFire className="zeas-floating-btn-fire-icon" size={18} />
        </div>
        <span className="zeas-floating-btn-text">
          <span className="zeas-pulse-dot" />
          SPECIAL OFFER
        </span>
      </button>

      {/* Offer Popup Card (Zeashell Style Dialog) */}
      {isOpen && (
        <div className="zeas-offer-popup-card" ref={popupRef} role="dialog" aria-modal="true">
          {/* Header */}
          <div className="zeas-offer-popup-header">
            <div className="zeas-offer-popup-hero">
              <div className="zeas-offer-popup-fire-badge">
                <FaFire size={18} color="#ef4444" />
              </div>
              <div className="zeas-offer-popup-titles">
                <div className="zeas-offer-popup-tag">
                  <HiOutlineFire size={13} />
                  <span>SPECIAL DEALS</span>
                </div>
                <h3 className="zeas-offer-popup-title">Kerala Exclusive Offers</h3>
                <p className="zeas-offer-popup-subtitle">
                  Discounts and special perks from verified local shops
                </p>
              </div>
            </div>

            <button
              type="button"
              className="zeas-offer-popup-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close special offers popup"
            >
              <HiX size={18} />
            </button>
          </div>

          {/* Offers List */}
          <div className="zeas-offer-popup-body">
            {displayOffers.map((offer, idx) => {
              const imgUrl = offer.imageUrl || offer.image_url || offer.bannerUrl;
              const merchantName = offer.merchant || offer.merchantName || offer.business_name || 'Verified Merchant';
              const badgeText = offer.badge || offer.discount || 'SPECIAL DEAL';
              const phone = offer.phone || offer.phone_number;

              return (
                <div
                  key={offer.id || idx}
                  className="zeas-offer-popup-item"
                  onClick={() => {
                    if (onViewOffer) {
                      onViewOffer(offer);
                    } else if (offer.targetUrl && offer.targetUrl !== '#') {
                      window.open(offer.targetUrl, '_blank');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {imgUrl && (
                    <div className="zeas-offer-popup-item-thumb">
                      <img src={imgUrl} alt={offer.title} />
                    </div>
                  )}

                  <div className="zeas-offer-popup-item-info">
                    <div className="zeas-offer-popup-item-top">
                      <span className="zeas-offer-popup-merchant">{merchantName}</span>
                      <span className="zeas-offer-popup-badge">{badgeText}</span>
                    </div>

                    <h4 className="zeas-offer-popup-item-title">{offer.title}</h4>
                    <p className="zeas-offer-popup-item-desc">{offer.description}</p>

                    <div className="zeas-offer-popup-item-footer">
                      <span className="zeas-offer-popup-cat">
                        <HiTag size={12} style={{ display: 'inline', marginRight: 3 }} />
                        {offer.category || 'General'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {phone && (
                          <button
                            type="button"
                            className="zeas-offer-popup-call-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onCallMerchant) onCallMerchant(phone);
                              else window.open(`tel:${phone}`, '_self');
                            }}
                            title={`Call ${phone}`}
                          >
                            <HiPhone size={12} /> Call
                          </button>
                        )}
                        <span className="zeas-offer-popup-claim">
                          View Deal <HiChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="zeas-offer-popup-footer">
            <button
              type="button"
              className="zeas-offer-popup-viewall-btn"
              onClick={() => {
                setIsOpen(false);
                if (onExploreAll) {
                  onExploreAll();
                } else {
                  const el = document.getElementById('featured-offers-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <HiOutlineSparkles size={16} />
              <span>Explore All Featured Deals &amp; Offers</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
