import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiLocationMarker,
  HiPhone,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiArrowUp,
  HiMail,
  HiCheckCircle,
  HiX,
  HiMenu,
  HiInformationCircle,
  HiStar,
  HiQrcode,
  HiUser,
  HiUserAdd,
  HiLogout,
  HiViewGrid,
  HiShieldCheck,
  HiLockClosed,
  HiPlus,
  HiPhotograph,
  HiVideoCamera,
  HiClock,
  HiBriefcase,
} from 'react-icons/hi';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTwitter,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import {
  fetchMerchantsList,
  createMerchant,
  getMerchantById,
  searchMerchants,
  uploadMerchantMedia,
} from '../api/merchantApi';
import { fetchCategoriesList } from '../api/categoryApi';
import { fetchPromotionsList } from '../api/promotionApi';
import {
  filterAndRankMerchants,
  detectSearchIntent,
  generateFuzzySuggestions,
  matchTokenToLocation,
} from '../utils/fuzzySearch';
import ZeashellNavbar from '../components/landing/ZeashellNavbar';
import ZeashellIntroSplash from '../components/landing/ZeashellIntroSplash';
import ZeashellBannerSlider from '../components/landing/ZeashellBannerSlider';
import ZeashellMiddleBannerSlider from '../components/landing/ZeashellMiddleBannerSlider';
import ZeashellEnvatoShowcase from '../components/landing/ZeashellEnvatoShowcase';
import ZeashellCategoryRow from '../components/landing/ZeashellCategoryRow';
import ZeashellMerchantCard from '../components/landing/ZeashellMerchantCard';
import ZeashellOffersCarousel from '../components/landing/ZeashellOffersCarousel';
import ZeashellSpecialOfferWidget from '../components/landing/ZeashellSpecialOfferWidget';
import ZeashellShopModal from '../components/landing/ZeashellShopModal';
import ZeashellCallDialog from '../components/landing/ZeashellCallDialog';
import ZeashellLocationPromptModal, {
  detectAccurateUserLocation,
  KERALA_DISTRICT_COORDINATES,
  KERALA_TOWN_COORDINATES,
} from '../components/landing/ZeashellLocationPromptModal';
import '../components/landing/zeashell-landing.css';

// Popular Categories in Kerala (Matching Concept Screenshot 1 & 3)
const conceptCategories = [
  { id: 1, title: 'Food & Dining', icon: '🍽️', color: '#FFF1F2', iconColor: '#E11D48' },
  { id: 2, title: 'Supermarkets & Groceries', icon: '🛒', color: '#FFF7ED', iconColor: '#EA580C' },
  { id: 3, title: 'Mobiles & Electronics', icon: '📱', color: '#EFF6FF', iconColor: '#2563EB' },
  { id: 4, title: 'Fashion & Textiles', icon: '👕', color: '#FDF2F8', iconColor: '#DB2777' },
  { id: 5, title: 'Gold & Jewellery', icon: '💎', color: '#FFFBEB', iconColor: '#D97706' },
  { id: 6, title: 'Healthcare & Wellness', icon: '💊', color: '#F0FDF4', iconColor: '#16A34A' },
  { id: 7, title: 'Automobiles & Workshops', icon: '🚗', color: '#F8FAFC', iconColor: '#475569' },
  { id: 8, title: 'Beauty, Salons & Spas', icon: '✂️', color: '#FAF5FF', iconColor: '#9333EA' },
  { id: 9, title: 'Home, Furniture & Hardware', icon: '🏠', color: '#FEF3C7', iconColor: '#B45309' },
  { id: 10, title: 'Local Home Services', icon: '🔧', color: '#F1F5F9', iconColor: '#0F172A' },
  { id: 11, title: 'Education & Coaching', icon: '🎓', color: '#FFF7ED', iconColor: '#EA580C', active: true },
  { id: 12, title: 'Professional & Events', icon: '💼', color: '#F3E8FF', iconColor: '#7E22CE' },
];

// 🔥 Featured Offers (Matching Concept Screenshot 2)
const conceptOffers = [
  {
    id: 1,
    merchant: 'Elegant Fashions',
    title: 'Season End Sale',
    description: 'Up to 50% off on selected ethnic and western wear collections.',
    validity: 'Valid until 31 Dec 2026',
    category: 'Fashion',
    discount: 'Up to 50% OFF',
    bgGradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
  },
  {
    id: 2,
    merchant: 'TechZone Electronics',
    title: 'Smart Gadget Deals',
    description: 'Exclusive discounts on smartwatches, audio gear and accessories.',
    validity: 'Valid until 31 Dec 2026',
    category: 'Electronics',
    discount: 'Up to 40% OFF',
    bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
  },
  {
    id: 3,
    merchant: 'PowerFit Gym',
    title: 'First Month Free',
    description: 'Get your first month free on any annual gym membership plan.',
    validity: 'Valid until 31 Dec 2026',
    category: 'Health & Fitness',
    discount: '1 Month FREE',
    bgGradient: 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
  },
  {
    id: 4,
    merchant: 'Glow Beauty Salon',
    title: 'Bridal Package Offer',
    description: 'Complete bridal makeup & hair styling package at exclusive prices.',
    validity: 'Valid until 31 Dec 2026',
    category: 'Beauty',
    discount: 'Special Deal',
    bgGradient: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)',
  },
];



// 30 Featured Categories List (Matching Screenshot 1 & 3: category.php)
const featuredCategoriesList = [
  { id: 1, title: 'Helmets & Accessories', key: 'helmets' },
  { id: 2, title: 'Software Development', key: 'software' },
  { id: 3, title: 'Agricultural Research Institute', key: 'agri_research' },
  { id: 4, title: 'Cleaning Machine', key: 'cleaning' },
  { id: 5, title: 'Bakery', key: 'bakery' },
  { id: 6, title: 'Agricultural Office', key: 'agri_office' },
  { id: 7, title: 'Physiotherapy', key: 'physiotherapy' },
  { id: 8, title: 'Crime Branch Office', key: 'police' },
  { id: 9, title: 'Catering Service', key: 'catering' },
  { id: 10, title: 'Supplyco Store', key: 'supplyco' },
  { id: 11, title: 'Light House', key: 'lighthouse' },
  { id: 12, title: 'Ration Shop', key: 'ration' },
  { id: 13, title: 'Museum', key: 'museum' },
  { id: 14, title: "Children's Welfare Centre", key: 'child_welfare' },
  { id: 15, title: 'Fruits & Juice Shop', key: 'juice' },
  { id: 16, title: 'Pastry & Cake Shop', key: 'pastry' },
  { id: 17, title: 'Poultry & Livestock Sales', key: 'poultry' },
  { id: 18, title: 'Temple', key: 'temple' },
  { id: 19, title: 'Homeo clinic', key: 'homeo' },
  { id: 20, title: 'Health Centre', key: 'health_center' },
  { id: 21, title: 'Hotel Residencies', key: 'hotel' },
  { id: 22, title: 'Petrol Pumps', key: 'petrol' },
  { id: 23, title: 'Anganvadi', key: 'anganvadi' },
  { id: 24, title: 'E V Charging', key: 'ev' },
  { id: 25, title: 'ATM', key: 'atm' },
  { id: 26, title: 'Home Furnishing', key: 'furnishing' },
  { id: 27, title: 'Job consultancy', key: 'job' },
  { id: 28, title: 'Home stay', key: 'homestay' },
  { id: 29, title: 'Lottery Department', key: 'lottery' },
  { id: 30, title: 'Furniture & Woods', key: 'furniture' },
];

const renderCategoryIcon = (key) => {
  switch (key) {
    case 'helmets':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 36C12 22.7 22.7 12 36 12C49.3 12 60 22.7 60 36V44H36C28 44 24 48 20 48H12V36Z"/>
          <circle cx="26" cy="36" r="3" fill="currentColor"/>
          <path d="M32 24H52"/>
        </svg>
      );
    case 'software':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="12" width="36" height="24" rx="3"/>
          <path d="M22 20L18 24L22 28M42 20L46 24L42 28M34 18L30 30"/>
          <path d="M32 36V46M20 46H44"/>
        </svg>
      );
    case 'agri_research':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M26 12V24L14 44C12.5 46.5 14.3 50 17.3 50H46.7C49.7 50 51.5 46.5 50 44L38 24V12"/>
          <path d="M22 12H42M32 26V16M32 16C32 12 38 10 40 6M32 20C32 16 26 14 24 10"/>
          <circle cx="42" cy="38" r="7"/>
          <path d="M47 43L53 49"/>
        </svg>
      );
    case 'cleaning':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 48L32 20L42 24L20 52H10V48Z"/>
          <path d="M32 20L44 10L52 14L40 26"/>
          <circle cx="48" cy="46" r="6"/>
          <path d="M24 40H42M14 52H54"/>
        </svg>
      );
    case 'bakery':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 28V50H52V28"/>
          <path d="M8 28H56L52 16H12L8 28Z"/>
          <path d="M20 38H44V50H20V38Z"/>
          <path d="M28 28C28 32 36 32 36 28"/>
        </svg>
      );
    case 'agri_office':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="16" y="20" width="32" height="32" rx="2"/>
          <path d="M28 12H36V20H28V12Z"/>
          <rect x="22" y="26" width="6" height="6"/>
          <rect x="36" y="26" width="6" height="6"/>
          <rect x="22" y="36" width="6" height="6"/>
          <rect x="36" y="36" width="6" height="6"/>
          <path d="M28 52V44H36V52"/>
        </svg>
      );
    case 'physiotherapy':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="36" cy="14" r="5" fill="currentColor"/>
          <path d="M20 50C24 40 30 32 40 28C48 24 50 18 42 16C34 14 26 22 20 30C14 38 12 44 20 50Z"/>
          <path d="M12 40C20 48 34 52 52 42"/>
        </svg>
      );
    case 'police':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 24L32 14L52 24V50H12V24Z"/>
          <path d="M8 24H56"/>
          <circle cx="32" cy="24" r="4"/>
          <rect x="24" y="34" width="16" height="16"/>
          <path d="M32 34V50"/>
        </svg>
      );
    case 'catering':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="44" cy="16" r="5"/>
          <path d="M44 21V32M36 32H50M24 38C34 38 40 34 44 32L38 48H32L28 54H16L20 44"/>
          <path d="M24 36H48M12 36H24"/>
        </svg>
      );
    case 'supplyco':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 26L32 14L48 26V50H16V26Z"/>
          <rect x="24" y="32" width="16" height="18"/>
          <rect x="28" y="20" width="8" height="6"/>
        </svg>
      );
    case 'lighthouse':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M26 20L22 52H42L38 20H26Z"/>
          <path d="M24 20H40V14L32 8L24 14V20Z"/>
          <path d="M20 52C28 48 36 54 44 50"/>
          <path d="M24 30H40M23 40H41"/>
        </svg>
      );
    case 'ration':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 24L32 12L54 24V50H10V24Z"/>
          <rect x="20" y="30" width="24" height="20"/>
          <path d="M20 38H44M20 44H44M32 30V50"/>
        </svg>
      );
    case 'museum':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 22L32 10L56 22V26H8V22Z"/>
          <path d="M14 26V46M26 26V46M38 26V46M50 26V46"/>
          <path d="M8 46H56V52H8V46Z"/>
        </svg>
      );
    case 'child_welfare':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 10C42 10 50 18 50 30C50 44 32 54 32 54C32 54 14 44 14 30C14 18 22 10 32 10Z"/>
          <circle cx="32" cy="26" r="4"/>
          <path d="M26 40C26 34 38 34 38 40"/>
        </svg>
      );
    case 'juice':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 24H50L46 50H18L14 24Z"/>
          <path d="M10 24H54L48 14H16L10 24Z"/>
          <path d="M24 34V42M32 32V44M40 34V42"/>
          <path d="M38 14L44 6"/>
        </svg>
      );
    case 'pastry':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 24H52V50H12V24Z"/>
          <path d="M8 24C12 20 20 20 24 24C28 20 36 20 40 24C44 20 52 20 56 24"/>
          <path d="M20 34H44M20 42H44"/>
          <path d="M32 12V20"/>
        </svg>
      );
    case 'poultry':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 48L24 28L36 34L48 20"/>
          <circle cx="48" cy="18" r="4"/>
          <path d="M10 50H54"/>
          <path d="M20 50C20 42 28 40 32 50"/>
        </svg>
      );
    case 'temple':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 8L44 20H20L32 8Z"/>
          <path d="M16 20H48V30H16V20Z"/>
          <path d="M12 30H52V42H12V30Z"/>
          <path d="M8 42H56V52H8V42Z"/>
          <path d="M28 52V42H36V52"/>
        </svg>
      );
    case 'homeo':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 28L32 12L52 28V52H12V28Z"/>
          <path d="M32 30V44M25 37H39"/>
        </svg>
      );
    case 'health_center':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="16" width="36" height="36" rx="3"/>
          <circle cx="32" cy="26" r="6"/>
          <path d="M32 23V29M29 26H35"/>
          <rect x="22" y="38" width="6" height="14"/>
          <rect x="36" y="38" width="6" height="14"/>
        </svg>
      );
    case 'hotel':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="20" width="24" height="32" rx="2"/>
          <rect x="38" y="28" width="14" height="24" rx="2"/>
          <circle cx="48" cy="14" r="5"/>
          <path d="M20 28H26M30 28H34M20 36H26M30 36H34M20 44H26M30 44H34"/>
        </svg>
      );
    case 'petrol':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="16" y="14" width="24" height="38" rx="3"/>
          <rect x="22" y="20" width="12" height="10"/>
          <path d="M40 24H48C50 24 52 26 52 28V42C52 45 49 46 47 44L44 41"/>
          <circle cx="44" cy="41" r="2" fill="currentColor"/>
        </svg>
      );
    case 'anganvadi':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="20"/>
          <path d="M24 38C26 30 38 30 40 38"/>
          <circle cx="26" cy="26" r="3"/>
          <circle cx="38" cy="26" r="3"/>
        </svg>
      );
    case 'ev':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="16" y="14" width="24" height="38" rx="3"/>
          <path d="M28 22L24 32H30L26 42"/>
          <path d="M40 24H48V38C48 41 46 43 43 43"/>
          <path d="M41 43V48M45 43V48"/>
        </svg>
      );
    case 'atm':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="12" width="36" height="40" rx="3"/>
          <rect x="20" y="18" width="24" height="10"/>
          <rect x="20" y="32" width="24" height="4"/>
          <rect x="24" y="40" width="16" height="8"/>
        </svg>
      );
    case 'furnishing':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 36H52V46H12V36Z"/>
          <path d="M16 26H48V36H16V26Z"/>
          <path d="M14 46V52M50 46V52"/>
          <path d="M20 14L28 26M28 14H20"/>
        </svg>
      );
    case 'job':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22" cy="20" r="5"/>
          <circle cx="42" cy="20" r="5"/>
          <path d="M14 36C14 30 30 30 30 36"/>
          <path d="M34 36C34 30 50 30 50 36"/>
          <path d="M12 44H52"/>
        </svg>
      );
    case 'homestay':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 28L32 12L52 28V52H12V28Z"/>
          <path d="M20 44H44V36H20V44Z"/>
          <circle cx="26" cy="32" r="3"/>
        </svg>
      );
    case 'lottery':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="20"/>
          <path d="M20 36L32 20L44 36H20Z"/>
          <circle cx="32" cy="40" r="2" fill="currentColor"/>
        </svg>
      );
    case 'furniture':
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 32H36V44H14V32Z"/>
          <path d="M18 24H32V32H18V24Z"/>
          <rect x="42" y="20" width="12" height="28" rx="2"/>
          <path d="M16 44V50M34 44V50M44 48V50M52 48V50"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="16" y="16" width="32" height="32" rx="4"/>
        </svg>
      );
  }
};

// Banner promotional slides data (matching screenshots)
const promoBanners = [
  {
    id: 1,
    title: 'TRENDS LIFESTYLE & FASHION',
    subtitle: 'Top Brands & Huge Discounts',
    description: 'Exclusive collections, trendy apparel, shoes, and luxury accessories. Wholesale & Retail.',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    badge: 'FEATURED STORE',
    location: 'Kerala',
    phone: '09372 702692',
    accentColor: '#38BDF8',
    tagline: 'Up to 65% OFF | Best Lifestyle Store in Kerala',
  },
  {
    id: 2,
    title: 'ONLINE ART CLASSES',
    subtitle: 'Explore Your Creativity in Just 1 Hour a Day!',
    description: 'Open to all ages (Kids & Adults). Flexible schedules, small groups & solo classes.',
    bgGradient: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
    badge: 'EDUCATION',
    location: 'Online / Payyanur',
    phone: '07026 595769',
    accentColor: '#90E0EF',
    tagline: 'By Arthana | Flexible Schedules | Beginner Friendly',
  },
  {
    id: 3,
    title: 'VR HERO MOTORS',
    subtitle: 'Hero Authorized Dealer - 3 Years Free Service',
    description: 'Special offers on Hero scooters & bikes. 5 years warranty, easy financing available.',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0077b6 100%)',
    badge: 'AUTOMOBILE',
    location: 'Peringome, Kannur',
    phone: '04985 219191',
    accentColor: '#38BDF8',
    tagline: '0% Down Payment | 5 Years Warranty | Easy Finance',
  },
  {
    id: 4,
    title: 'LIFE MEDICALS & SURGICALS',
    subtitle: 'We Care Your Life - All Medical Supplies',
    description: 'Complete range of medicines, surgical instruments, wellness care, and diagnostic tools.',
    bgGradient: 'linear-gradient(135deg, #0096c7 0%, #03045e 100%)',
    badge: 'HEALTHCARE',
    location: 'Manna, Taliparamba',
    phone: '04672 206111',
    accentColor: '#48CAE4',
    tagline: 'Essential Medicines | Surgical Equipment | 24/7 Service',
  },
  {
    id: 5,
    title: 'GLOBAL SOLAR POWER SOLUTION',
    subtitle: 'KSEB Approved Solar Panel Installations',
    description: 'Reduce your electricity bills with clean solar power. On-grid and off-grid solutions.',
    bgGradient: 'linear-gradient(135deg, #0077b6 0%, #023e8a 100%)',
    badge: 'SOLAR ENERGY',
    location: 'Payyanur - Padanna',
    phone: '08921 669652',
    accentColor: '#CAF0F8',
    tagline: 'Govt Subsidy Eligible | Free Site Inspection | Solar Subsidy',
  },
  {
    id: 6,
    title: 'CASTILLO INTERIORS',
    subtitle: 'Modular Kitchen, Gypsum Ceiling, Furniture',
    description: 'Turn your dream home into reality without breaking your budget. 2D & 3D designing.',
    bgGradient: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)',
    badge: 'INTERIORS',
    location: 'Payyanur',
    phone: '09562 753693',
    accentColor: '#38BDF8',
    tagline: 'Modular Kitchen | Gypsum Ceiling | Wardrobe & TV Units',
  },
];

// 14 Districts of Kerala Sub-Towns / Locations Mapping
const districtTownsMap = {
  thiruvananthapuram: ['Thiruvananthapuram', 'Trivandrum', 'Kovalam', 'Kazhakkoottam', 'Neyyattinkara', 'Varkala'],
  kollam: ['Kollam', 'Quilon', 'Karunagappally', 'Punalur', 'Kottarakkara', 'Paravur'],
  pathanamthitta: ['Pathanamthitta', 'Adoor', 'Thiruvalla', 'Ranni', 'Kozhencherry', 'Pandalam'],
  alappuzha: ['Alappuzha', 'Alleppey', 'Cherthala', 'Kayamkulam', 'Haripad', 'Mavelikkara'],
  kottayam: ['Kottayam', 'Pala', 'Changanassery', 'Kanjirappally', 'Vaikom', 'Ettumanoor'],
  idukki: ['Idukki', 'Munnar', 'Thodupuzha', 'Kattappana', 'Nedumkandam', 'Adimali'],
  ernakulam: ['Ernakulam', 'Kochi', 'Fort Kochi', 'Aluva', 'Edapally', 'Kakkanad', 'Angamaly', 'Perumbavoor', 'Muvattupuzha', 'Tripunithura'],
  thrissur: ['Thrissur', 'Guruvayur', 'Chalakudy', 'Athirappilly', 'Irinjalakuda', 'Kunnamkulam', 'Kodungallur'],
  palakkad: ['Palakkad', 'Ottapalam', 'Chittur', 'Mannarkkad', 'Shoranur', 'Pattambi', 'Alathur'],
  malappuram: ['Malappuram', 'Manjeri', 'Perinthalmanna', 'Tirur', 'Kottakkal', 'Ponnani', 'Nilambur'],
  kozhikode: ['Kozhikode', 'Calicut', 'Feroke', 'Vadakara', 'Koyilandy', 'SM Street', 'Ramanattukara', 'Balussery'],
  wayanad: ['Wayanad', 'Kalpetta', 'Sulthan Bathery', 'Mananthavady', 'Vythiri', 'Meppadi'],
  kannur: ['Payyanur', 'Taliparamba', 'Peringome', 'Kannur', 'Thalassery', 'Koothuparamba', 'Mattannur', 'Iritty'],
  kasaragod: ['Kasaragod', 'Kanhangad', 'Bekal', 'Trikaripur', 'Nileshwar', 'Cheruvathur', 'Manjeshwar'],
};

// Places Data (ONLY 14 Districts of Kerala with Landmark Images)
const placesList = [
  {
    id: 'thiruvananthapuram',
    name: 'Thiruvananthapuram',
    isDistrict: true,
    landmark: 'Padmanabhaswamy Temple & Kovalam',
    count: 520,
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&auto=format&fit=crop&q=80',
    description: 'Capital district of Kerala, famous for Sri Padmanabhaswamy Temple, Kovalam Beach, and Technopark.',
  },
  {
    id: 'kollam',
    name: 'Kollam',
    isDistrict: true,
    landmark: 'Jatayu Earth Center & Ashtamudi Lake',
    count: 340,
    image: 'https://images.unsplash.com/photo-1590059208753-3765e90367f0?w=600&auto=format&fit=crop&q=80',
    description: 'Gateway to Kerala backwaters, famous for Ashtamudi Lake, cashew industry, and Jatayu Rock Sculpture.',
  },
  {
    id: 'pathanamthitta',
    name: 'Pathanamthitta',
    isDistrict: true,
    landmark: 'Sabarimala Temple & Gavi Forests',
    count: 210,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    description: 'Pilgrim capital of Kerala, known for Sabarimala temple, dense eco-forests, and Aranmula metal mirrors.',
  },
  {
    id: 'alappuzha',
    name: 'Alappuzha',
    isDistrict: true,
    landmark: 'Alleppey Backwaters & Houseboats',
    count: 480,
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600&auto=format&fit=crop&q=80',
    description: 'Venice of the East, world-famous for houseboats, Vembanad backwaters, and Punnamada lake.',
  },
  {
    id: 'kottayam',
    name: 'Kottayam',
    isDistrict: true,
    landmark: 'Kumarakom Bird Sanctuary & Lakes',
    count: 390,
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=80',
    description: 'Land of Letters, Lakes & Latex; famous for Kumarakom backwaters, publishing houses, and rubber estates.',
  },
  {
    id: 'idukki',
    name: 'Idukki',
    isDistrict: true,
    landmark: 'Munnar Tea Gardens & Arch Dam',
    count: 410,
    image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=600&auto=format&fit=crop&q=80',
    description: 'Hilly spice district featuring Munnar tea gardens, Idukki Arch Dam, and Eravikulam National Park.',
  },
  {
    id: 'ernakulam',
    name: 'Ernakulam (Kochi)',
    isDistrict: true,
    landmark: 'Fort Kochi Fishing Nets & Marine Drive',
    count: 850,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    description: 'Commercial capital of Kerala, famous for Fort Kochi, Marine Drive, port harbor, and InfoPark.',
  },
  {
    id: 'thrissur',
    name: 'Thrissur',
    isDistrict: true,
    landmark: 'Vadakkunnathan Temple & Athirappilly',
    count: 620,
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80',
    description: 'Cultural capital of Kerala, home to Thrissur Pooram, Vadakkunnathan Temple, and Athirappilly Waterfalls.',
  },
  {
    id: 'palakkad',
    name: 'Palakkad',
    isDistrict: true,
    landmark: "Palakkad Fort & Silent Valley",
    count: 290,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    description: 'Gateway to Kerala, known for historic Tipu Fort, Silent Valley National Park, and paddy fields.',
  },
  {
    id: 'malappuram',
    name: 'Malappuram',
    isDistrict: true,
    landmark: 'Kottakkal Arya Vaidya Sala & Teak Museum',
    count: 450,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    description: 'Fast-growing cultural district, renowned for Ayurvedic treatment centers and Nilambur teak forests.',
  },
  {
    id: 'kozhikode',
    name: 'Kozhikode (Calicut)',
    isDistrict: true,
    landmark: 'Kappad Beach & Mananchira Square',
    count: 680,
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
    description: 'Historic City of Spices, famous for Kozhikode Halwa, Malabar culinary heritage, and Kappad Beach.',
  },
  {
    id: 'wayanad',
    name: 'Wayanad',
    isDistrict: true,
    landmark: 'Edakkal Caves & Banasura Dam',
    count: 370,
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    description: 'Hilly tourist haven featuring Edakkal prehistoric caves, Banasura Sagar Dam, and coffee plantations.',
  },
  {
    id: 'kannur',
    name: 'Kannur',
    isDistrict: true,
    landmark: 'St. Angelo Fort & Muzhappilangad Drive-in Beach',
    count: 590,
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80',
    description: 'Land of Theyyam art, famous for Muzhappilangad Drive-in Beach, St. Angelo Fort, and handloom crafts.',
  },
  {
    id: 'kasaragod',
    name: 'Kasaragod',
    isDistrict: true,
    landmark: 'Bekal Fort & Ranipuram Hills',
    count: 320,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    description: 'Northernmost district of Kerala, famous for majestic sea-side Bekal Fort and Ranipuram hill station.',
  },
];

// Initial Establishments list
const initialEstablishments = [
  {
    id: 1,
    name: 'Nas Sales Corporation',
    category: 'Solar & Electricals',
    categoryKey: 'solar',
    location: 'Taliparamba',
    phone: '+91 86067 22503',
    address: 'Koppam, Taliparamba, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviews: 84,
    description: 'Authorized dealer for solar power systems, solar water heaters, and inverter batteries.',
    highlights: ['V-Guard & Adani Solar Authorized', 'On-Grid Project Specialists', 'After Sales Service'],
  },
  {
    id: 2,
    name: 'Power Revolutions',
    category: 'Energy & Equipment',
    categoryKey: 'solar',
    location: 'Taliparamba',
    phone: '+91 94952 88967',
    address: 'Main Road, Taliparamba, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    rating: 4.6,
    reviews: 62,
    description: 'Commercial power generation solutions, heavy industrial machinery, and electrical supplies.',
    highlights: ['Generator Sales & Service', 'Industrial Wiring', '24x7 Emergency Support'],
  },
  {
    id: 3,
    name: 'Dhrona Holidays',
    category: 'Travels & Transport',
    categoryKey: 'travel',
    location: 'Taliparamba',
    phone: '+91 98094 04292',
    address: 'Bus Stand Complex, Taliparamba, Kerala',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 142,
    description: 'Luxury bus rental, tourist packages, pilgrimage tours, and tempo traveler rentals.',
    highlights: ['AC Luxury Coaches', 'Experienced Drivers', 'Outstation Tour Packages'],
  },
  {
    id: 4,
    name: 'BUDGET TYRE WORLD',
    category: 'Automobile',
    categoryKey: 'automobile',
    location: 'Taliparamba',
    phone: '+91 94004 00285',
    address: 'NH Road, Taliparamba, Kerala',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviews: 110,
    description: 'Multi-brand tyre showroom, computerized wheel alignment, 3D balancing, and nitrogen filling.',
    highlights: ['CEAT, MRF, Michelin & Apollo', '3D Wheel Alignment', 'Instant Fitting Service'],
  },
  {
    id: 5,
    name: 'HOTEL TOPFORM',
    category: 'Hotel & Restaurants',
    categoryKey: 'food',
    location: 'Payyanur',
    phone: '+91 4985 205882',
    address: 'Main Road, Payyanur, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    rating: 4.5,
    reviews: 320,
    description: 'Authentic Malabar cuisine, Biryani, seafood delicacies, and comfortable dining experience.',
    highlights: ['Famous Malabar Biryani', 'Family Restaurant', 'AC & Non-AC Rooms'],
  },
  {
    id: 6,
    name: 'ADARSH ALUMINIUM FABRICATION',
    category: 'Aluminium Fabrication',
    categoryKey: 'services',
    location: 'Payyanur',
    phone: '+91 94472 84313',
    address: 'Near Railway Station Road, Payyanur, Kerala',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviews: 95,
    description: 'Structural aluminium work, partition doors, glass facades, and architectural metal fabrications.',
    highlights: ['Custom Windows & Doors', 'Structural Glazing', 'Competitive Pricing'],
  },
  {
    id: 7,
    name: 'Life Medicals',
    category: 'Medical & Surgical Stores',
    categoryKey: 'health',
    location: 'Kanhangad',
    phone: '+91 4672 206111',
    address: 'Naaz Tower, Kanhangad, Kasaragod, Kerala',
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 210,
    description: 'Comprehensive pharmacy offering prescription drugs, surgical gear, orthopedic supports, and baby care.',
    highlights: ['24 Hours Service', 'All Surgical Equipment', 'Home Delivery Available'],
  },
  {
    id: 8,
    name: 'WESTERN ALUMINIUM',
    category: 'Aluminium Fabrication',
    categoryKey: 'services',
    location: 'Payyanur',
    phone: '+91 4985 207321',
    address: 'Main Road, Payyanur, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
    rating: 4.6,
    reviews: 78,
    description: 'Aluminium doors, windows, false ceiling installation, and toughened glass fitting.',
    highlights: ['Premium Powder Coating', 'Fast Turnaround', 'Commercial & Residential'],
  },
  {
    id: 9,
    name: 'AY Boutique & Fashion',
    category: 'Shopping & Fashion',
    categoryKey: 'shopping',
    location: 'Payyanur',
    phone: '+91 98471 23456',
    address: 'City Center Complex, Payyanur, Kerala',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviews: 154,
    description: 'Exclusive ladies designer wear, sarees, churidars, wedding collections, and tailoring.',
    highlights: ['Designer Sarees & Lehengas', 'Custom Stitching', 'New Arrival Collections'],
  },
  {
    id: 10,
    name: 'VR Hero Motors Showroom',
    category: 'Automobile',
    categoryKey: 'automobile',
    location: 'Peringome',
    phone: '+91 85476 80511',
    address: 'Raj Building, 13th Mile, Nekhli PO, Peringome, Kannur',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviews: 310,
    description: 'Official Hero MotoCorp dealership offering sales, genuine spare parts, and express service.',
    highlights: ['Splendor, Xpulse, Destini', 'Exchange Bonus', 'Zero Down Payment Scheme'],
  },
  {
    id: 11,
    name: 'Kannur Handloom Co-Op',
    category: 'Shopping & Fashion',
    categoryKey: 'shopping',
    location: 'Kannur',
    phone: '+91 4972 700123',
    address: 'Fort Road, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 180,
    description: 'Authentic Kannur cotton handloom sarees, bedsheets, dhotis, and traditional textiles.',
    highlights: ['Pure Cotton Weaves', 'Govt Certified Handloom', 'Global Shipping'],
  },
  {
    id: 12,
    name: 'Calicut Malabar Spice Hub',
    category: 'Hotel & Restaurants',
    categoryKey: 'food',
    location: 'Calicut',
    phone: '+91 4952 360099',
    address: 'SM Street, Kozhikode, Kerala',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 450,
    description: 'Authentic Kozhikode Halwa, Banana chips, local spices, and traditional snacks.',
    highlights: ['Original Kozhikode Halwa', 'Export Quality Spices', 'Gift Boxes'],
  },
];

// Featured Ads Data List
const featuredAdsList = [
  {
    id: 'ad-1',
    name: 'Bag Bazaar Payyanur',
    adBadge: 'FEATURED AD',
    offerTag: 'Up to 65% OFF',
    category: 'Luggage & Leather Goods',
    categoryKey: 'shopping',
    location: 'Payyanur',
    phone: '+91 93727 02692',
    address: 'Near Old Bus Stand, Main Road, Payyanur, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 240,
    description: 'Top-rated store for school bags, executive luggage trolleys, handbags, and travel backpacks. Wholesale & Retail prices with up to 65% discount on top brands.',
    highlights: ['VIP, American Tourister & Wildcraft', 'Wholesale & Retail Discount', 'Warranty & Repair Service'],
  },
  {
    id: 'ad-2',
    name: 'Global Solar Power Solution',
    adBadge: 'SPONSORED',
    offerTag: 'Govt Subsidy Eligible',
    category: 'Solar & Energy',
    categoryKey: 'solar',
    location: 'Payyanur',
    phone: '+91 89216 69652',
    address: 'Payyanur - Padanna Road, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 185,
    description: 'KSEB approved solar panel installations for home & commercial projects. Reduce up to 90% on monthly electricity bills with Govt subsidy benefits.',
    highlights: ['KSEB Net Metering Approved', 'Free Site Survey & Estimate', '25 Years Panel Warranty'],
  },
  {
    id: 'ad-3',
    name: 'Castillo Interiors & Modular Kitchen',
    adBadge: 'FEATURED AD',
    offerTag: 'Free 3D Design Plan',
    category: 'Interiors & Furniture',
    categoryKey: 'services',
    location: 'Payyanur',
    phone: '+91 95627 53693',
    address: 'Perumba, Payyanur, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviews: 142,
    description: 'Modern modular kitchens, gypsum false ceilings, custom wardrobes, and full house interior turn-key execution.',
    highlights: ['Free 2D & 3D Interior Plan', 'Waterproof BWP Materials', '10-Year Craftsmanship Guarantee'],
  },
  {
    id: 'ad-4',
    name: 'VR Hero Motors Dealership',
    adBadge: 'SPONSORED',
    offerTag: '0% Down Payment',
    category: 'Automobile Dealership',
    categoryKey: 'automobile',
    location: 'Kannur',
    phone: '+91 85476 80511',
    address: 'Raj Building, 13th Mile, Peringome, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 320,
    description: 'Authorized Hero MotoCorp dealership. Instant loan approval, low EMI options, 5 years warranty and 3 years free service.',
    highlights: ['All Hero Two-Wheelers Ready Stock', 'Instant On-Spot Exchange', '5-Year Manufacturer Warranty'],
  },
  {
    id: 'ad-5',
    name: 'Online Art & Craft Classes',
    adBadge: 'FEATURED AD',
    offerTag: '1st Trial Class Free',
    category: 'Education & Hobbies',
    categoryKey: 'services',
    location: 'Payyanur',
    phone: '+91 70265 95769',
    address: 'Online & Studio Classes, Payyanur, Kerala',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviews: 98,
    description: 'Interactive online & offline art classes by Arthana. Drawing, oil painting, watercolor, and craft workshops for kids & adults.',
    highlights: ['Flexible Batch Timings', 'Beginner to Advanced Modules', 'Personalized Mentorship'],
  },
  {
    id: 'ad-6',
    name: 'Life Medicals & Surgicals',
    adBadge: 'SPONSORED',
    offerTag: '24/7 Home Delivery',
    category: 'Healthcare & Pharmacy',
    categoryKey: 'health',
    location: 'Taliparamba',
    phone: '+91 4672 206111',
    address: 'Manna, Taliparamba, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 215,
    description: '24x7 medical supplier for prescription medicines, surgical instruments, diagnostic equipment, and elderly care accessories.',
    highlights: ['Full Range Surgical Supplies', 'Home Delivery in 30 Mins', 'Discounted Medicines'],
  },
  {
    id: 'ad-7',
    name: 'Malabar Spice Hub & Sweets',
    adBadge: 'FEATURED AD',
    offerTag: 'Authentic Calicut Halwa',
    category: 'Hotels & Dining',
    categoryKey: 'food',
    location: 'Kozhikode (Calicut)',
    phone: '+91 4952 360099',
    address: 'SM Street, Kozhikode, Kerala',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: 410,
    description: 'Famous Malabar confectionery & spice center. Fresh Kozhikode Halwa in 12 flavors, banana chips, and premium Kerala spices.',
    highlights: ['100% Pure Ghee Halwa', 'Vacuum Packed Gift Boxes', 'Worldwide Express Shipping'],
  },
  {
    id: 'ad-8',
    name: 'Budget Tyre World 3D Alignment',
    adBadge: 'SPONSORED',
    offerTag: 'Free Alignment Check',
    category: 'Automobile Care',
    categoryKey: 'automobile',
    location: 'Taliparamba',
    phone: '+91 94004 00285',
    address: 'NH Highway Road, Taliparamba, Kannur, Kerala',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviews: 165,
    description: 'Leading multi-brand tyre hub. Automatic 3D laser alignment, dynamic balancing, tubeless puncture repair, and nitrogen inflation.',
    highlights: ['MRF, Michelin, Apollo & CEAT', 'Laser 3D Alignment', 'Fast Wheel Balancing'],
  },
];

export default function LandingPage({ defaultTab = 'home' }) {
  const { isAuthenticated, user, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Tab & Selection State
  const [activeNavTab, setActiveNavTab] = useState(() => {
    if (location.pathname === '/places') return 'places';
    if (location.pathname === '/category.php' || location.pathname === '/categories') return 'categories';
    if (location.pathname === '/featured-ads' || location.pathname === '/ads') return 'ads';
    if (location.pathname === '/contact') return 'contact';
    return defaultTab;
  });
  const [selectedFeaturedCategory, setSelectedFeaturedCategory] = useState('Cleaning Machine');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Search & Filters
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [callDialogData, setCallDialogData] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Backend API Merchant Integration State
  const [apiMerchants, setApiMerchants] = useState([]);
  const [masterMerchants, setMasterMerchants] = useState([]);
  const [isLoadingMerchants, setIsLoadingMerchants] = useState(false);

  // Search intent detection for typo corrections & location/category tags
  const searchIntent = useMemo(() => {
    return detectSearchIntent(searchQuery);
  }, [searchQuery]);

  // Onboard Merchant Modal & Media Upload State
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [onboardError, setOnboardError] = useState('');
  const [onboardSuccess, setOnboardSuccess] = useState('');
  const [categoryOptionsList, setCategoryOptionsList] = useState([]);

  // Backend Promotions API Integration State
  const [livePromotions, setLivePromotions] = useState([]);
  const [selectedPromoModal, setSelectedPromoModal] = useState(null);

  useEffect(() => {
    let active = true;
    fetchPromotionsList()
      .then((apiPromos) => {
        if (!active) return;
        if (Array.isArray(apiPromos) && apiPromos.length > 0) {
          const colorThemes = [
            { bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', accent: '#38BDF8' },
            { bg: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)', accent: '#90E0EF' },
            { bg: 'linear-gradient(135deg, #0284c7 0%, #0077b6 100%)', accent: '#70E000' },
            { bg: 'linear-gradient(135deg, #0096c7 0%, #03045e 100%)', accent: '#48CAE4' },
            { bg: 'linear-gradient(135deg, #0077b6 0%, #023e8a 100%)', accent: '#CAF0F8' },
            { bg: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)', accent: '#38BDF8' },
          ];

          const formatted = apiPromos.map((item, idx) => {
            const theme = colorThemes[idx % colorThemes.length];
            const img = item.image_url || item.banner_url || item.bannerUrl || item.image || '';
            const vid = item.video_url || item.videoUrl || '';
            const mType = item.media_type || (vid ? 'video' : 'image');
            const tgt = item.target_url || item.targetUrl || '#';
            return {
              id: item.id || item._id || item.promo_code || `api-promo-${idx}`,
              title: item.title || item.name || 'Featured Promotion',
              placement: item.placement || 'Home Top',
              subtitle: item.placement || `${item.category || 'Featured'} Special Offer`,
              description: item.description || item.details || `Exclusive offer for ${item.category || 'local services'} in ${item.location || 'Kerala'}.`,
              bgGradient: item.bg_gradient || theme.bg,
              badge: (item.badge || item.category || item.type || 'FEATURED').toUpperCase(),
              discount: item.badge || item.discount || 'SPECIAL OFFER',
              location: item.location || 'Payyanur, Kerala',
              phone: item.phone || item.contact_phone || '07026 595769',
              accentColor: theme.accent,
              tagline: item.tagline || (item.start_date && item.end_date ? `Valid: ${item.start_date} to ${item.end_date}` : 'Limited Time Offer | Verified Merchant'),
              bannerUrl: img,
              imageUrl: img,
              image_url: img,
              videoUrl: vid,
              video_url: vid,
              mediaType: mType,
              media_type: mType,
              targetUrl: tgt,
              target_url: tgt,
              category: item.category || 'General',
              type: item.type || 'Featured',
            };
          });
          setLivePromotions(formatted);
        }
      })
      .catch((err) => {
        console.warn('Backend fetchPromotionsList notice in LandingPage:', err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayTopBanners = React.useMemo(() => {
    if (livePromotions.length > 0) {
      const top = livePromotions.filter(
        (p) =>
          (p.status === 'active' || !p.status) &&
          (!p.placement || p.placement === 'Home Top' || p.placement.toLowerCase().includes('top')) &&
          (p.imageUrl || p.bannerUrl || p.image_url || p.videoUrl || p.video_url) &&
          !((p.title || '').toLowerCase().includes('bag bazaar')) &&
          !((p.imageUrl || p.bannerUrl || p.image_url || '').includes('f183f22512ae4d35990bbef9cbb018fe')) &&
          !((p.imageUrl || p.bannerUrl || p.image_url || '').includes('4adc352793f74a30873381a9aa97dddb')) &&
          !((p.imageUrl || p.bannerUrl || p.image_url || '').includes('264078ee513f48cb9bfdbdcc0698d330')) &&
          !((p.imageUrl || p.bannerUrl || p.image_url || '').includes('a700b5903440478bab885e729bf0e67a')) &&
          !((p.imageUrl || p.bannerUrl || p.image_url || '').includes('e763c69e5ccb420eb42f7ef46db960de'))
      );
      if (top.length > 0) return top;
    }
    return [
      {
        id: 'def-wide-1',
        title: 'Kerala Festive Mega Grand Shopping Festival — Up to 50% Off',
        imageUrl: '/banners/top_grand_festival.png',
        targetUrl: '#',
        placement: 'Home Top',
      },
      {
        id: 'def-wide-2',
        title: 'Exclusive Kerala Silk & Festive Designer Fashion Collection',
        imageUrl: '/banners/top_fashion_lifestyle.png',
        targetUrl: '#',
        placement: 'Home Top',
      },
      {
        id: 'def-wide-3',
        title: 'Kerala 5G Smart Tech & Mega Electronics Expo',
        imageUrl: '/banners/kerala_electronics_fest.png',
        targetUrl: '#',
        placement: 'Home Top',
      },
      {
        id: 'def-wide-4',
        title: 'Kerala Bridal Gold & Diamond Jewellery Fest',
        imageUrl: '/banners/kerala_gold_jewellery_fest.png',
        targetUrl: '#',
        placement: 'Home Top',
      },
      {
        id: 'def-wide-5',
        title: 'Malabar Traditional Food & Dining Festival',
        imageUrl: '/banners/malabar_food_fest.png',
        targetUrl: '#',
        placement: 'Home Top',
      },
    ];
  }, [livePromotions]);

  const displayMiddleBanners = React.useMemo(() => {
    if (livePromotions && livePromotions.length > 0) {
      const mid = livePromotions.filter(
        (p) =>
          (p.status === 'active' || !p.status) &&
          p.placement &&
          (p.placement === 'Home Middle' ||
            p.placement.toLowerCase().includes('middle') ||
            p.placement === 'Sponsored') &&
          (p.imageUrl || p.bannerUrl || p.image_url || p.videoUrl || p.video_url)
      );
      // ONLY promotions added in Admin will appear here
      if (mid.length > 0) {
        return mid;
      }
    }
    return [];
  }, [livePromotions]);

  const displayFeaturedOffers = React.useMemo(() => {
    if (livePromotions.length > 0) {
      const feat = livePromotions.filter(
        (p) =>
          (p.status === 'active' || !p.status) &&
          ((p.placement && (p.placement === 'Featured Offers' || p.placement.toLowerCase().includes('offer'))) ||
            p.type === 'Featured' ||
            p.type === 'Promotion') &&
          (p.imageUrl || p.bannerUrl || p.image_url)
      );
      if (feat.length > 0) return feat;
    }
    return [
      {
        id: 'fo-1',
        title: 'BAG BAZAAR — Buy 1 Get 1 Free on Travel Bags',
        merchant: 'BAG BAZAAR',
        category: 'Retail & Shopping',
        discount: 'BUY 1 GET 1',
        description: 'Exclusive festival offer on premium suitcases and travel bags.',
        validity: 'Limited Time',
        imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/f183f22512ae4d35990bbef9cbb018fe.jpeg',
      },
      {
        id: 'fo-2',
        title: 'Fatima Jewellery — 0% Making Charge on Gold',
        merchant: 'Fatima Jewellery',
        category: 'Shopping & Fashion',
        discount: '0% MAKING CHARGE',
        description: 'HUID 916 Hallmark wedding jewellery collection discounts.',
        validity: 'Festive Season',
        imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/7c6b1ef681754e98a7bf2a3f6d50cafa.jpeg',
      },
      {
        id: 'fo-3',
        title: 'Pavizham Associates — Free Interior Design Consultation',
        merchant: 'Pavizham Associates',
        category: 'Interiors & Furniture',
        discount: 'FREE 3D DESIGN',
        description: 'Complete home interior and modular kitchen consultation voucher.',
        validity: 'Valid Till Month End',
        imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/ef965d5520a7472dbf44707f49736de9.jpg',
      },
    ];
  }, [livePromotions]);

  const displaySpecialOffers = React.useMemo(() => {
    if (livePromotions.length > 0) {
      const spec = livePromotions.filter(
        (p) =>
          (p.status === 'active' || !p.status) &&
          ((p.placement && (p.placement === 'Special Offer' || p.placement.toLowerCase().includes('special'))) ||
            p.type === 'Special Offer') &&
          (p.imageUrl || p.bannerUrl || p.image_url)
      );
      if (spec.length > 0) return spec;
    }
    return [
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
      },
    ];
  }, [livePromotions]);

  // Derived Moving Ticker Announcements from PostgreSQL Live Promotions
  const displayTickerTexts = React.useMemo(() => {
    if (livePromotions.length > 0) {
      const tickers = livePromotions.filter(
        (p) =>
          p.placement &&
          (p.placement.toLowerCase().includes('moving') ||
            p.placement.toLowerCase().includes('ticker'))
      );
      if (tickers.length > 0) return tickers;
    }
    return [
      { id: 't1', title: '⚡ Festive Season Offers — Check Out Exclusive Deals Near You' },
      { id: 't2', title: '📍 Explore 1000+ Local Shops, Restaurants & Services in Kerala' },
      { id: 't3', title: '💎 Gold & Jewellery Collections — Trending Now' },
      { id: 't4', title: '🍕 Top Rated Restaurants & Cafes — Order or Visit Today' },
      { id: 't5', title: '🔥 Mega Deals Festival — Up to 60% Off on Top Brands' },
    ];
  }, [livePromotions]);

  // Derived Above Footer Showcase from PostgreSQL Live Promotions (Placement: 'Home Bottom')
  const displayBottomShowcase = React.useMemo(() => {
    if (livePromotions.length > 0) {
      const bottom = livePromotions.filter(
        (p) =>
          (p.status === 'active' || !p.status) &&
          p.placement &&
          (p.placement === 'Above Footer' ||
            p.placement === 'Home Bottom' ||
            p.placement.toLowerCase().includes('bottom') ||
            p.placement.toLowerCase().includes('footer')) &&
          (p.imageUrl || p.bannerUrl || p.image_url || p.videoUrl || p.video_url)
      );
      if (bottom.length > 0) {
        return bottom.map((p, idx) => ({
          id: p.id || `btm-${idx}`,
          badge: p.category ? `🌟 ${p.category.toUpperCase()}` : '🌟 FEATURED PARTNER',
          title: p.title || 'Discover Kerala Excellence',
          highlightText: p.title ? p.title.split(' ')[0] : 'Kerala',
          subtitle: p.description || 'Explore verified local businesses, premium stock footage, and exclusive deals across Kerala.',
          description: p.description || 'Explore verified local businesses, premium stock footage, and exclusive deals across Kerala.',
          tags: ['🛍️ Verified Shops', '📱 Exclusive Deals', '⭐ Top Rated', '📍 Kerala'],
          ctaText: 'Explore Kerala Shops',
          targetUrl: p.target_url || '#establishments-section',
          videoUrl: p.video_url || p.videoUrl || '',
          imageUrl: p.image_url || p.imageUrl || p.banner_url || p.bannerUrl || '',
          mediaType: p.media_type || (p.video_url || p.videoUrl ? 'video' : 'image'),
        }));
      }
    }
    return null;
  }, [livePromotions]);

  const [apiCategories, setApiCategories] = useState([]);

  useEffect(() => {
    fetchCategoriesList()
      .then((catItems) => {
        if (Array.isArray(catItems) && catItems.length > 0) {
          setApiCategories(catItems);
          const fetchedNames = Array.from(new Set(catItems.map((c) => c.name || c.category_name).filter(Boolean)));
          setCategoryOptionsList(fetchedNames);
        }
      })
      .catch((err) => {
        console.warn('Backend categories fetch notice in LandingPage:', err.message);
      });
  }, []);

  const displayCategories = React.useMemo(() => {
    if (apiCategories.length > 0) {
      const colors = ['#FFF1F2', '#FFF7ED', '#EFF6FF', '#FDF2F8', '#FFFBEB', '#F0FDF4', '#F8FAFC', '#FAF5FF', '#FEF3C7', '#F1F5F9'];
      const defaultIcons = ['🍽️', '🛒', '📱', '👕', '💎', '💊', '🚗', '✂️', '🏠', '🔧', '🎓', '💼'];

      return apiCategories.map((c, idx) => ({
        id: c.id || `api-cat-${idx}`,
        title: c.name || c.category_name || 'Category',
        name: c.name || c.category_name || 'Category',
        icon: c.icon && !c.icon.startsWith('http') ? c.icon : defaultIcons[idx % defaultIcons.length],
        icon_url: c.icon_url || (c.icon && c.icon.startsWith('http') ? c.icon : ''),
        color: colors[idx % colors.length],
        description: c.description || '',
        count: c.logo_count || c.count || 0,
        active: selectedCategory === (c.name || c.category_name),
      }));
    }
    return conceptCategories;
  }, [apiCategories, selectedCategory]);


  // Form State matching API spec:
  // POST http://168.144.18.149:8000/api/v1/merchants/onboarding
  const [onboardForm, setOnboardForm] = useState({
    business_name: '',
    category: 'Retail',
    categories: ['Retail'],
    owner_name: '',
    phone_number: '+91 98470 12345',
    email: '',
    district: 'Kannur',
    city: 'Payyanur',
    address: 'Main Road',
    landmark: 'Near Bus Stand',
    services: ['Retail'],
    service_timing: '09:00 AM - 09:00 PM',
    merchant_photos: [],
    merchant_videos: [],
    user_code: 'FLS_1',
    status: 'APPROVED',
  });

  // 1. GET ALL MERCHANTS from Backend (GET /api/v1/merchants)
  useEffect(() => {
    let active = true;
    setIsLoadingMerchants(true);

    const loc = selectedDistrict !== 'all' ? selectedDistrict : selectedLocation !== 'all' ? selectedLocation : '';
    const cat = selectedCategory !== 'all' ? selectedCategory : '';

    const queryParams = {};
    if (cat) queryParams.category = cat;
    if (loc) queryParams.location = loc;

    fetchMerchantsList(queryParams)
      .then((data) => {
        if (active && Array.isArray(data)) {
          setApiMerchants(data);
          if (data.length > 0) {
            setMasterMerchants((prev) => (data.length >= prev.length ? data : prev));
          }
        }
      })
      .catch((err) => {
        console.warn('Backend merchants fetch notice:', err.message);
      })
      .finally(() => {
        if (active) setIsLoadingMerchants(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCategory, selectedDistrict, selectedLocation]);

  // Initial one-time fetch of master directory to power fuzzy search
  useEffect(() => {
    let active = true;
    fetchMerchantsList({})
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setMasterMerchants((prev) => (data.length >= prev.length ? data : prev));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // 4. SEARCH MERCHANTS via Backend API + Semantic Fuzzy Engine
  const handleBackendSearch = async (queryText) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q && selectedDistrict === 'all' && selectedCategory === 'all') {
      return;
    }
    setIsLoadingMerchants(true);
    try {
      const intent = detectSearchIntent(q);
      const loc =
        selectedDistrict !== 'all'
          ? selectedDistrict
          : selectedLocation !== 'all'
          ? selectedLocation
          : intent?.detectedLocation
          ? intent.detectedLocation.toLowerCase()
          : '';

      let results = await searchMerchants(q, loc);

      // If direct query returned 0 and an alias or typo was detected, query with corrected term
      if ((!results || results.length === 0) && intent?.hasCorrection) {
        const altTerm = intent.detectedCategory || (intent.typoCorrections[0] ? intent.typoCorrections[0].split('→')[1]?.trim() : '');
        if (altTerm && altTerm !== q) {
          const altResults = await searchMerchants(altTerm, loc);
          if (altResults && altResults.length > 0) {
            results = altResults;
          }
        }
      }

      if ((!results || results.length === 0) && loc && q) {
        // Fallback: search across all of Kerala if location-specific query returned 0
        const allKeralaResults = await searchMerchants(q, '');
        if (allKeralaResults && allKeralaResults.length > 0) {
          results = allKeralaResults;
        }
      }
      if (Array.isArray(results) && results.length > 0) {
        setApiMerchants(results);
      }
    } catch (err) {
      console.warn('Search merchants error:', err.message);
    } finally {
      setIsLoadingMerchants(false);
    }
  };

  // 3. GET MERCHANT BY ID (GET /api/v1/merchants/{id})
  const handleSelectMerchantCard = async (m) => {
    setSelectedMerchant(m);
    if (m && m.id) {
      try {
        window.history.pushState({ merchantId: m.id }, '', `/merchant/${m.id}`);
      } catch (e) {}
    }
    if (m.id && !String(m.id).startsWith('est-') && !String(m.id).startsWith('ad-')) {
      try {
        const fullDetail = await getMerchantById(m.id);
        if (fullDetail) {
          setSelectedMerchant(fullDetail);
        }
      } catch (err) {
        console.warn('Failed to load merchant by ID:', err.message);
      }
    }
  };

  // 5. UPLOAD PHOTOS / MEDIA (POST /api/v1/merchants/upload-media)
  const handleMediaUpload = async (e, type = 'photos') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingMedia(true);
    setOnboardError('');

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append(type === 'videos' ? 'videos' : 'photos', file);
      });

      const res = await uploadMerchantMedia(formData);

      if (type === 'videos') {
        const newVids = res.videos || res.photos || [];
        setOnboardForm((prev) => ({
          ...prev,
          merchant_videos: [...prev.merchant_videos, ...newVids],
        }));
      } else {
        const newPhotos = res.photos || res.all_urls || [];
        setOnboardForm((prev) => ({
          ...prev,
          merchant_photos: [...prev.merchant_photos, ...newPhotos],
        }));
      }
    } catch (err) {
      console.error('Media upload error:', err);
      setOnboardError(err.message || 'Failed to upload media file');
    } finally {
      setUploadingMedia(false);
    }
  };

  // 2. CREATE / ONBOARD MERCHANT (POST /api/v1/merchants/onboarding)
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardForm.business_name.trim()) {
      setOnboardError('Please enter a Business Name');
      return;
    }

    setOnboardLoading(true);
    setOnboardError('');
    setOnboardSuccess('');

    try {
      const newMerchant = await createMerchant(onboardForm);
      setOnboardSuccess(`Successfully onboarded "${newMerchant.name || onboardForm.business_name}"!`);

      // Prepend newly created merchant to list
      setApiMerchants((prev) => [newMerchant, ...prev]);

      setTimeout(() => {
        setOnboardModalOpen(false);
        setOnboardSuccess('');
        setOnboardForm({
          business_name: '',
          category: 'Retail',
          categories: ['Retail'],
          owner_name: '',
          phone_number: '+91 98470 12345',
          email: '',
          district: 'Kannur',
          city: 'Payyanur',
          address: 'Main Road',
          landmark: 'Near Bus Stand',
          services: ['Retail'],
          service_timing: '09:00 AM - 09:00 PM',
          merchant_photos: [],
          merchant_videos: [],
          user_code: 'FLS_1',
          status: 'APPROVED',
        });
      }, 1500);
    } catch (err) {
      console.error('Onboard merchant submit error:', err);
      setOnboardError(err.message || 'Failed to onboard merchant');
    } finally {
      setOnboardLoading(false);
    }
  };

  // Cascading Location Helpers
  const getAvailableLocations = () => {
    if (selectedDistrict !== 'all') {
      return districtTownsMap[selectedDistrict] || [];
    }
    const allTownsSet = new Set();
    Object.values(districtTownsMap).forEach((towns) => {
      towns.forEach((t) => allTownsSet.add(t));
    });
    return Array.from(allTownsSet);
  };

  const getDistrictName = (districtId) => {
    const found = placesList.find((p) => p.id === districtId);
    return found ? found.name : districtId;
  };

  const [userCoordinates, setUserCoordinates] = useState(null);
  const [userLocationLabel, setUserLocationLabel] = useState('');
  const [sortBy, setSortBy] = useState('nearest');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isWishlistActive, setIsWishlistActive] = useState(false);
  const [isWishlistPageOpen, setIsWishlistPageOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('logo_user_favs') || '[]');
    } catch {
      return [];
    }
  });

  // Customer Authentication State (for customer sign in / sign out in navbar)
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('logo_customer_user') || 'null');
    } catch {
      return null;
    }
  });
  const [customerLoginModalOpen, setCustomerLoginModalOpen] = useState(false);
  const [customerAuthTab, setCustomerAuthTab] = useState('login'); // 'login' | 'register'
  const [customerLoginForm, setCustomerLoginForm] = useState({ phone: '' });
  const [customerRegisterForm, setCustomerRegisterForm] = useState({
    name: '',
    phone: '',
    district: 'Ernakulam',
    city: '',
  });
  const [customerAuthMsg, setCustomerAuthMsg] = useState({ type: '', text: '' });

  const handleCustomerLoginSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = customerLoginForm.phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setCustomerAuthMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile number' });
      return;
    }
    const userObj = {
      name: `Customer (${cleanPhone.slice(-4)})`,
      phone: cleanPhone,
      isRegistered: false,
      loggedInAt: new Date().toISOString(),
    };
    setCustomerUser(userObj);
    try {
      localStorage.setItem('logo_customer_user', JSON.stringify(userObj));
    } catch {}
    setCustomerLoginModalOpen(false);
    setCustomerLoginForm({ phone: '' });
    setCustomerAuthMsg({ type: '', text: '' });
  };

  const handleCustomerRegisterSubmit = (e) => {
    e.preventDefault();
    const cleanName = customerRegisterForm.name.trim();
    const cleanPhone = customerRegisterForm.phone.trim().replace(/[^0-9]/g, '');
    const district = customerRegisterForm.district || 'Ernakulam';
    const city = customerRegisterForm.city.trim() || district;

    if (!cleanName) {
      setCustomerAuthMsg({ type: 'error', text: 'Please enter your Full Name' });
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setCustomerAuthMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile number' });
      return;
    }

    const userObj = {
      name: cleanName,
      phone: cleanPhone,
      district: district,
      city: city,
      isRegistered: true,
      loggedInAt: new Date().toISOString(),
    };
    setCustomerUser(userObj);
    try {
      localStorage.setItem('logo_customer_user', JSON.stringify(userObj));
    } catch {}
    setCustomerLoginModalOpen(false);
    setCustomerRegisterForm({ name: '', phone: '', district: 'Ernakulam', city: '' });
    setCustomerAuthMsg({ type: '', text: '' });
  };

  const handleCustomerQuickLogin = () => {
    const demoUser = {
      name: 'Saranya Sudheer',
      phone: '9847123456',
      district: 'Kannur',
      city: 'Payyanur',
      isRegistered: true,
      loggedInAt: new Date().toISOString(),
    };
    setCustomerUser(demoUser);
    try {
      localStorage.setItem('logo_customer_user', JSON.stringify(demoUser));
    } catch {}
    setCustomerLoginModalOpen(false);
    setCustomerAuthMsg({ type: '', text: '' });
  };

  const handleCustomerLogout = () => {
    setCustomerUser(null);
    try {
      localStorage.removeItem('logo_customer_user');
    } catch {}
  };

  // Auto-check location on first visit before browsing
  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem('zeashell_user_location');
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed.lat && parsed.lng) {
          setUserCoordinates({ lat: parsed.lat, lng: parsed.lng });
          if (parsed.name) {
            setUserLocationLabel(parsed.name);
          }
          if (parsed.district && parsed.district !== 'all') {
            setSelectedDistrict(parsed.district);
          }
          if (parsed.name && parsed.type === 'town') {
            setSelectedLocation(parsed.name.toLowerCase());
          }
          setSortBy('nearest');
        }
      } else {
        // First visit -> Auto-detect location seamlessly using IP/GPS
        detectAccurateUserLocation()
          .then((loc) => {
            if (loc && loc.lat && loc.lng) {
              setUserCoordinates({ lat: loc.lat, lng: loc.lng });
              if (loc.name) setUserLocationLabel(loc.name);
              setSortBy('nearest');
              try {
                localStorage.setItem('zeashell_user_location', JSON.stringify(loc));
              } catch {}
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const handleLocationChosen = (locData) => {
    setIsLocationModalOpen(false);
    if (!locData || locData.type === 'all' || locData.type === 'deny') {
      setSelectedDistrict('all');
      setSelectedLocation('all');
      setUserCoordinates(null);
      setUserLocationLabel('');
      try {
        localStorage.setItem('zeashell_user_location', JSON.stringify({ type: 'deny', district: 'all' }));
      } catch {}
      return;
    }

    setUserCoordinates({ lat: locData.lat, lng: locData.lng });
    setSortBy('nearest');

    if (locData.name) {
      setUserLocationLabel(locData.name);
    }

    // When GPS/current location is active, keep all merchants accessible so closest are ranked first
    if (locData.type === 'district' && locData.district && locData.district !== 'all') {
      setSelectedDistrict(locData.district);
      setSelectedLocation('all');
    } else {
      setSelectedDistrict('all');
      setSelectedLocation('all');
    }

    try {
      localStorage.setItem('zeashell_user_location', JSON.stringify(locData));
    } catch {}

    // Scroll smoothly to shops section showing customer's local merchants first
    setTimeout(() => {
      const el = document.getElementById('establishments-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 250);
  };

  // Resolve merchant coordinates accurately across all Kerala towns & districts
  const getMerchantCoords = (m) => {
    if (m.latitude && m.longitude && Number(m.latitude) !== 0 && Number(m.longitude) !== 0) {
      return { lat: Number(m.latitude), lng: Number(m.longitude) };
    }
    const locText = `${m.city || ''} ${m.location || ''} ${m.district || ''} ${m.address || ''}`.toLowerCase();
    for (const [key, town] of Object.entries(KERALA_TOWN_COORDINATES)) {
      if (locText.includes(key)) {
        return { lat: town.lat, lng: town.lng };
      }
    }
    for (const [distKey, dist] of Object.entries(KERALA_DISTRICT_COORDINATES)) {
      if (locText.includes(distKey) || locText.includes(dist.name.toLowerCase())) {
        return { lat: dist.lat, lng: dist.lng };
      }
    }
    return { lat: 9.9816, lng: 76.2999 }; // Default central Kerala hub (Kochi)
  };

  const handleToggleFavorite = (merchantId) => {
    setUserFavorites((prev) => {
      const next = prev.includes(merchantId)
        ? prev.filter((id) => id !== merchantId)
        : [...prev, merchantId];
      try {
        localStorage.setItem('logo_user_favs', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const openGoogleMaps = (name, address, e) => {
    if (e) e.stopPropagation();
    const query = encodeURIComponent(`${name}, ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  const handleDetectLocation = () => {
    setIsLocationModalOpen(true);
  };

  const getSearchSuggestions = () => {
    if (!searchQuery.trim()) return [];
    const pool = masterMerchants.length > 0 ? masterMerchants : (apiMerchants.length > 0 ? apiMerchants : initialEstablishments);
    return generateFuzzySuggestions(pool, searchQuery, 6);
  };

  const handleSelectSuggestion = (sug) => {
    if (sug.type === 'location') {
      const locMatch = matchTokenToLocation(sug.text);
      if (locMatch) {
        setSelectedDistrict(locMatch.district);
        setSelectedLocation('all');
      } else {
        setSelectedLocation(sug.text.toLowerCase());
      }
      setSearchQuery('');
    } else if (sug.type === 'category') {
      setSelectedCategory(sug.text);
      setSearchQuery('');
    } else if (sug.type === 'establishment') {
      setSearchQuery(sug.text);
      handleBackendSearch(sug.text);
    }
    setShowSuggestions(false);
    scrollToSection('establishments-section');
  };

  // Check route to auto-scroll if visited via /places or /categories or /featured-ads
  useEffect(() => {
    if (location.pathname === '/places') {
      setTimeout(() => {
        const el = document.getElementById('places-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else if (location.pathname === '/category.php' || location.pathname === '/categories') {
      setTimeout(() => {
        const el = document.getElementById('featured-categories-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else if (location.pathname === '/featured-ads' || location.pathname === '/ads') {
      setTimeout(() => {
        const el = document.getElementById('featured-ads-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else if (location.pathname === '/contact') {
      setTimeout(() => {
        const el = document.getElementById('contact-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location]);

  const displayBanners = livePromotions.length > 0 ? livePromotions : promoBanners;

  // Auto slide carousel
  useEffect(() => {
    if (!displayBanners.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBanners.length]);


  // Scroll listener for floating button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter Places list
  const filteredPlaces = placesList.filter(
    (place) =>
      place.name.toLowerCase().includes(placeSearchQuery.toLowerCase()) ||
      (place.landmark && place.landmark.toLowerCase().includes(placeSearchQuery.toLowerCase())) ||
      place.description.toLowerCase().includes(placeSearchQuery.toLowerCase())
  );

  // Smart Cascading District & Sub-Location Matching Helper
  // Smart Cascading District & Sub-Location Matching Helper
  const matchesLocationFilter = (itemLoc, itemAddress) => {
    if (selectedDistrict === 'all' && selectedLocation === 'all') return true;
    const locText = `${itemLoc || ''} ${itemAddress || ''}`.toLowerCase();

    // 1. District Level Filter Check
    if (selectedDistrict && selectedDistrict !== 'all') {
      const districtTowns = districtTownsMap[selectedDistrict] || [];
      const districtObj = placesList.find((p) => p.id === selectedDistrict);
      const districtNameLower = districtObj ? districtObj.name.toLowerCase() : selectedDistrict.toLowerCase();

      const matchesDistrict =
        locText.includes(districtNameLower) ||
        districtNameLower.includes(locText) ||
        districtTowns.some((t) => locText.includes(t.toLowerCase()));

      if (!matchesDistrict) return false;
    }

    // 2. Town / Sub-Location Level Filter Check
    if (selectedLocation && selectedLocation !== 'all') {
      const locLower = selectedLocation.toLowerCase();
      if (!locText.includes(locLower)) {
        return false;
      }
    }

    return true;
  };

  // Filter Featured Ads list
  const filteredFeaturedAds = featuredAdsList.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      item.categoryKey === selectedCategory ||
      (item.category && item.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (selectedCategory && selectedCategory.toLowerCase().includes(item.category ? item.category.toLowerCase() : ''));
    const matchesLocation = matchesLocationFilter(item.location, item.address);
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.offerTag && item.offerTag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesLocation && matchesSearch;
  });

  // Combined master pool for full search discovery
  const allCandidatePool = useMemo(() => {
    if (masterMerchants.length > 0) return masterMerchants;
    if (apiMerchants.length > 0) return apiMerchants;
    return initialEstablishments;
  }, [masterMerchants, apiMerchants]);

  // Use backend API merchants when loaded
  const sourceEstablishments = apiMerchants.length > 0 ? apiMerchants : initialEstablishments;

  // Filter Establishments list with Fuzzy Relevance Ranking
  const filteredEstablishments = useMemo(() => {
    const q = searchQuery.trim();
    if (q) {
      // Run intelligent fuzzy search and semantic relevance matching
      return filterAndRankMerchants(allCandidatePool, q, {
        selectedDistrict,
        selectedCategory,
      });
    }

    // Default category and location filtering
    return sourceEstablishments.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.categoryKey === selectedCategory ||
        (item.category && item.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        (selectedCategory && selectedCategory.toLowerCase().includes(item.category ? item.category.toLowerCase() : ''));
      const matchesLocation = matchesLocationFilter(item.location || item.city || item.district || '', item.address || '');
      return matchesCategory && matchesLocation;
    });
  }, [allCandidatePool, sourceEstablishments, searchQuery, selectedCategory, selectedDistrict, selectedLocation]);

  // Helper to count items per category key under active location
  const getCategoryCount = (catKey) => {
    if (catKey === 'all') {
      return (
        sourceEstablishments.filter((item) => matchesLocationFilter(item.location || item.city || item.district || '', item.address || '')).length +
        (apiMerchants.length > 0 ? 0 : featuredAdsList.filter((item) => matchesLocationFilter(item.location, item.address)).length)
      );
    }
    const estCount = sourceEstablishments.filter(
      (item) =>
        (item.categoryKey === catKey || (item.category && item.category.toLowerCase().includes(catKey.toLowerCase()))) &&
        matchesLocationFilter(item.location || item.city || item.district || '', item.address || '')
    ).length;
    const adCount = apiMerchants.length > 0
      ? 0
      : featuredAdsList.filter(
          (item) =>
            (item.categoryKey === catKey || (item.category && item.category.toLowerCase().includes(catKey.toLowerCase()))) &&
            matchesLocationFilter(item.location, item.address)
        ).length;
    return estCount + adCount;
  };

  const resetAllFilters = () => {
    setSelectedDistrict('all');
    setSelectedLocation('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const sortItems = (items) => {
    const list = [...items];
    if (sortBy === 'nearest' || ((!sortBy || sortBy === 'recommended') && userCoordinates)) {
      const uCoords = userCoordinates || { lat: 9.9816, lng: 76.2999 };
      return list.sort((a, b) => {
        const coordsA = getMerchantCoords(a);
        const coordsB = getMerchantCoords(b);
        const distA = calculateDistance(uCoords.lat, uCoords.lng, coordsA.lat, coordsA.lng);
        const distB = calculateDistance(uCoords.lat, uCoords.lng, coordsB.lat, coordsB.lng);
        return distA - distB;
      });
    }
    if (sortBy === 'rating' || sortBy === 'rating_desc') {
      return list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }
    if (sortBy === 'name' || sortBy === 'name_asc') {
      return list.sort((a, b) => (a.business_name || a.name || '').localeCompare(b.business_name || b.name || ''));
    }
    if (sortBy === 'category_asc') {
      return list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    }
    return list;
  };

  // Populate exclusively from Backend API merchants when available
  const baseList = apiMerchants.length > 0 ? filteredEstablishments : [...filteredFeaturedAds, ...filteredEstablishments];
  const combinedEstablishmentsList = isWishlistActive
    ? baseList.filter((m) => userFavorites.includes(m.id))
    : baseList;
  const sortedEstablishments = sortItems(combinedEstablishmentsList);

  // Dedicated list for the standalone Wishlist page
  const favoriteMerchantsList = React.useMemo(() => {
    const all = apiMerchants.length > 0 ? apiMerchants : [...initialEstablishments, ...featuredAdsList];
    return all.filter((m) => userFavorites.includes(m.id));
  }, [apiMerchants, userFavorites]);

  const [establishmentPage, setEstablishmentPage] = useState(1);
  const itemsPerPage = 20;
  const totalEstablishmentPages = Math.ceil(sortedEstablishments.length / itemsPerPage);
  const paginatedEstablishments = sortedEstablishments.slice(
    (establishmentPage - 1) * itemsPerPage,
    establishmentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setEstablishmentPage(1);
  }, [selectedCategory, selectedDistrict, selectedLocation, searchQuery, sortBy]);

  const handleSelectPlace = (placeObj) => {
    const nameStr = typeof placeObj === 'string' ? placeObj : placeObj?.name || '';
    const foundDistrict = placesList.find(
      (p) => p.name.toLowerCase() === nameStr.toLowerCase() || p.id === nameStr.toLowerCase()
    );
    if (foundDistrict) {
      setSelectedDistrict(foundDistrict.id);
      setSelectedLocation('all');
    } else {
      setSelectedLocation(nameStr.toLowerCase());
    }
  };

  const handleCardDirections = (m) => {
    if (!m) return;
    const lat = m.latitude || m.lat;
    const lng = m.longitude || m.lng || m.lon;
    const name = m.business_name || m.name || 'Merchant';
    const address = m.address || m.location || m.city || 'Kerala';

    let url = '';
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}, Kerala`)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCardCall = (phone, merchantObj) => {
    const rawNum = phone || merchantObj?.phone || merchantObj?.phone_number || merchantObj?.contact_number || '';
    const cleanNum = String(rawNum).replace(/[^0-9+]/g, '');

    // Open Zeashell call/whatsapp dialog so user has complete visual choices on Desktop & Mobile
    setCallDialogData({
      merchant: merchantObj || { name: 'Verified Merchant', phone: cleanNum },
      phoneNumber: cleanNum,
    });

    // On mobile devices, also trigger native phone dialer directly
    if (cleanNum && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      window.open(`tel:${cleanNum}`, '_self');
    }
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="landing-container">
      {/* Intro Loading Animation with Center LOGO, Kerala Pin & Blue/White Aura */}
      <ZeashellIntroSplash minDuration={1800} />

      {/* 1. Exact Zeashell Navbar (Royal Blue Theme) */}
      <ZeashellNavbar
        currentLocationName={
          userLocationLabel
            ? userLocationLabel
            : selectedDistrict !== 'all'
            ? `${getDistrictName(selectedDistrict)}, Kerala`
            : selectedLocation !== 'all'
            ? `${selectedLocation.toUpperCase()}, Kerala`
            : userCoordinates
            ? 'Nearby You (GPS)'
            : 'Kerala'
        }
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onDetectGPS={() => setIsLocationModalOpen(true)}
        isDetectingGPS={isLocating}
        onSelectTownOrDistrict={(type, val) => {
          setUserLocationLabel('');
          if (type === 'all' || val === 'Kerala' || val === 'all') {
            setSelectedDistrict('all');
            setSelectedLocation('all');
            setUserCoordinates(null);
            setSortBy('recommended');
            try {
              localStorage.removeItem('zeashell_user_location');
            } catch {}
          } else {
            const cleanVal = String(val || '').toLowerCase();
            const distData = KERALA_DISTRICT_COORDINATES[cleanVal];
            const townData = KERALA_TOWN_COORDINATES[cleanVal];

            if (distData) {
              setSelectedDistrict(cleanVal);
              setSelectedLocation('all');
              setUserCoordinates({ lat: distData.lat, lng: distData.lng });
              setSortBy('nearest');
              try {
                localStorage.setItem('zeashell_user_location', JSON.stringify({
                  type: 'district',
                  district: cleanVal,
                  name: distData.name,
                  lat: distData.lat,
                  lng: distData.lng,
                }));
              } catch {}
            } else if (townData) {
              setSelectedDistrict(townData.district.toLowerCase());
              setSelectedLocation(cleanVal);
              setUserCoordinates({ lat: townData.lat, lng: townData.lng });
              setSortBy('nearest');
              try {
                localStorage.setItem('zeashell_user_location', JSON.stringify({
                  type: 'town',
                  district: townData.district.toLowerCase(),
                  name: townData.name,
                  lat: townData.lat,
                  lng: townData.lng,
                }));
              } catch {}
            } else {
              setSelectedLocation(cleanVal);
            }
          }
          setIsWishlistPageOpen(false);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setShowSuggestions(true);
          setIsWishlistPageOpen(false);
        }}
        onSearchSubmit={(customQuery) => {
          const q = typeof customQuery === 'string' ? customQuery : searchQuery;
          if (typeof customQuery === 'string') {
            setSearchQuery(customQuery);
          }
          setSelectedCategory('all');
          setShowSuggestions(false);
          handleBackendSearch(q);
          setIsWishlistPageOpen(false);
          scrollToSection('establishments-section');
        }}
        searchSuggestions={getSearchSuggestions()}
        onSelectSuggestion={(sug) => {
          handleSelectSuggestion(sug);
          setIsWishlistPageOpen(false);
          scrollToSection('establishments-section');
        }}
        favoritesCount={userFavorites.length}
        onOpenOnboardModal={() => setOnboardModalOpen(true)}
        categories={displayCategories}
        activeCategory={selectedCategory}
        onSelectCategory={(catName) => {
          setSelectedCategory(catName);
          setIsWishlistActive(false);
          setIsWishlistPageOpen(false);
          scrollToSection('establishments-section');
        }}
        onToggleWishlist={() => {
          setIsWishlistPageOpen((prev) => !prev);
        }}
        onOpenWishlistPage={(open) => {
          setIsWishlistPageOpen(open !== undefined ? open : true);
        }}
        isWishlistActive={isWishlistPageOpen}
        customerUser={customerUser}
        onOpenCustomerLogin={() => setCustomerLoginModalOpen(true)}
        onCustomerLogout={handleCustomerLogout}
      />

      {/* DEDICATED WISHLIST VIEW / PAGE (WHEN WISHLIST IS CLICKED) */}
      {isWishlistPageOpen ? (
        <div className="dedicated-wishlist-page">
          <div className="dedicated-wishlist-header">
            <div className="dedicated-wishlist-header-left">
              <button
                type="button"
                className="dedicated-wishlist-back-btn"
                onClick={() => setIsWishlistPageOpen(false)}
              >
                &larr; Back to All Kerala Shops
              </button>
              <h1 className="dedicated-wishlist-title">
                ❤️ My Saved Wishlist ({favoriteMerchantsList.length})
              </h1>
              <p className="dedicated-wishlist-subtitle">
                Your bookmarked verified shops, hotels, and retail services across Kerala
              </p>
            </div>

            {favoriteMerchantsList.length > 0 && (
              <button
                type="button"
                className="dedicated-wishlist-clear-btn"
                onClick={() => {
                  if (window.confirm('Clear all saved shops from your wishlist?')) {
                    setUserFavorites([]);
                    try {
                      localStorage.setItem('logo_user_favs', JSON.stringify([]));
                    } catch {}
                  }
                }}
              >
                Clear Wishlist
              </button>
            )}
          </div>

          {favoriteMerchantsList.length === 0 ? (
            <div className="dedicated-wishlist-empty">
              <div className="dedicated-wishlist-empty-icon">❤️</div>
              <h2>Your Wishlist is Empty</h2>
              <p>
                You haven't bookmarked any shops yet. Browse verified merchants and tap the heart icon on any card to save it here for fast access!
              </p>
              <button
                type="button"
                className="dedicated-wishlist-explore-btn"
                onClick={() => {
                  setIsWishlistPageOpen(false);
                  scrollToSection('establishments-section');
                }}
              >
                Explore Kerala Shops
              </button>
            </div>
          ) : (
            <div className="zeas-blue-merchant-grid" style={{ marginTop: 24 }}>
              {favoriteMerchantsList.map((merchant) => (
                <ZeashellMerchantCard
                  key={merchant.id}
                  merchant={merchant}
                  userCoordinates={userCoordinates}
                  merchantCoords={getMerchantCoords(merchant)}
                  isFavorite={true}
                  onToggleFavorite={handleToggleFavorite}
                  onViewShop={handleSelectMerchantCard}
                  onDirections={handleCardDirections}
                  onCall={handleCardCall}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
      {/* 2. Scrolling Ticker Announcement Bar (Seamless Infinite Loop) */}
      <div className="zeas-ticker-bar" aria-label="Live Announcements">
        <div className="zeas-ticker-track">
          <div className="zeas-ticker-items">
            {displayTickerTexts.concat(displayTickerTexts).map((ticker, idx) => (
              <span key={`t1-${ticker.id || idx}-${idx}`} className="zeas-ticker-item">
                <span>{ticker.title || ticker.description}</span>
                <span className="zeas-ticker-bullet">&bull;</span>
              </span>
            ))}
          </div>
          <div className="zeas-ticker-items" aria-hidden="true">
            {displayTickerTexts.concat(displayTickerTexts).map((ticker, idx) => (
              <span key={`t2-${ticker.id || idx}-${idx}`} className="zeas-ticker-item">
                <span>{ticker.title || ticker.description}</span>
                <span className="zeas-ticker-bullet">&bull;</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Full-Width Advertisement Banner Slider (Zeashell Style - Uncropped Full View) */}
      <ZeashellBannerSlider
        banners={displayTopBanners}
        onBannerClick={(banner) => setSelectedPromoModal(banner)}
      />

      {/* 4. Popular Categories in Kerala (Zeashell OLX Style Grid) */}
      <ZeashellCategoryRow
        categories={displayCategories}
        allCategories={apiCategories}
        activeCategory={selectedCategory}
        onSelectCategory={(catName) => {
          setSelectedCategory(catName);
          scrollToSection('establishments-section');
        }}
      />

      {/* 5. Filter & Search Section (Zeashell Style Pill Box) */}
      <section id="categories-section" className="zeas-blue-filter-container">
        <div className="zeas-blue-search-pill-box">
          <div className="zeas-blue-search-input-group">
            <HiSearch size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Search 1,000+ shops, services, or locations in Kerala..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                aria-label="Clear search"
              >
                <HiX size={18} />
              </button>
            )}

            {/* Live Auto-Fill Suggestions Dropdown */}
            {showSuggestions && searchQuery.trim().length > 0 && (
              <div className="autofill-suggestions-dropdown">
                {getSearchSuggestions().length === 0 ? (
                  <div className="suggestion-item empty">
                    <span>No matching establishments or locations</span>
                  </div>
                ) : (
                  getSearchSuggestions().map((sug, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onMouseDown={() => handleSelectSuggestion(sug)}
                    >
                      <span className="suggestion-icon">
                        {sug.type === 'location' ? '📍' : sug.type === 'category' ? '🏷️' : '🏪'}
                      </span>
                      <div className="suggestion-info">
                        <strong className="suggestion-title">{sug.text}</strong>
                        <span className="suggestion-sub">{sug.category} • {sug.location}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="zeas-blue-filter-select-group">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedLocation('all');
              }}
              className="zeas-blue-filter-select"
            >
              <option value="all">All Districts (Kerala)</option>
              {placesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="zeas-blue-filter-select-group">
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
              }}
              className="zeas-blue-filter-select"
            >
              <option value="all">
                {selectedDistrict === 'all'
                  ? 'All Towns (Kerala)'
                  : `All Towns in ${getDistrictName(selectedDistrict)}`}
              </option>
              {getAvailableLocations().map((loc) => (
                <option key={loc} value={loc.toLowerCase()}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {(selectedDistrict !== 'all' || selectedLocation !== 'all' || selectedCategory !== 'all' || searchQuery.trim() !== '') && (
          <div className="active-filters-chips-bar" style={{ marginTop: 12 }}>
            <span className="chips-title">Active Filters:</span>
            {selectedDistrict !== 'all' && (
              <button
                className="filter-chip"
                onClick={() => {
                  setSelectedDistrict('all');
                  setSelectedLocation('all');
                }}
                title="Remove district filter"
              >
                🏛️ District: {getDistrictName(selectedDistrict).toUpperCase()} <HiX />
              </button>
            )}
            {selectedLocation !== 'all' && (
              <button
                className="filter-chip"
                onClick={() => setSelectedLocation('all')}
                title="Remove location filter"
              >
                📍 Location: {selectedLocation.toUpperCase()} <HiX />
              </button>
            )}
            {selectedCategory !== 'all' && (
              <button
                className="filter-chip"
                onClick={() => setSelectedCategory('all')}
                title="Remove category filter"
              >
                🏷️ Category: {selectedCategory.toUpperCase()} <HiX />
              </button>
            )}
            {searchQuery.trim() !== '' && (
              <button
                className="filter-chip"
                onClick={() => setSearchQuery('')}
                title="Remove search query"
              >
                🔍 Search: "{searchQuery}" <HiX />
              </button>
            )}

            <button className="clear-all-chips-btn" onClick={resetAllFilters}>
              Reset All
            </button>
          </div>
        )}
      </section>

      {/* 6. Nearby Shops Section (Zeashell Style Cards with Real GPS Proximity) */}
      <section id="establishments-section" className="zeas-blue-merchants-section">
        <div className="zeas-blue-merchants-header">
          <div>
            <h2 className="zeas-blue-merchants-title">
              {searchQuery.trim()
                ? `Results for "${searchQuery}"`
                : isWishlistActive
                ? `❤️ Saved Wishlist (${sortedEstablishments.length})`
                : selectedDistrict !== 'all'
                ? `Shops in ${getDistrictName(selectedDistrict)}`
                : selectedLocation !== 'all'
                ? `Shops in ${selectedLocation.toUpperCase()}`
                : userCoordinates
                ? 'Shops near you'
                : 'Fresh Recommendations'}
            </h2>
            <p className="zeas-blue-merchants-subtitle">
              {searchQuery.trim() ? (
                <span>
                  {searchIntent?.hasCorrection && (
                    <span style={{ color: '#2563eb', fontWeight: 600, display: 'inline-block', marginRight: 6 }}>
                      🎯 {searchIntent.typoCorrections.length > 0 ? `Matched ${searchIntent.typoCorrections.join(', ')}` : ''}
                      {searchIntent.detectedCategory ? ` • ${searchIntent.detectedCategory}` : ''}
                      {searchIntent.detectedLocation ? ` • ${searchIntent.detectedLocation}` : ''}
                      {' • '}
                    </span>
                  )}
                  {sortedEstablishments.length} verified shops found in Kerala
                </span>
              ) : isWishlistActive ? (
                `${sortedEstablishments.length} saved shops bookmarked by you`
              ) : (
                `${sortedEstablishments.length} verified shops found${userCoordinates ? ' • Nearest to you first' : ' in Kerala'}`
              )}
            </p>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn btn-sm btn-outline"
                style={{ marginTop: 8, fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
              >
                ✕ Clear Search
              </button>
            )}
            {isWishlistActive && (
              <button
                type="button"
                onClick={() => setIsWishlistActive(false)}
                className="btn btn-sm btn-outline"
                style={{ marginTop: 8, fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
              >
                &larr; View All Verified Shops
              </button>
            )}
          </div>

          <div className="zeas-blue-sort-wrap">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="zeas-blue-sort-select"
            >
              <option value="recommended">Recommended</option>
              <option value="nearest">Nearest (GPS Distance)</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {isLoadingMerchants ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#2563eb' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Loading genuine shops from database...</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Accessing 1,034 verified merchants in Kerala</div>
          </div>
        ) : sortedEstablishments.length === 0 ? (
          <div>
            {selectedDistrict !== 'all' || selectedLocation !== 'all' ? (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: 16,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: 22,
                        flexShrink: 0,
                      }}
                    >
                      🏛️
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1e40af' }}>
                        Showing Verified Kerala Merchants for{' '}
                        {selectedDistrict !== 'all'
                          ? `${getDistrictName(selectedDistrict)} District`
                          : selectedLocation.toUpperCase()}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: '#2563eb', fontWeight: 500 }}>
                        Local merchants are currently being onboarded in this area. Explore genuine verified shops in Kerala below!
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDistrict('all');
                        setSelectedLocation('all');
                      }}
                      className="btn"
                      style={{
                        background: '#ffffff',
                        color: '#1e40af',
                        border: '1.5px solid #bfdbfe',
                        padding: '9px 16px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      View All Kerala
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerAuthTab('register');
                        if (selectedDistrict !== 'all') {
                          setCustomerRegisterForm((prev) => ({
                            ...prev,
                            district: getDistrictName(selectedDistrict),
                          }));
                        }
                        setCustomerLoginModalOpen(true);
                      }}
                      className="btn"
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '9px 16px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      Register as Customer / Merchant
                    </button>
                  </div>
                </div>

                <div className="zeas-blue-merchant-grid" style={{ marginTop: 24 }}>
                  {(sourceEstablishments.length > 0 ? sourceEstablishments : initialEstablishments)
                    .slice(0, 10)
                    .map((merchant) => (
                      <ZeashellMerchantCard
                        key={merchant.id}
                        merchant={merchant}
                        userCoordinates={userCoordinates}
                        merchantCoords={getMerchantCoords(merchant)}
                        isFavorite={userFavorites.includes(merchant.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onViewShop={handleSelectMerchantCard}
                        onDirections={handleCardDirections}
                        onCall={handleCardCall}
                      />
                    ))}
                </div>
              </div>
            ) : (
              <div className="landing-empty-state">
                <HiInformationCircle className="empty-icon" />
                <h3>No establishments found</h3>
                <p>Try searching for a different term or select "All Locations".</p>
                <button
                  onClick={resetAllFilters}
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="zeas-blue-merchant-grid">
              {paginatedEstablishments.slice(0, 15).map((merchant) => (
                <ZeashellMerchantCard
                  key={merchant.id}
                  merchant={merchant}
                  userCoordinates={userCoordinates}
                  merchantCoords={getMerchantCoords(merchant)}
                  isFavorite={userFavorites.includes(merchant.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onViewShop={handleSelectMerchantCard}
                  onDirections={handleCardDirections}
                  onCall={handleCardCall}
                />
              ))}

              {/* Middle In-Between Auto-Sliding Advertisement Banner (Placed after 3 rows = 15 cards) */}
              {displayMiddleBanners.length > 0 && paginatedEstablishments.length > 5 && (
                <ZeashellMiddleBannerSlider
                  banners={displayMiddleBanners}
                  onBannerClick={(b) => setSelectedPromoModal(b)}
                />
              )}

              {paginatedEstablishments.slice(15).map((merchant) => (
                <ZeashellMerchantCard
                  key={merchant.id}
                  merchant={merchant}
                  userCoordinates={userCoordinates}
                  merchantCoords={getMerchantCoords(merchant)}
                  isFavorite={userFavorites.includes(merchant.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onViewShop={handleSelectMerchantCard}
                  onDirections={handleCardDirections}
                  onCall={handleCardCall}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalEstablishmentPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '36px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  disabled={establishmentPage === 1}
                  onClick={() => {
                    setEstablishmentPage((prev) => Math.max(prev - 1, 1));
                    scrollToSection('establishments-section');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: establishmentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: establishmentPage === 1 ? 0.5 : 1,
                  }}
                >
                  &lt; Prev
                </button>

                {Array.from({ length: totalEstablishmentPages }, (_, idx) => idx + 1)
                  .filter((p) => p === 1 || p === totalEstablishmentPages || Math.abs(p - establishmentPage) <= 2)
                  .map((pNum, index, array) => {
                    const showEllipsisBefore = index > 0 && pNum - array[index - 1] > 1;
                    return (
                      <React.Fragment key={pNum}>
                        {showEllipsisBefore && (
                          <span style={{ color: '#94A3B8', fontSize: '14px', fontWeight: '700', padding: '0 4px' }}>
                            ...
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEstablishmentPage(pNum);
                            scrollToSection('establishments-section');
                          }}
                          style={{
                            minWidth: '38px',
                            height: '38px',
                            padding: '0 10px',
                            borderRadius: '8px',
                            border: establishmentPage === pNum ? '2px solid #2563eb' : '1px solid #e2e8f0',
                            background: establishmentPage === pNum ? '#2563eb' : '#ffffff',
                            color: establishmentPage === pNum ? '#ffffff' : '#334155',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {pNum}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  disabled={establishmentPage === totalEstablishmentPages}
                  onClick={() => {
                    setEstablishmentPage((prev) => Math.min(prev + 1, totalEstablishmentPages));
                    scrollToSection('establishments-section');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: establishmentPage === totalEstablishmentPages ? 'not-allowed' : 'pointer',
                    opacity: establishmentPage === totalEstablishmentPages ? 0.5 : 1,
                  }}
                >
                  Next &gt;
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 7. 🔥 Featured Offers Carousel (Zeashell Style - Dynamic from Database) */}
      <ZeashellOffersCarousel
        offers={displayFeaturedOffers}
        onSelectOffer={(offer) => setSelectedPromoModal(offer)}
      />

      {/* 6. News & Updates Section (Ultra-Sharp High-Clarity UI) */}
      <section className="landing-news-section">
        <div className="landing-news-header">
          <div className="news-badge-pill">📢 LOGO BUSINESS NETWORK</div>
          <h2 className="news-title">News & Updates</h2>
          <p className="news-subtitle">Grow Your Business With Kerala's Fastest Growing Local Directory</p>
        </div>

        <div className="news-grid">
          {/* Card 1 */}
          <div className="news-card card-royal">
            <div className="news-card-top-row">
              <span className="news-card-badge">JOIN US</span>
              <span className="news-card-badge-sub">STANDARD LISTING</span>
            </div>
            <div className="news-card-content">
              <h3>My Locality Info</h3>
              <p className="news-malayalam">Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ</p>
              <h4>ലോകമറിയട്ടെ നിങ്ങളുടെ</h4>
              <h2 className="news-highlight">BUSINESS & OFFERS</h2>

              <ul className="news-features">
                <li><HiCheckCircle className="feat-check" /> Multi Photos & Store Details</li>
                <li><HiCheckCircle className="feat-check" /> Address & Exact GPS Location</li>
                <li><HiCheckCircle className="feat-check" /> Direct Calling & One-Tap WhatsApp</li>
                <li><HiCheckCircle className="feat-check" /> Social Page Sharing & Distance</li>
              </ul>
            </div>

            <div className="news-card-footer">
              <div className="discount-tag">
                <span>Special Launch Offer</span>
                <strong>50% OFF</strong>
              </div>
              <button
                type="button"
                className="news-join-btn"
                onClick={() => setOnboardModalOpen(true)}
              >
                List Business
              </button>
            </div>
            <div className="news-contact">
              <a href="tel:+918606080074">📞 Mob: +91 860 60 800 74</a>
            </div>
          </div>

          {/* Card 2 */}
          <div className="news-card card-black">
            <div className="news-card-top-row">
              <span className="news-card-badge dark">⭐ PREMIUM SUBSCRIPTION</span>
              <span className="news-card-badge-sub emerald">TOP RANKING</span>
            </div>
            <div className="news-card-content">
              <h3>My Locality Info</h3>
              <p className="news-malayalam">Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ</p>
              <h4>ലോകമറിയട്ടെ നിങ്ങളുടെ</h4>
              <h2 className="news-highlight yellow">BUSINESS & OFFERS</h2>

              <ul className="news-features">
                <li><HiCheckCircle className="feat-check gold" /> E-Commerce Portal Access</li>
                <li><HiCheckCircle className="feat-check gold" /> Video Reels & HD Image Gallery</li>
                <li><HiCheckCircle className="feat-check gold" /> Flash Offers & Distance Filter</li>
                <li><HiCheckCircle className="feat-check gold" /> Customer Analytics & Direct Leads</li>
              </ul>
            </div>

            <div className="news-card-footer">
              <div className="discount-tag tag-green">
                <span>Annual Plan Savings</span>
                <strong>50% OFF</strong>
              </div>
              <button
                type="button"
                className="news-join-btn gold"
                onClick={() => setOnboardModalOpen(true)}
              >
                Get Premium
              </button>
            </div>
            <div className="news-contact">
              <a href="tel:+918606080074">📞 Mob: +91 860 60 800 74</a>
            </div>
          </div>

          {/* Card 3 */}
          <div className="news-card card-crimson">
            <div className="news-card-top-row">
              <span className="news-card-badge">🔥 SPECIAL OFFER</span>
              <span className="news-card-badge-sub rose">FESTIVAL PROMO</span>
            </div>
            <div className="news-card-content">
              <h3>My Locality Info</h3>
              <p className="news-malayalam">Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ</p>
              <h4>ലോകമറിയട്ടെ നിങ്ങളുടെ</h4>
              <h2 className="news-highlight pink">BUSINESS & OFFERS</h2>

              <ul className="news-features">
                <li><HiCheckCircle className="feat-check pink" /> Verified Blue Tick Merchant Badge</li>
                <li><HiCheckCircle className="feat-check pink" /> Boosted Top 3 Search Ranking</li>
                <li><HiCheckCircle className="feat-check pink" /> WhatsApp Catalog & Direct Orders</li>
                <li><HiCheckCircle className="feat-check pink" /> Dedicated Account Manager & Support</li>
              </ul>
            </div>

            <div className="news-card-footer">
              <div className="discount-tag tag-purple">
                <span>Festival Promotion</span>
                <strong>50% OFF</strong>
              </div>
              <button
                type="button"
                className="news-join-btn rose"
                onClick={() => setOnboardModalOpen(true)}
              >
                Claim Offer
              </button>
            </div>
            <div className="news-contact">
              <a href="tel:+918606080074">📞 Mob: +91 860 60 800 74</a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Kerala Discovery & Video Showcase (Envato Elements style split layout with seamless video shade) */}
      <ZeashellEnvatoShowcase
        slides={displayBottomShowcase}
        onCtaClick={() => {
          scrollToSection('establishments-section');
        }}
        onTagClick={(tag) => {
          const clean = tag.replace(/^[^\w\s]+/, '').trim();
          setSearchQuery(clean);
          scrollToSection('establishments-section');
        }}
      />

      {/* 7.5. Inspiring Kerala Community Quote Section (White Background with Serif Editorial Font) */}
      <section className="landing-prefooter-quote-section" aria-label="Kerala Community Quote">
        <div className="prefooter-quote-container">
          <div className="prefooter-quote-mark" aria-hidden="true">“</div>
          <blockquote className="prefooter-quote-text">
            “Connecting neighborhoods, empowering local merchants, and celebrating the authentic spirit of Kerala.”
          </blockquote>
          <div className="prefooter-quote-divider" />
          <div className="prefooter-quote-author-wrap">
            <span className="prefooter-quote-author">LOGO KERALA</span>
            <span className="prefooter-quote-tagline">Hyperlocal Discovery & Verified Merchant Network Across 14 Districts</span>
          </div>
        </div>
      </section>


      {/* 8. Modern Full Width Blue/Navy Footer */}
      <footer id="contact-section" className="landing-full-footer">
        <div className="full-footer-inner">
          {/* Col 1: Logo & App summary */}
          <div className="full-footer-brand">
            <div className="full-brand-header">
              <div className="full-brand-icon">
                <HiLocationMarker />
              </div>
              <span className="full-brand-name">Logo Kerala</span>
            </div>
            <p className="full-brand-desc">
              Kerala's premier hyperlocal directory. Discover verified neighborhood shops, restaurants, boutiques,
              healthcare, and artisan services across all 14 districts with instant WhatsApp & GPS directions.
            </p>
            <div className="footer-verified-badge">
              <HiShieldCheck size={18} color="#22c55e" />
              <span>100% Verified Kerala Merchants</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="full-footer-col">
            <h4 className="footer-col-title">Quick Explore</h4>
            <ul className="footer-links-list">
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => {
                    setSelectedDistrict('all');
                    setSelectedLocation('all');
                    scrollToSection('establishments-section');
                  }}
                >
                  📍 All 14 Kerala Districts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => scrollToSection('categories-section')}
                >
                  🏷️ Popular Categories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => scrollToSection('featured-section')}
                >
                  🔥 Trending Offers & Deals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => setIsWishlistPageOpen(true)}
                >
                  ❤️ My Saved Wishlist ({userFavorites.length})
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => setCustomerLoginModalOpen(true)}
                >
                  👤 User Account / Sign In
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: For Businesses */}
          <div className="full-footer-col">
            <h4 className="footer-col-title">For Businesses</h4>
            <ul className="footer-links-list">
              <li>
                <button
                  type="button"
                  className="footer-link-btn highlight-gold"
                  onClick={() => setOnboardModalOpen(true)}
                >
                  ✨ Register Shop (50% OFF)
                </button>
              </li>
              <li>
                <Link to="/admin" className="footer-link-btn">
                  🔐 Admin & Merchant Portal
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => setOnboardModalOpen(true)}
                >
                  📢 Advertise Your Brand
                </button>
              </li>
              <li>
                <a href="tel:+918606080074" className="footer-link-btn">
                  📞 Merchant Helpline: 860 60 800 74
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Corporate Office & Contact */}
          <div className="full-footer-col">
            <h4 className="footer-col-title">Corporate Office</h4>
            <div className="footer-address-block">
              <p className="footer-company-name">AURUMFX PVT LTD</p>
              <p>V/664, 1st Floor, Antony Master Square,</p>
              <p>Kunnathangadi, Thrissur, Kerala - 680 012</p>
              <div className="full-contact-row">
                <HiMail /> <a href="mailto:info@aurumfx.net">info@aurumfx.net</a>
              </div>
              <div className="full-contact-row">
                <HiPhone /> <a href="tel:+917510214060">+91 75102 14060 / 14080</a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="social-icons-row" style={{ marginTop: 14 }}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-icon" aria-label="YouTube">
                <FaYoutube />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon" aria-label="Twitter">
                <FaTwitter />
              </a>
            </div>

            {/* Store Badges */}
            <div className="footer-store-badges" style={{ marginTop: 14 }}>
              <a href="https://play.google.com/store" target="_blank" rel="noreferrer" className="full-store-badge">
                <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor">
                  <path d="M325.8 256L80.4 10.6c-4.8 4.7-7.8 11.2-7.8 18.5v453.8c0 7.3 3 13.8 7.8 18.5L325.8 256zM365.2 295.4l55.1-31.8c12.2-7.1 12.2-25.7 0-32.8l-55.1-31.8-49.3 49.3 49.3 49.3zM99.6 498.4l238.4-238.4-49.3-49.3L80.4 419.1c4.5 4.5 11 7.3 19.2 7.3zM99.6 13.6c-8.2 0-14.7 2.8-19.2 7.3l208.3 208.3 49.3-49.3L99.6 13.6z" />
                </svg>
                <div className="badge-txt">
                  <span className="sm">GET IT ON</span>
                  <span className="lg">Google Play</span>
                </div>
              </a>

              <a href="https://apple.com/app-store" target="_blank" rel="noreferrer" className="full-store-badge">
                <svg viewBox="0 0 384 512" width="14" height="14" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 66.7 31.9 114.7c15.4 22.8 34.6 48.2 59 47.4 23.4-.9 32.5-15 60.7-15 28.1 0 36.3 15 60.7 14.1 25-.9 41.6-22.8 56.9-45.6 17.8-25.9 25.1-51.1 25.5-52.4-1.2-.4-49-18.8-50-68zM242 108.9c16.2-19.7 27.2-47.1 24.2-74.5-23.4 1-51.8 15.6-68.4 35.1-14.8 17.3-27.8 45.1-24.3 71.8 26.1 2 52.3-12.8 68.5-32.4z" />
                </svg>
                <div className="badge-txt">
                  <span className="sm">Download on</span>
                  <span className="lg">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="full-footer-bottom">
          <div className="footer-bottom-inner">
            <span>© COPYRIGHT {new Date().getFullYear()} | AURUMFX PVT LTD | ALL RIGHTS RESERVED</span>
            <div className="footer-bottom-legal">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-legal-policy', { detail: { policy: 'privacy' } }))}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                title="View Privacy Policy"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-legal-policy', { detail: { policy: 'terms' } }))}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                title="View Terms & Conditions"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-legal-policy', { detail: { policy: 'terms' } }))}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                title="View Merchant Guidelines"
              >
                Merchant Guidelines
              </button>
            </div>
          </div>
        </div>
      </footer>
      </>
      )}

      {/* 9. Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="landing-scroll-top-btn"
          aria-label="Scroll to Top"
        >
          <HiArrowUp />
        </button>
      )}

      {/* 10. Zeashell Shop Details Fullscreen Modal */}
      {selectedMerchant && (
        <ZeashellShopModal
          merchant={selectedMerchant}
          onClose={() => {
            setSelectedMerchant(null);
            if (window.location.pathname.startsWith('/merchant/')) {
              try {
                window.history.pushState(null, '', '/');
              } catch (e) {}
            }
          }}
          userCoordinates={userCoordinates}
          currentLocationName={
            userLocationLabel
              ? userLocationLabel
              : selectedDistrict !== 'all'
              ? `${getDistrictName(selectedDistrict)}, Kerala`
              : selectedLocation !== 'all'
              ? `${selectedLocation.toUpperCase()}, Kerala`
              : userCoordinates
              ? 'Nearby You (GPS)'
              : 'Kerala'
          }
          onOpenLocationModal={() => {
            setSelectedMerchant(null);
            setIsLocationModalOpen(true);
          }}
          onDetectGPS={() => {
            setSelectedMerchant(null);
            setIsLocationModalOpen(true);
          }}
          onSelectTownOrDistrict={(type, val) => {
            setSelectedMerchant(null);
            handleSelectPlace(val);
          }}
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          onSearchSubmit={(q) => {
            setSelectedMerchant(null);
            const val = q || searchQuery;
            setSearchQuery(val);
            handleBackendSearch(val);
            scrollToSection('establishments-section');
          }}
          categories={displayCategories}
          activeCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedMerchant(null);
            setSelectedCategory(cat);
            scrollToSection('establishments-section');
          }}
          customerUser={customerUser}
          onOpenCustomerLogin={() => setCustomerLoginModalOpen(true)}
          onCustomerLogout={handleCustomerLogout}
          onOpenOnboardModal={() => setOnboardModalOpen(true)}
          favoritesCount={userFavorites.length}
          onOpenWishlistPage={() => {
            setSelectedMerchant(null);
            setIsWishlistPageOpen(true);
          }}
        />
      )}

      {/* 11. Zeashell Quick Call / WhatsApp Dialog */}
      {callDialogData && (
        <ZeashellCallDialog
          isOpen={!!callDialogData}
          onClose={() => setCallDialogData(null)}
          merchant={callDialogData.merchant}
          phoneNumber={callDialogData.phoneNumber}
        />
      )}

      {/* 11. CREATE / ONBOARD MERCHANT MODAL ON LANDING PAGE */}
      {onboardModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setOnboardModalOpen(false)}
        >
          <div
            className="modal-container merchant-detail-modal"
            style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: '#FFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#10B981', padding: 8, borderRadius: 8, color: '#FFF', display: 'flex' }}>
                  <HiPlus style={{ fontSize: 20 }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#FFF', fontSize: 18 }}>Onboard New Merchant</h3>
                  <p style={{ margin: 0, color: '#94A3B8', fontSize: 12 }}>Register & list a business directly to backend API</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                style={{ color: '#94A3B8' }}
                onClick={() => setOnboardModalOpen(false)}
              >
                <HiX />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {onboardError && (
                  <div style={{ padding: '10px 14px', background: '#FEE2E2', borderLeft: '4px solid #EF4444', color: '#B91C1C', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                    ⚠️ {onboardError}
                  </div>
                )}
                {onboardSuccess && (
                  <div style={{ padding: '10px 14px', background: '#D1FAE5', borderLeft: '4px solid #10B981', color: '#047857', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                    ✅ {onboardSuccess}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Store Name"
                      value={onboardForm.business_name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, business_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Owner Name"
                      value={onboardForm.owner_name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, owner_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Category *
                    </label>
                    <select
                      value={onboardForm.category}
                      onChange={(e) => setOnboardForm({ ...onboardForm, category: e.target.value, categories: [e.target.value], services: [e.target.value] })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, background: '#FFF' }}
                    >
                      {categoryOptionsList.map((catName, idx) => (
                        <option key={idx} value={catName}>{catName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      User Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FLS_1"
                      value={onboardForm.user_code}
                      onChange={(e) => setOnboardForm({ ...onboardForm, user_code: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98470 12345"
                      value={onboardForm.phone_number}
                      onChange={(e) => setOnboardForm({ ...onboardForm, phone_number: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="store@gmail.com"
                      value={onboardForm.email}
                      onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kannur"
                      value={onboardForm.district}
                      onChange={(e) => setOnboardForm({ ...onboardForm, district: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Payyanur"
                      value={onboardForm.city}
                      onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Road"
                      value={onboardForm.address}
                      onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Bus Stand"
                      value={onboardForm.landmark}
                      onChange={(e) => setOnboardForm({ ...onboardForm, landmark: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Service Timing
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00 AM - 09:00 PM"
                      value={onboardForm.service_timing}
                      onChange={(e) => setOnboardForm({ ...onboardForm, service_timing: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                      Status
                    </label>
                    <select
                      value={onboardForm.status}
                      onChange={(e) => setOnboardForm({ ...onboardForm, status: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, background: '#FFF' }}
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="ACTIVE">ACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* MEDIA UPLOAD SECTION (POST /api/v1/merchants/upload-media) */}
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px dashed #CBD5E1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    📸 Merchant Media Upload (Photos & Videos)
                  </label>
                  <p style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>
                    Upload photos/videos directly via <code>POST /api/v1/merchants/upload-media</code>
                  </p>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <label
                      style={{
                        padding: '8px 14px',
                        background: '#3B82F6',
                        color: '#FFF',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: uploadingMedia ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <HiPhotograph /> {uploadingMedia ? 'Uploading...' : 'Upload Photos'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingMedia}
                        style={{ display: 'none' }}
                        onChange={(e) => handleMediaUpload(e, 'photos')}
                      />
                    </label>

                    <label
                      style={{
                        padding: '8px 14px',
                        background: '#8B5CF6',
                        color: '#FFF',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: uploadingMedia ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <HiVideoCamera /> {uploadingMedia ? 'Uploading...' : 'Upload Videos'}
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        disabled={uploadingMedia}
                        style={{ display: 'none' }}
                        onChange={(e) => handleMediaUpload(e, 'videos')}
                      />
                    </label>
                  </div>

                  {/* Uploaded Photos Preview */}
                  {onboardForm.merchant_photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {onboardForm.merchant_photos.map((url, i) => (
                        <div key={i} style={{ position: 'relative', width: 60, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                          <img src={url} alt={`Photo ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', padding: '12px 20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOnboardModalOpen(false)}
                  disabled={onboardLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={onboardLoading || uploadingMedia}
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', fontWeight: 700 }}
                >
                  {onboardLoading ? 'Onboarding Merchant...' : 'Onboard Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Promotion Modal Overlay (Clean White Theme with Black Text) */}
      {selectedPromoModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedPromoModal(null)}
        >
          <div
            className="modal-container promo-detail-modal"
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '24px',
              maxWidth: '580px',
              width: '92%',
              padding: '32px 36px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setSelectedPromoModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.2s ease',
              }}
              aria-label="Close Modal"
            >
              <HiX />
            </button>

            {selectedPromoModal.badge && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  background: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.8px',
                  marginBottom: '16px',
                  color: '#1D4ED8',
                  textTransform: 'uppercase',
                }}
              >
                <HiStar style={{ color: '#EAB308' }} /> {selectedPromoModal.badge}
              </div>
            )}

            <h2
              style={{
                fontSize: '28px',
                fontWeight: '800',
                margin: '0 0 6px 0',
                color: '#0F172A',
                letterSpacing: '-0.5px',
                lineHeight: '1.25',
              }}
            >
              {selectedPromoModal.title}
            </h2>

            {selectedPromoModal.subtitle && (
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#2563EB',
                  marginBottom: '12px',
                }}
              >
                {selectedPromoModal.subtitle}
              </h4>
            )}

            {selectedPromoModal.description && (
              <p
                style={{
                  fontSize: '14.5px',
                  color: '#334155',
                  lineHeight: '1.65',
                  marginBottom: '20px',
                }}
              >
                {selectedPromoModal.description}
              </p>
            )}

            {selectedPromoModal.bannerUrl && (
              <div
                style={{
                  width: '100%',
                  maxHeight: '220px',
                  overflow: 'hidden',
                  borderRadius: '16px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E2E8F0',
                }}
              >
                <img
                  src={selectedPromoModal.bannerUrl}
                  alt={selectedPromoModal.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            <div
              style={{
                borderTop: '1px solid #E2E8F0',
                paddingTop: '18px',
                marginTop: '12px',
              }}
            >
              {selectedPromoModal.tagline && (
                <div
                  style={{
                    color: '#0369A1',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#F0F9FF',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD',
                    marginBottom: '14px',
                  }}
                >
                  ⭐ {selectedPromoModal.tagline}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selectedPromoModal.location && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#F8FAFC',
                      padding: '7px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1E293B',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <HiLocationMarker style={{ color: '#2563EB' }} />
                    {selectedPromoModal.location}
                  </span>
                )}
                {selectedPromoModal.phone && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#F8FAFC',
                      padding: '7px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1E293B',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <HiPhone style={{ color: '#16A34A' }} />
                    {selectedPromoModal.phone}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <button
                className="btn"
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  padding: '9px 20px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background 0.2s ease',
                }}
                onClick={() => setSelectedPromoModal(null)}
              >
                Close
              </button>
              {selectedPromoModal.phone ? (
                <a
                  href={`tel:${selectedPromoModal.phone}`}
                  className="btn"
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    padding: '9px 22px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <HiPhone /> Call Merchant
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {/* Floating Zeashell Special Offer Button & Popup Widget */}
      <ZeashellSpecialOfferWidget
        offers={displaySpecialOffers}
        onViewOffer={(offer) => setSelectedPromoModal(offer)}
        onCallMerchant={handleCardCall}
        onExploreAll={() => scrollToSection('featured-offers-section')}
      />

      {/* 13. Customer Sign In & Registration Modal (Centered Popup with Login & Register Tabs) */}
      {customerLoginModalOpen && (
        <div
          className="modal-backdrop customer-auth-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setCustomerLoginModalOpen(false)}
        >
          <div
            className="customer-auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="customer-auth-header">
              <div className="customer-auth-header-top">
                <div className="customer-auth-brand">
                  <span className="customer-auth-brand-logo" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    LOGO <HiLocationMarker size={16} color="#93c5fd" />
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: 'rgba(255, 255, 255, 0.25)',
                      padding: '2px 8px',
                      borderRadius: 20,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    CUSTOMER PORTAL
                  </span>
                </div>
                <button
                  type="button"
                  className="customer-auth-close-btn"
                  onClick={() => setCustomerLoginModalOpen(false)}
                  aria-label="Close"
                >
                  <HiX size={18} />
                </button>
              </div>

              <h3 className="customer-auth-header-title">
                {customerAuthTab === 'login' ? 'Welcome Back!' : 'Create Customer Account'}
              </h3>
              <p className="customer-auth-header-desc">
                {customerAuthTab === 'login'
                  ? 'Sign in to access your saved wishlist & call verified merchants'
                  : 'Register to discover 1,000+ genuine shops across all 14 Kerala districts'}
              </p>
            </div>

            {/* Mode Switcher Tabs: [Login] vs [Register] */}
            <div className="customer-auth-tabs">
              <button
                type="button"
                className={`customer-auth-tab-btn ${customerAuthTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setCustomerAuthTab('login');
                  setCustomerAuthMsg({ type: '', text: '' });
                }}
              >
                <HiUser size={16} />
                <span>Sign In / Login</span>
              </button>
              <button
                type="button"
                className={`customer-auth-tab-btn ${customerAuthTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setCustomerAuthTab('register');
                  setCustomerAuthMsg({ type: '', text: '' });
                }}
              >
                <HiPlus size={16} />
                <span>Register / Sign Up</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="customer-auth-body">
              {customerAuthMsg.text && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: customerAuthMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: customerAuthMsg.type === 'error' ? '#b91c1c' : '#15803d',
                    borderLeft: `4px solid ${customerAuthMsg.type === 'error' ? '#ef4444' : '#22c55e'}`,
                  }}
                >
                  <span>{customerAuthMsg.type === 'error' ? '⚠️' : '✅'}</span>
                  <span>{customerAuthMsg.text}</span>
                </div>
              )}

              {customerAuthTab === 'login' ? (
                /* LOGIN FORM */
                <form
                  onSubmit={handleCustomerLoginSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div className="customer-auth-field">
                    <label className="customer-auth-label">
                      <span>Mobile / WhatsApp Number *</span>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                        OTP-free 10-digit login
                      </span>
                    </label>
                    <div className="customer-auth-phone-row">
                      <div className="customer-auth-country-code">🇮🇳 +91</div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 9847123456"
                        value={customerLoginForm.phone}
                        onChange={(e) =>
                          setCustomerLoginForm({ phone: e.target.value.replace(/[^0-9]/g, '') })
                        }
                        className="customer-auth-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" className="customer-auth-btn-primary">
                    Sign In to Logo Kerala
                  </button>

                  <div style={{ textAlign: 'center', margin: '4px 0', color: '#94a3b8', fontSize: 12 }}>
                    ── or quick 1-click login ──
                  </div>

                  <button
                    type="button"
                    onClick={handleCustomerQuickLogin}
                    style={{
                      width: '100%',
                      padding: '11px',
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 12,
                      color: '#1e293b',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <span>👤 Quick Login as Saranya Sudheer (Kannur)</span>
                  </button>

                  <div className="customer-auth-switch-prompt">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="customer-auth-switch-link"
                      onClick={() => {
                        setCustomerAuthTab('register');
                        setCustomerAuthMsg({ type: '', text: '' });
                      }}
                    >
                      Register here
                    </button>
                  </div>
                </form>
              ) : (
                /* REGISTER FORM */
                <form
                  onSubmit={handleCustomerRegisterSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div className="customer-auth-field">
                    <label className="customer-auth-label">
                      <span>Full Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Saranya Sudheer"
                      value={customerRegisterForm.name}
                      onChange={(e) =>
                        setCustomerRegisterForm({ ...customerRegisterForm, name: e.target.value })
                      }
                      className="customer-auth-input"
                      autoFocus
                    />
                  </div>

                  <div className="customer-auth-field">
                    <label className="customer-auth-label">
                      <span>Mobile / WhatsApp Number *</span>
                    </label>
                    <div className="customer-auth-phone-row">
                      <div className="customer-auth-country-code">🇮🇳 +91</div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 9847123456"
                        value={customerRegisterForm.phone}
                        onChange={(e) =>
                          setCustomerRegisterForm({
                            ...customerRegisterForm,
                            phone: e.target.value.replace(/[^0-9]/g, ''),
                          })
                        }
                        className="customer-auth-input"
                      />
                    </div>
                  </div>

                  <div className="customer-auth-field">
                    <label className="customer-auth-label">
                      <span>Kerala District *</span>
                      <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                        All 14 Districts
                      </span>
                    </label>
                    <select
                      value={customerRegisterForm.district}
                      onChange={(e) =>
                        setCustomerRegisterForm({
                          ...customerRegisterForm,
                          district: e.target.value,
                        })
                      }
                      className="customer-auth-select"
                    >
                      {placesList.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} District
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="customer-auth-field">
                    <label className="customer-auth-label">
                      <span>City / Town (Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kochi, Payyanur, Alappuzha, etc."
                      value={customerRegisterForm.city}
                      onChange={(e) =>
                        setCustomerRegisterForm({ ...customerRegisterForm, city: e.target.value })
                      }
                      className="customer-auth-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="customer-auth-btn-primary"
                    style={{ marginTop: 4 }}
                  >
                    Create Customer Account & Sign In
                  </button>

                  <div className="customer-auth-switch-prompt">
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="customer-auth-switch-link"
                      onClick={() => {
                        setCustomerAuthTab('login');
                        setCustomerAuthMsg({ type: '', text: '' });
                      }}
                    >
                      Sign in here
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 14. Location Discovery Modal (Prompt on arrival or location click) */}
      <ZeashellLocationPromptModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelected={handleLocationChosen}
        currentLocationName={
          userLocationLabel
            ? userLocationLabel
            : selectedDistrict !== 'all'
            ? `${getDistrictName(selectedDistrict)}, Kerala`
            : selectedLocation !== 'all'
            ? `${selectedLocation.toUpperCase()}, Kerala`
            : userCoordinates
            ? 'Nearby You (GPS)'
            : 'Kerala'
        }
      />
    </div>
  );
}

