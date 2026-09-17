import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  HiInformationCircle,
  HiStar,
  HiQrcode,
} from 'react-icons/hi';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTwitter,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

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
    title: 'BAG BAZAAR PAYYANUR',
    subtitle: 'Top Brands & Huge Discounts',
    description: 'School bags, luggage trolleys, handbags, and travel backpacks. Wholesale & Retail.',
    bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)',
    badge: 'FEATURED STORE',
    location: 'Payyanur',
    phone: '09372 702692',
    accentColor: '#F59E0B',
    tagline: 'Up to 65% OFF | Best Luggage Store in Town',
  },
  {
    id: 2,
    title: 'ONLINE ART CLASSES',
    subtitle: 'Explore Your Creativity in Just 1 Hour a Day!',
    description: 'Open to all ages (Kids & Adults). Flexible schedules, small groups & solo classes.',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    badge: 'EDUCATION',
    location: 'Online / Payyanur',
    phone: '07026 595769',
    accentColor: '#38BDF8',
    tagline: 'By Arthana | Flexible Schedules | Beginner Friendly',
  },
  {
    id: 3,
    title: 'VR HERO MOTORS',
    subtitle: 'Hero Authorized Dealer - 3 Years Free Service',
    description: 'Special offers on Hero scooters & bikes. 5 years warranty, easy financing available.',
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    badge: 'AUTOMOBILE',
    location: 'Peringome, Kannur',
    phone: '04985 219191',
    accentColor: '#EF4444',
    tagline: '0% Down Payment | 5 Years Warranty | Easy Finance',
  },
  {
    id: 4,
    title: 'LIFE MEDICALS & SURGICALS',
    subtitle: 'We Care Your Life - All Medical Supplies',
    description: 'Complete range of medicines, surgical instruments, wellness care, and diagnostic tools.',
    bgGradient: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)',
    badge: 'HEALTHCARE',
    location: 'Manna, Taliparamba',
    phone: '04672 206111',
    accentColor: '#10B981',
    tagline: 'Essential Medicines | Surgical Equipment | 24/7 Service',
  },
  {
    id: 5,
    title: 'GLOBAL SOLAR POWER SOLUTION',
    subtitle: 'KSEB Approved Solar Panel Installations',
    description: 'Reduce your electricity bills with clean solar power. On-grid and off-grid solutions.',
    bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
    badge: 'SOLAR ENERGY',
    location: 'Payyanur - Padanna',
    phone: '08921 669652',
    accentColor: '#3B82F6',
    tagline: 'Govt Subsidy Eligible | Free Site Inspection | Solar Subsidy',
  },
  {
    id: 6,
    title: 'CASTILLO INTERIORS',
    subtitle: 'Modular Kitchen, Gypsum Ceiling, Furniture',
    description: 'Turn your dream home into reality without breaking your budget. 2D & 3D designing.',
    bgGradient: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)',
    badge: 'INTERIORS',
    location: 'Payyanur',
    phone: '09562 753693',
    accentColor: '#8B5CF6',
    tagline: 'Modular Kitchen | Gypsum Ceiling | Wardrobe & TV Units',
  },
];

// Places Data (Matching reference screenshots: place.php)
const placesList = [
  {
    id: 'payyanur',
    name: 'Payyanur',
    count: 245,
    image: 'https://images.unsplash.com/photo-1590059208753-3765e90367f0?w=500&auto=format&fit=crop&q=80',
    description: 'Cultural hub in Kannur known for temples, handlooms, and vibrant local commerce.',
  },
  {
    id: 'taliparamba',
    name: 'Taliparamba',
    count: 180,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    description: 'Historic town with major spice markets, educational institutions, and healthcare centers.',
  },
  {
    id: 'kannur',
    name: 'Kannur',
    count: 310,
    image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=500&auto=format&fit=crop&q=80',
    description: 'Major coastal city famous for beaches, handloom industries, and booming trade.',
  },
  {
    id: 'kanhangad',
    name: 'Kanhangad',
    count: 140,
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=500&auto=format&fit=crop&q=80',
    description: 'Largest commercial town in Kasaragod district with healthcare & retail hubs.',
  },
  {
    id: 'calicut',
    name: 'Calicut',
    count: 420,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
    description: 'Kozhikode city center, renowned for food, shopping malls, and IT parks.',
  },
  {
    id: 'cheemeni',
    name: 'Cheemeni',
    count: 65,
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop&q=80',
    description: 'Growing township in Kasaragod with industrial parks and renewable energy hubs.',
  },
  {
    id: 'thalassery',
    name: 'Thalassery',
    count: 210,
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop&q=80',
    description: 'Heritage town celebrated for bakery culture, circus history, and colonial architecture.',
  },
  {
    id: 'kasaragod',
    name: 'Kasaragod',
    count: 195,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80',
    description: 'Northern border town with fort monuments, river tourism, and cross-cultural trade.',
  },
  {
    id: 'trikaripur',
    name: 'Trikaripur',
    count: 90,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=80',
    description: 'Picturesque coastal locality known for backwaters, boat building, and local markets.',
  },
  {
    id: 'malappuram',
    name: 'Malappuram',
    count: 280,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    description: 'Fast-growing urban area with vibrant commercial centers and educational institutions.',
  },
  {
    id: 'vadakara',
    name: 'Vadakara',
    count: 130,
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=500&auto=format&fit=crop&q=80',
    description: 'Historic martial arts land of Kalaripayattu with bustling coastal trade.',
  },
  {
    id: 'padiyotuchal',
    name: 'Padiyotuchal',
    count: 55,
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop&q=80',
    description: 'Hilly agricultural town with local spice plantations and hardware suppliers.',
  },
  {
    id: 'alakode',
    name: 'Alakode',
    count: 75,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    description: 'Highland township in eastern Kannur, prominent for agriculture and rubber trade.',
  },
  {
    id: 'kankol',
    name: 'Kankol',
    count: 40,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80',
    description: 'Quiet green village near Payyanur with emerging organic markets and local services.',
  },
  {
    id: 'dharmasala',
    name: 'Dharmasala',
    count: 110,
    image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=500&auto=format&fit=crop&q=80',
    description: 'Major educational zone featuring NIFT, engineering colleges, and stadium complex.',
  },
  {
    id: 'cherupuzha',
    name: 'Cherupuzha',
    count: 85,
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=500&auto=format&fit=crop&q=80',
    description: 'Border township between Kannur and Kasaragod, famous for hilly trading markets.',
  },
  {
    id: 'parappanangadi',
    name: 'Parappanangadi',
    count: 95,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80',
    description: 'Coastal railway town in Malappuram with fisheries and traditional handicraft shops.',
  },
  {
    id: 'kuthuparamba',
    name: 'Kuthuparamba',
    count: 150,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=80',
    description: 'Key junction connecting Kannur, Wayanad, and Thalassery with busy commercial centers.',
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

export default function LandingPage({ defaultTab = 'home' }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Tab & Selection State
  const [activeNavTab, setActiveNavTab] = useState(() => {
    if (location.pathname === '/places') return 'places';
    if (location.pathname === '/category.php' || location.pathname === '/categories') return 'categories';
    if (location.pathname === '/contact') return 'contact';
    return defaultTab;
  });
  const [selectedFeaturedCategory, setSelectedFeaturedCategory] = useState('Cleaning Machine');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Search & Filters
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Check route to auto-scroll if visited via /places or /categories
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
    } else if (location.pathname === '/contact') {
      setTimeout(() => {
        const el = document.getElementById('contact-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location]);

  // Auto slide carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
  const filteredPlaces = placesList.filter((place) =>
    place.name.toLowerCase().includes(placeSearchQuery.toLowerCase()) ||
    place.description.toLowerCase().includes(placeSearchQuery.toLowerCase())
  );

  // Filter Establishments list
  const filteredEstablishments = initialEstablishments.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.categoryKey === selectedCategory;
    const matchesLocation =
      selectedLocation === 'all' ||
      item.location.toLowerCase() === selectedLocation.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLocation && matchesSearch;
  });

  const handleSelectPlace = (placeName) => {
    setSelectedLocation(placeName.toLowerCase());
    scrollToSection('establishments-section');
  };

  return (
    <div className="landing-container">
      {/* 1. Header / Navbar */}
      <header className="landing-header">
        <div className="landing-header-inner">
          {/* Logo */}
          <div className="landing-brand" onClick={() => { setActiveNavTab('home'); scrollToTop(); }}>
            <div className="landing-brand-icon">
              <HiLocationMarker />
            </div>
            <div className="landing-brand-title">
              <span className="landing-brand-name">Logo</span>
              <span className="landing-brand-sub">My Locality Info</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="landing-nav">
            <button
              onClick={() => {
                setActiveNavTab('home');
                scrollToTop();
              }}
              className={`landing-nav-link ${activeNavTab === 'home' ? 'active' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setActiveNavTab('places');
                scrollToSection('places-section');
              }}
              className={`landing-nav-link ${activeNavTab === 'places' ? 'active' : ''}`}
            >
              Places
            </button>
            <button
              onClick={() => {
                setActiveNavTab('categories');
                scrollToSection('featured-categories-section');
              }}
              className={`landing-nav-link ${activeNavTab === 'categories' ? 'active' : ''}`}
            >
              Categories
            </button>
            <button
              onClick={() => {
                setActiveNavTab('contact');
                scrollToSection('contact-section');
              }}
              className={`landing-nav-link ${activeNavTab === 'contact' ? 'active' : ''}`}
            >
              Contact
            </button>
          </nav>

          {/* Store Download Badges & Admin Access */}
          <div className="landing-header-actions">
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noreferrer"
              className="landing-app-badge"
              title="Get it on Google Play"
            >
              <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor">
                <path d="M325.8 256L80.4 10.6c-4.8 4.7-7.8 11.2-7.8 18.5v453.8c0 7.3 3 13.8 7.8 18.5L325.8 256zM365.2 295.4l55.1-31.8c12.2-7.1 12.2-25.7 0-32.8l-55.1-31.8-49.3 49.3 49.3 49.3zM99.6 498.4l238.4-238.4-49.3-49.3L80.4 419.1c4.5 4.5 11 7.3 19.2 7.3zM99.6 13.6c-8.2 0-14.7 2.8-19.2 7.3l208.3 208.3 49.3-49.3L99.6 13.6z" />
              </svg>
              <div className="landing-app-badge-text">
                <span className="small">GET IT ON</span>
                <span className="bold">Google Play</span>
              </div>
            </a>

            <a
              href="https://apple.com/app-store"
              target="_blank"
              rel="noreferrer"
              className="landing-app-badge"
              title="Download on the App Store"
            >
              <svg viewBox="0 0 384 512" width="18" height="18" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 66.7 31.9 114.7c15.4 22.8 34.6 48.2 59 47.4 23.4-.9 32.5-15 60.7-15 28.1 0 36.3 15 60.7 14.1 25-.9 41.6-22.8 56.9-45.6 17.8-25.9 25.1-51.1 25.5-52.4-1.2-.4-49-18.8-50-68zM242 108.9c16.2-19.7 27.2-47.1 24.2-74.5-23.4 1-51.8 15.6-68.4 35.1-14.8 17.3-27.8 45.1-24.3 71.8 26.1 2 52.3-12.8 68.5-32.4z" />
              </svg>
              <div className="landing-app-badge-text">
                <span className="small">Download on the</span>
                <span className="bold">App Store</span>
              </div>
            </a>

            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="landing-admin-btn"
            >
              {isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Banner Carousel Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-backdrop"></div>

        <div className="landing-carousel-wrapper">
          <div className="landing-carousel-container">
            {promoBanners.map((slide, idx) => {
              const isCenter = idx === currentSlide;
              const isPrev =
                idx === (currentSlide - 1 + promoBanners.length) % promoBanners.length;
              const isNext = idx === (currentSlide + 1) % promoBanners.length;

              let cardClass = 'landing-banner-card hidden';
              if (isCenter) cardClass = 'landing-banner-card active';
              else if (isPrev) cardClass = 'landing-banner-card prev';
              else if (isNext) cardClass = 'landing-banner-card next';

              return (
                <div
                  key={slide.id}
                  className={cardClass}
                  style={{ background: slide.bgGradient }}
                  onClick={() => setCurrentSlide(idx)}
                >
                  <div
                    className="landing-banner-accent"
                    style={{ background: slide.accentColor }}
                  ></div>
                  <div className="landing-banner-badge">{slide.badge}</div>

                  <h2 className="landing-banner-title">{slide.title}</h2>
                  <h4 className="landing-banner-sub">{slide.subtitle}</h4>
                  <p className="landing-banner-desc">{slide.description}</p>

                  <div className="landing-banner-footer">
                    <span className="landing-banner-tagline">
                      ⭐ {slide.tagline}
                    </span>
                    <div className="landing-banner-info">
                      <span>
                        <HiLocationMarker /> {slide.location}
                      </span>
                      <span>
                        <HiPhone /> {slide.phone}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <button
            onClick={() =>
              setCurrentSlide(
                (prev) => (prev - 1 + promoBanners.length) % promoBanners.length
              )
            }
            className="landing-carousel-arrow left"
            aria-label="Previous Slide"
          >
            <HiChevronLeft />
          </button>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % promoBanners.length)
            }
            className="landing-carousel-arrow right"
            aria-label="Next Slide"
          >
            <HiChevronRight />
          </button>

          {/* Dots */}
          <div className="landing-carousel-dots">
            {promoBanners.map((_, idx) => (
              <button
                key={idx}
                className={`landing-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Find Place & Places Grid Section (Matching reference screenshot: place.php) */}
      <section id="places-section" className="landing-find-place-section">
        <div className="landing-find-place-header">
          <div className="find-place-glow-effect"></div>
          <div className="find-place-badge">
            <HiLocationMarker /> MY LOCALITY SEARCH
          </div>
          <h2 className="find-place-title">Find Places & Services</h2>
          <p className="find-place-sub">
            Discover verified merchants, shops, offices, and landmarks in your locality
          </p>

          <div className="find-place-search-container">
            <div className="search-input-icon-wrapper">
              <HiSearch className="find-place-search-icon" />
            </div>
            <input
              type="text"
              placeholder="Search by town, category, or business (e.g. Payyanur, Bakery, Hospital)..."
              value={placeSearchQuery}
              onChange={(e) => setPlaceSearchQuery(e.target.value)}
              className="find-place-search-input"
            />
            {placeSearchQuery ? (
              <button
                className="find-place-clear-btn"
                onClick={() => setPlaceSearchQuery('')}
                aria-label="Clear Search"
              >
                <HiX />
              </button>
            ) : null}
            <button
              className="find-place-action-btn"
              onClick={() => {
                const el = document.getElementById('places-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Search</span>
              <HiChevronRight />
            </button>
          </div>

          {/* Popular Quick Search Suggestions */}
          <div className="find-place-tags">
            <span className="tags-label">Popular:</span>
            {['Payyanur', 'Kannur', 'Taliparamba', 'Cleaning Machine', 'Solar', 'Bakery'].map((tag) => (
              <button
                key={tag}
                className={`tag-pill ${placeSearchQuery.toLowerCase() === tag.toLowerCase() ? 'active' : ''}`}
                onClick={() => setPlaceSearchQuery(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="places-grid-wrapper">
          <h2 className="places-main-heading">Places</h2>

          <div className="places-grid">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className={`place-card ${
                  selectedLocation === place.name.toLowerCase() ? 'active-selected' : ''
                }`}
                onClick={() => handleSelectPlace(place.name)}
                title={`Click to view services in ${place.name}`}
              >
                <div className="place-image-holder">
                  <img src={place.image} alt={place.name} className="place-image" />
                  <div className="place-badge">{place.count} Services</div>
                </div>
                <div className="place-card-footer">
                  <h3 className="place-card-title">{place.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3.5. Featured Categories Grid Section (Matching Screenshot 1 & 3: category.php) */}
      <section id="featured-categories-section" className="featured-categories-page-section">
        <div className="featured-categories-container">
          <h2 className="featured-categories-heading">Categories</h2>

          {/* Category Search Bar */}
          <div className="category-search-container">
            <HiSearch className="category-search-icon" />
            <input
              type="text"
              placeholder="Search categories (e.g. Bakery, Software, Temple, Clinic)..."
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              className="category-search-input"
            />
            {categorySearchQuery ? (
              <button
                onClick={() => setCategorySearchQuery('')}
                className="category-search-clear"
                aria-label="Clear category search"
              >
                <HiX />
              </button>
            ) : null}
          </div>

          {featuredCategoriesList.filter((cat) =>
            cat.title.toLowerCase().includes(categorySearchQuery.toLowerCase())
          ).length === 0 ? (
            <div className="landing-empty-state" style={{ margin: '20px 0' }}>
              <HiInformationCircle className="empty-icon" />
              <h3>No categories found matching "{categorySearchQuery}"</h3>
              <button
                onClick={() => setCategorySearchQuery('')}
                className="btn btn-primary"
                style={{ marginTop: 12 }}
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="featured-categories-grid">
              {featuredCategoriesList
                .filter((cat) =>
                  cat.title.toLowerCase().includes(categorySearchQuery.toLowerCase())
                )
                .map((cat) => {
                  const isSelected = selectedFeaturedCategory === cat.title;
                  return (
                    <div
                      key={cat.id}
                      className={`featured-category-card ${isSelected ? 'active-selected' : ''}`}
                      onClick={() => {
                        setSelectedFeaturedCategory(cat.title);
                        setSearchQuery(cat.title);
                        scrollToSection('establishments-section');
                      }}
                    >
                      <div className="featured-category-icon">
                        {renderCategoryIcon(cat.key)}
                      </div>
                      <span className="featured-category-title">{cat.title}</span>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Pagination bar matching Screenshot 1 & 3 */}
          <div className="categories-pagination-bar">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCategoryPage(pageNum)}
                className={`categories-page-btn ${categoryPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            ))}
            <span className="categories-page-info">Page {categoryPage} of 10</span>
          </div>
        </div>
      </section>

      {/* 4. Filter & Search Section */}
      <section id="categories-section" className="landing-filter-section">
        <div className="landing-filter-container">
          <div className="landing-search-box">
            <HiSearch className="landing-search-icon" />
            <input
              type="text"
              placeholder="Search establishments, services, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="landing-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="landing-search-clear"
              >
                <HiX />
              </button>
            )}
          </div>

          <div className="landing-location-filter">
            <span className="filter-label">Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="landing-select"
            >
              <option value="all">All Locations</option>
              {placesList.map((p) => (
                <option key={p.id} value={p.name.toLowerCase()}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="landing-category-pills">
          {[
            { key: 'all', label: 'All Services', icon: '🏪' },
            { key: 'automobile', label: 'Automobile', icon: '🚗' },
            { key: 'solar', label: 'Solar & Energy', icon: '⚡' },
            { key: 'health', label: 'Medical & Healthcare', icon: '🏥' },
            { key: 'food', label: 'Hotels & Dining', icon: '🍽️' },
            { key: 'shopping', label: 'Shopping & Fashion', icon: '🛍️' },
            { key: 'services', label: 'Aluminium & Services', icon: '🔧' },
            { key: 'travel', label: 'Travels & Transport', icon: '🚌' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`landing-pill ${
                selectedCategory === cat.key ? 'active' : ''
              }`}
            >
              <span className="pill-icon">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Establishments / Services Grid Section */}
      <section id="establishments-section" className="landing-establishments-section">
        <div className="landing-section-header">
          <h2 className="landing-section-title">Establishments / Services</h2>
          <p className="landing-section-sub">
            Showing verified local merchants and providers{' '}
            {selectedLocation !== 'all' ? `in "${selectedLocation.toUpperCase()}"` : 'in your locality'}
          </p>
        </div>

        {filteredEstablishments.length === 0 ? (
          <div className="landing-empty-state">
            <HiInformationCircle className="empty-icon" />
            <h3>No establishments found</h3>
            <p>Try searching for a different term or select "All Locations".</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLocation('all');
                setSearchQuery('');
              }}
              className="btn btn-primary"
              style={{ marginTop: 12 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="landing-grid">
            {filteredEstablishments.map((item) => (
              <div
                key={item.id}
                className="establishment-card"
                onClick={() => setSelectedMerchant(item)}
              >
                <div className="establishment-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="establishment-image"
                  />
                  <div className="establishment-category-tag">
                    {item.category}
                  </div>
                  <div className="establishment-rating">
                    <HiStar style={{ color: '#F59E0B' }} /> {item.rating}
                  </div>
                </div>

                <div className="establishment-card-content">
                  <h3 className="establishment-name">{item.name}</h3>

                  <div className="establishment-meta">
                    <span className="meta-item">
                      <HiLocationMarker className="meta-icon" /> {item.location}
                    </span>
                    <span className="meta-item">
                      <HiPhone className="meta-icon" /> {item.phone}
                    </span>
                  </div>

                  <div className="establishment-card-footer">
                    <span className="establishment-category-sub">
                      {item.category}
                    </span>
                    <div className="establishment-arrow-btn">
                      <HiChevronRight />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. News & Updates Section (Matching screenshot 3) */}
      <section className="landing-news-section">
        <div className="landing-news-header">
          <h2 className="news-title">News & Updates</h2>
          <p className="news-subtitle">Logo Info Find your solutions quickly</p>
        </div>

        <div className="news-grid">
          {/* Card 1 */}
          <div className="news-card card-red">
            <div className="news-card-badge">JOIN US</div>
            <div className="news-card-content">
              <h3>My Locality Info</h3>
              <p className="news-malayalam">Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ</p>
              <h4>ലോകമറിയട്ടെ നിങ്ങളുടെ</h4>
              <h2 className="news-highlight">BUSINESS & OFFERS</h2>

              <ul className="news-features">
                <li>Multi Photos & Details</li>
                <li>Address & Contact Details</li>
                <li>Direct Calling & WhatsApp</li>
                <li>Page Sharing & Distance</li>
              </ul>
            </div>

            <div className="news-card-footer">
              <div className="discount-tag">
                <span>Join Now Get</span>
                <strong>50% OFF</strong>
              </div>
              <div className="qr-block">
                <HiQrcode className="qr-icon" />
                <span>Applink</span>
              </div>
            </div>
            <div className="news-contact">Mob: +91 860 60 800 74</div>
          </div>

          {/* Card 2 */}
          <div className="news-card card-black">
            <div className="news-card-badge dark">PREMIUM SUBSCRIPTION</div>
            <div className="news-card-content">
              <h3>My Locality Info</h3>
              <p className="news-malayalam">Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ</p>
              <h4>ലോകമറിയട്ടെ നിങ്ങളുടെ</h4>
              <h2 className="news-highlight yellow">BUSINESS & OFFERS</h2>

              <ul className="news-features">
                <li>E-Commerce Portal Access</li>
                <li>Videos & Image Gallery</li>
                <li>Offers & Distance Filter</li>
                <li>User Login & Analytics</li>
              </ul>
            </div>

            <div className="news-card-footer">
              <div className="discount-tag tag-green">
                <span>Join Now Get</span>
                <strong>50% OFF</strong>
              </div>
              <div className="qr-block">
                <HiQrcode className="qr-icon" />
                <span>Applink</span>
              </div>
            </div>
            <div className="news-contact">Mob: +91 860 60 800 74</div>
          </div>

          {/* Card 3 */}
          <div className="news-card card-gradient">
            <div className="news-card-badge">SPECIAL OFFER</div>
            <div className="news-card-content">
              <h3>My Locality Info</h3>
              <p className="news-malayalam">Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ</p>
              <h4>ലോകമറിയട്ടെ നിങ്ങളുടെ</h4>
              <h2 className="news-highlight pink">BUSINESS & OFFERS</h2>

              <ul className="news-features">
                <li>Verified Merchant Badge</li>
                <li>Boosted Search Ranking</li>
                <li>WhatsApp Integration</li>
                <li>24/7 Premium Support</li>
              </ul>
            </div>

            <div className="news-card-footer">
              <div className="discount-tag tag-purple">
                <span>Join Now Get</span>
                <strong>50% OFF</strong>
              </div>
              <div className="qr-block">
                <HiQrcode className="qr-icon" />
                <span>Applink</span>
              </div>
            </div>
            <div className="news-contact">Mob: +91 860 60 800 74</div>
          </div>
        </div>
      </section>

      {/* 8. Full Width Blue Footer (Matching reference screenshot 1 & 4) */}
      <footer id="contact-section" className="landing-full-footer">
        <div className="full-footer-inner">
          {/* Col 1: Logo & App summary */}
          <div className="full-footer-brand">
            <div className="full-brand-header">
              <div className="full-brand-icon">
                <HiLocationMarker />
              </div>
              <span className="full-brand-name">Logo</span>
            </div>
            <p className="full-brand-desc">
              Get your work done quickly and easily. Logo is a digital service provider that
              helps you in finding solutions to a variety of needs in your local area. Also,
              register your business with us and let people discover you.
            </p>
          </div>

          {/* Col 2: Company Address & Contact Details */}
          <div className="full-footer-address">
            <h4>
              <HiLocationMarker style={{ color: '#fff' }} /> AURUMFX PVT LTD
            </h4>
            <p>V/664, First Floor,</p>
            <p>Thekkekkara Antony Master Square,</p>
            <p>Kunnathangadi,</p>
            <p>Thrissur, Kerala - 680 012</p>
            <div className="full-contact-row">
              <HiMail /> <span>info@aurumfx.net</span>
            </div>
            <div className="full-contact-row">
              <HiPhone /> <span>+91 75102 14060 / 75102 14080</span>
            </div>
          </div>

          {/* Col 3: Social Links & App Download Badges */}
          <div className="full-footer-social">
            <div className="social-icons-row">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon">
                <FaFacebookF />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon">
                <FaInstagram />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-icon">
                <FaYoutube />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon">
                <FaTwitter />
              </a>
            </div>

            <div className="footer-store-badges">
              <a href="https://play.google.com/store" target="_blank" rel="noreferrer" className="full-store-badge">
                <svg viewBox="0 0 512 512" width="18" height="18" fill="currentColor">
                  <path d="M325.8 256L80.4 10.6c-4.8 4.7-7.8 11.2-7.8 18.5v453.8c0 7.3 3 13.8 7.8 18.5L325.8 256zM365.2 295.4l55.1-31.8c12.2-7.1 12.2-25.7 0-32.8l-55.1-31.8-49.3 49.3 49.3 49.3zM99.6 498.4l238.4-238.4-49.3-49.3L80.4 419.1c4.5 4.5 11 7.3 19.2 7.3zM99.6 13.6c-8.2 0-14.7 2.8-19.2 7.3l208.3 208.3 49.3-49.3L99.6 13.6z" />
                </svg>
                <div className="badge-txt">
                  <span className="sm">GET IT ON</span>
                  <span className="lg">Google Play</span>
                </div>
              </a>

              <a href="https://apple.com/app-store" target="_blank" rel="noreferrer" className="full-store-badge">
                <svg viewBox="0 0 384 512" width="16" height="16" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 66.7 31.9 114.7c15.4 22.8 34.6 48.2 59 47.4 23.4-.9 32.5-15 60.7-15 28.1 0 36.3 15 60.7 14.1 25-.9 41.6-22.8 56.9-45.6 17.8-25.9 25.1-51.1 25.5-52.4-1.2-.4-49-18.8-50-68zM242 108.9c16.2-19.7 27.2-47.1 24.2-74.5-23.4 1-51.8 15.6-68.4 35.1-14.8 17.3-27.8 45.1-24.3 71.8 26.1 2 52.3-12.8 68.5-32.4z" />
                </svg>
                <div className="badge-txt">
                  <span className="sm">Download on the</span>
                  <span className="lg">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="full-footer-bottom">
          © COPYRIGHT {new Date().getFullYear()} | AURUMFX PVT LTD | ALL RIGHTS RESERVED
        </div>
      </footer>

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

      {/* 10. Merchant Details Modal */}
      {selectedMerchant && (
        <div className="modal-backdrop" onClick={() => setSelectedMerchant(null)}>
          <div
            className="modal-container merchant-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="merchant-modal-title">
                <h3>{selectedMerchant.name}</h3>
                <span className="badge badge-purple">{selectedMerchant.category}</span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedMerchant(null)}
              >
                <HiX />
              </button>
            </div>

            <div className="modal-body">
              <img
                src={selectedMerchant.image}
                alt={selectedMerchant.name}
                className="merchant-modal-img"
              />

              <div className="merchant-modal-grid">
                <div className="info-block">
                  <HiLocationMarker className="info-icon" />
                  <div>
                    <strong>Location / Address</strong>
                    <p>{selectedMerchant.address}</p>
                  </div>
                </div>

                <div className="info-block">
                  <HiPhone className="info-icon" />
                  <div>
                    <strong>Phone Contact</strong>
                    <p>{selectedMerchant.phone}</p>
                  </div>
                </div>

                <div className="info-block">
                  <HiStar className="info-icon star-icon" />
                  <div>
                    <strong>Rating & Reviews</strong>
                    <p>
                      {selectedMerchant.rating} Stars ({selectedMerchant.reviews} user reviews)
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <h4>About</h4>
                <p style={{ color: '#4B5563', lineHeight: 1.6, marginTop: 6 }}>
                  {selectedMerchant.description}
                </p>
              </div>

              {selectedMerchant.highlights && (
                <div style={{ marginTop: 16 }}>
                  <h4>Key Highlights</h4>
                  <ul className="merchant-highlights">
                    {selectedMerchant.highlights.map((h, i) => (
                      <li key={i}>
                        <HiCheckCircle className="check-icon" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <a
                href={`tel:${selectedMerchant.phone}`}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <HiPhone /> Call Merchant
              </a>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedMerchant(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
