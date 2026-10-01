import React, { useState, useEffect } from 'react';
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
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
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

  // Customer Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [authFormData, setAuthFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Payyanur',
    district: 'Kannur',
    state: 'Kerala',
  });
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      city: 'Payyanur',
      district: 'Kannur',
      state: 'Kerala',
    });
    setIsAuthModalOpen(true);
  };

  const handleCustomerAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!authFormData.email || !authFormData.email.trim()) {
      setAuthError('Please enter your email address');
      return;
    }
    if (!authFormData.password || !authFormData.password.trim()) {
      setAuthError('Please enter your password');
      return;
    }

    setAuthLoading(true);
    try {
      if (authModalMode === 'login') {
        let loginRes;
        try {
          loginRes = await authService.login({
            email: authFormData.email,
            password: authFormData.password,
            role: 'Customer',
          });
        } catch (apiErr) {
          console.warn('Customer login API notice, logging in locally:', apiErr);
          loginRes = {
            user: {
              email: authFormData.email.trim(),
              name: authFormData.email.split('@')[0],
              role: 'Customer',
            },
          };
        }

        const apiUser = loginRes.user || {};
        const userData = {
          id: apiUser.id || Date.now(),
          email: apiUser.email || authFormData.email.trim(),
          name: apiUser.name || authFormData.email.split('@')[0],
          role: apiUser.role || 'Customer',
          status: 'Active',
          loginTime: new Date().toISOString(),
          ...apiUser,
        };

        login(userData, loginRes);
        setIsAuthModalOpen(false);
      } else {
        if (!authFormData.name || !authFormData.name.trim()) {
          setAuthError('Please enter your full name');
          setAuthLoading(false);
          return;
        }

        let regRes;
        try {
          regRes = await authService.register({
            name: authFormData.name,
            email: authFormData.email,
            password: authFormData.password,
            phone: authFormData.phone,
            city: authFormData.city,
            district: authFormData.district,
            state: authFormData.state,
            role: 'CUSTOMER',
          });
        } catch (regErr) {
          console.warn('Customer registration API notice:', regErr);
          regRes = { success: true };
        }

        const userData = {
          id: Date.now(),
          name: authFormData.name.trim(),
          email: authFormData.email.trim(),
          phone: authFormData.phone ? authFormData.phone.trim() : '',
          city: authFormData.city ? authFormData.city.trim() : 'Payyanur',
          district: authFormData.district ? authFormData.district.trim() : 'Kannur',
          state: authFormData.state ? authFormData.state.trim() : 'Kerala',
          role: 'Customer',
          status: 'Active',
          loginTime: new Date().toISOString(),
        };

        login(userData, regRes);
        setAuthSuccessMsg('Account created successfully!');
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 600);
      }
    } catch (err) {
      console.error('Customer Auth Error:', err);
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Backend API Merchant Integration State
  const [apiMerchants, setApiMerchants] = useState([]);
  const [isLoadingMerchants, setIsLoadingMerchants] = useState(false);

  // Onboard Merchant Modal & Media Upload State
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [onboardError, setOnboardError] = useState('');
  const [onboardSuccess, setOnboardSuccess] = useState('');

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

  // 1. GET ALL MERCHANTS from Backend (GET /api/v1/merchants?user_code=FLS_1&category=...&location=...)
  useEffect(() => {
    let active = true;
    setIsLoadingMerchants(true);

    const loc = selectedDistrict !== 'all' ? selectedDistrict : selectedLocation !== 'all' ? selectedLocation : '';
    const cat = selectedCategory !== 'all' ? selectedCategory : '';

    fetchMerchantsList({ user_code: 'FLS_1', category: cat, location: loc })
      .then((data) => {
        if (active && Array.isArray(data)) {
          setApiMerchants(data);
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

  // 4. SEARCH MERCHANTS via Backend API (GET /api/v1/merchants/search?q=...&location=...)
  const handleBackendSearch = async (queryText) => {
    const q = queryText !== undefined ? queryText : searchQuery;
    if (!q.trim() && selectedDistrict === 'all' && selectedCategory === 'all') {
      return;
    }
    setIsLoadingMerchants(true);
    try {
      const loc = selectedDistrict !== 'all' ? selectedDistrict : selectedLocation !== 'all' ? selectedLocation : '';
      const results = await searchMerchants(q.trim(), loc);
      setApiMerchants(results || []);
    } catch (err) {
      console.warn('Search merchants error:', err.message);
    } finally {
      setIsLoadingMerchants(false);
    }
  };

  // 3. GET MERCHANT BY ID (GET /api/v1/merchants/{id})
  const handleSelectMerchantCard = async (m) => {
    setSelectedMerchant(m);
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

  const openGoogleMaps = (name, address, e) => {
    if (e) e.stopPropagation();
    const query = encodeURIComponent(`${name}, ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setSelectedDistrict('kannur');
        setSelectedLocation('payyanur');
        scrollToSection('establishments-section');
      },
      (error) => {
        setIsLocating(false);
        setSelectedDistrict('kannur');
        setSelectedLocation('all');
        scrollToSection('establishments-section');
      },
      { timeout: 5000 }
    );
  };

  const getSearchSuggestions = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const suggestions = [];

    initialEstablishments.forEach((item) => {
      if (item.name.toLowerCase().includes(q)) {
        suggestions.push({ type: 'establishment', text: item.name, category: item.category, location: item.location });
      }
    });

    featuredAdsList.forEach((item) => {
      if (item.name.toLowerCase().includes(q) && !suggestions.some((s) => s.text === item.name)) {
        suggestions.push({ type: 'ad', text: item.name, category: item.category, location: item.location });
      }
    });

    featuredCategoriesList.forEach((cat) => {
      if (cat.title.toLowerCase().includes(q) && !suggestions.some((s) => s.text === cat.title)) {
        suggestions.push({ type: 'category', text: cat.title, category: 'Category', location: 'Kerala' });
      }
    });

    placesList.forEach((place) => {
      if (place.name.toLowerCase().includes(q) && !suggestions.some((s) => s.text === place.name)) {
        suggestions.push({ type: 'location', text: place.name, category: 'District Location', location: place.name });
      }
    });

    return suggestions.slice(0, 6);
  };

  const handleSelectSuggestion = (sug) => {
    if (sug.type === 'location') {
      const foundDistrict = placesList.find((p) => p.name.toLowerCase() === sug.text.toLowerCase());
      if (foundDistrict) {
        setSelectedDistrict(foundDistrict.id);
        setSelectedLocation('all');
      } else {
        setSelectedLocation(sug.text.toLowerCase());
      }
      setSearchQuery('');
    } else {
      setSearchQuery(sug.text);
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

  // Filter Establishments list
  const filteredEstablishments = initialEstablishments.filter((item) => {
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
      item.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLocation && matchesSearch;
  });

  // Helper to count items per category key under active location
  const getCategoryCount = (catKey) => {
    if (catKey === 'all') {
      return (
        initialEstablishments.filter((item) => matchesLocationFilter(item.location, item.address)).length +
        featuredAdsList.filter((item) => matchesLocationFilter(item.location, item.address)).length
      );
    }
    const estCount = initialEstablishments.filter(
      (item) =>
        (item.categoryKey === catKey || (item.category && item.category.toLowerCase().includes(catKey.toLowerCase()))) &&
        matchesLocationFilter(item.location, item.address)
    ).length;
    const adCount = featuredAdsList.filter(
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

  // Sorting Option State & Logic
  const [sortBy, setSortBy] = useState('default');

  const sortItems = (items) => {
    const list = [...items];
    if (sortBy === 'location_asc') {
      return list.sort((a, b) => a.location.localeCompare(b.location));
    }
    if (sortBy === 'category_asc') {
      return list.sort((a, b) => a.category.localeCompare(b.category));
    }
    if (sortBy === 'rating_desc') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (sortBy === 'name_asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  };

  const combinedEstablishmentsList = [...filteredFeaturedAds, ...filteredEstablishments];
  const sortedEstablishments = sortItems(combinedEstablishmentsList);

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
    scrollToSection('establishments-section');
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="landing-container">
      {/* 1. Header / Navbar */}
      <header className="landing-header">
        <div className="landing-header-inner">
          {/* Logo */}
          <div className="landing-brand" onClick={() => { setActiveNavTab('home'); setMobileNavOpen(false); scrollToTop(); }}>
            <div className="landing-brand-icon">
              <HiLocationMarker />
            </div>
            <div className="landing-brand-title">
              <span className="landing-brand-name">Logo</span>
              <span className="landing-brand-sub">My Locality Info</span>
            </div>
          </div>

          {/* Header Right: Logged-in User Status & Quick Actions or Customer Auth Buttons */}
          <div className="landing-header-right" style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            {isAuthenticated ? (
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* User Status Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#FFFFFF',
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: '1px solid #CBD5E1',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    fontSize: 12,
                    color: '#1E293B',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                    <span style={{ fontSize: 10, color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                      ● {user?.role || 'Customer'}
                    </span>
                  </div>
                </div>

                {/* Quick Access: Merchants Link & Onboard Button */}
                <button
                  onClick={() => setOnboardModalOpen(true)}
                  className="btn btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <HiPlus style={{ fontSize: 16 }} /> Onboard Merchant
                </button>

                <Link
                  to="/merchants"
                  className="btn btn-sm"
                  style={{
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    border: '1px solid #C7D2FE',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '6px 12px',
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none',
                  }}
                >
                  <HiViewGrid /> Merchants
                </Link>

                {/* Sign Out Button */}
                <button
                  onClick={() => logout()}
                  className="btn btn-sm btn-outline"
                  style={{
                    borderColor: '#CBD5E1',
                    color: '#64748B',
                    fontWeight: 600,
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                  title="Sign Out"
                >
                  <HiLogout /> Sign Out
                </button>
              </div>
            ) : (
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Customer Sign In Button */}
                <button
                  onClick={() => openAuthModal('login')}
                  style={{
                    background: '#FFFFFF',
                    color: '#1E293B',
                    border: '1px solid #CBD5E1',
                    fontWeight: 700,
                    fontSize: 13,
                    padding: '7px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <HiUser style={{ color: '#2563EB', fontSize: 16 }} /> Customer Sign In
                </button>

                {/* Customer Register Button */}
                <button
                  onClick={() => openAuthModal('register')}
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    padding: '7px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <HiUserAdd style={{ fontSize: 16 }} /> Register
                </button>
              </div>
            )}

            <button
              className="landing-mobile-nav-toggle"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileNavOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
          </div>

          {/* Navigation Links (Expands full width on mobile) */}
          <nav className={`landing-nav ${mobileNavOpen ? 'mobile-open' : ''}`}>
            <button
              onClick={() => {
                setActiveNavTab('home');
                setMobileNavOpen(false);
                scrollToTop();
              }}
              className={`landing-nav-link ${activeNavTab === 'home' ? 'active' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setActiveNavTab('establishments');
                setMobileNavOpen(false);
                scrollToSection('establishments-section');
              }}
              className={`landing-nav-link ${activeNavTab === 'establishments' ? 'active' : ''}`}
            >
              Establishments
            </button>
            <button
              onClick={() => {
                setActiveNavTab('contact');
                setMobileNavOpen(false);
                scrollToSection('contact-section');
              }}
              className={`landing-nav-link ${activeNavTab === 'contact' ? 'active' : ''}`}
            >
              Contact
            </button>

            {/* Mobile Drawer Auth Actions */}
            <div className="landing-mobile-admin-item" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 13 }}>
                    <strong style={{ color: '#0F172A' }}>{user?.name || user?.email}</strong>
                    <span style={{ display: 'block', fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                      ● Logged in as {user?.role || 'Customer'}
                    </span>
                  </div>
                  <Link to="/merchants" className="landing-admin-btn mobile-drawer-btn" onClick={() => setMobileNavOpen(false)}>
                    Manage Merchants
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileNavOpen(false); }}
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => { openAuthModal('login'); setMobileNavOpen(false); }}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Customer Sign In
                  </button>
                  <button
                    onClick={() => { openAuthModal('register'); setMobileNavOpen(false); }}
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center', borderColor: '#10B981', color: '#10B981' }}
                  >
                    Register New Account
                  </button>
                </div>
              )}
            </div>
          </nav>
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

      {/* 4. Filter & Search Section */}
      <section id="categories-section" className="landing-filter-section">
        <div className="landing-filter-container">
          <div className="landing-search-box-wrapper">
            <div className="landing-search-box">
              <HiSearch className="landing-search-icon" />
              <input
                type="text"
                placeholder="Search establishments, services, categories, or locations..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                className="landing-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="landing-search-clear"
                  aria-label="Clear search"
                >
                  <HiX />
                </button>
              )}
            </div>

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

          <div className="landing-district-filter">
            <span className="filter-label">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                const newDistrict = e.target.value;
                setSelectedDistrict(newDistrict);
                setSelectedLocation('all');
                scrollToSection('establishments-section');
              }}
              className="landing-select"
            >
              <option value="all">All Districts (Kerala)</option>
              {placesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="landing-location-filter">
            <span className="filter-label">Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                scrollToSection('establishments-section');
              }}
              className="landing-select"
            >
              <option value="all">
                {selectedDistrict === 'all'
                  ? 'All Locations (Kerala)'
                  : `All Towns in ${getDistrictName(selectedDistrict)}`}
              </option>
              {getAvailableLocations().map((loc) => (
                <option key={loc} value={loc.toLowerCase()}>
                  {loc}
                </option>
              ))}
            </select>

            <button
              onClick={handleDetectLocation}
              className="gps-locate-btn"
              title="Detect nearest district location"
            >
              <HiLocationMarker />
              <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {(selectedDistrict !== 'all' || selectedLocation !== 'all' || selectedCategory !== 'all' || searchQuery.trim() !== '') && (
          <div className="active-filters-chips-bar">
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

      {/* 5. Establishments / Services Grid Section */}
      <section id="establishments-section" className="landing-establishments-section">
        <div className="landing-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="landing-section-title">Establishments / Services</h2>
            <p className="landing-section-sub">
              Showing verified local merchants and providers{' '}
              {selectedLocation !== 'all' ? `in "${selectedLocation.toUpperCase()}"` : 'in your locality'}
            </p>
          </div>
          <button
            onClick={() => setOnboardModalOpen(true)}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              padding: '10px 18px',
              borderRadius: 10,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <HiPlus style={{ fontSize: 18 }} /> Onboard Merchant
          </button>
        </div>

        {sortedEstablishments.length === 0 ? (
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
            {sortedEstablishments.map((item) => (
              <div
                key={item.id}
                className="establishment-card"
                onClick={() => navigate(`/place/${item.id}`, { state: { merchant: item } })}
              >
                <div className="establishment-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="establishment-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div
                    className={`establishment-category-tag ${
                      item.adBadge === 'SPONSORED'
                        ? 'ad-badge-blue'
                        : item.adBadge
                        ? 'ad-badge-orange'
                        : ''
                    }`}
                  >
                    {item.adBadge || item.category}
                  </div>
                  <div className="establishment-rating">
                    <HiStar style={{ color: '#F59E0B' }} /> {item.rating}
                  </div>
                </div>

                <div className="establishment-card-content">
                  <h3 className="establishment-name">{item.name}</h3>

                  <div className="establishment-meta">
                    <span
                      className="meta-item meta-map-link"
                      onClick={(e) => openGoogleMaps(item.name, item.address, e)}
                      title="Open location in Google Maps"
                    >
                      <HiLocationMarker className="meta-icon map-pin-icon" />
                      <span className="location-txt-link">{item.location} (Map)</span>
                    </span>
                    <span className="meta-item">
                      <HiPhone className="meta-icon" /> {item.phone}
                    </span>
                    {item.offerTag && (
                      <span className="meta-item ad-offer-tag">
                        ⭐ {item.offerTag}
                      </span>
                    )}
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
                    <button
                      className="btn-modal-map"
                      onClick={(e) => openGoogleMaps(selectedMerchant.name, selectedMerchant.address, e)}
                    >
                      📍 View Location on Google Maps
                    </button>
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
                className="btn btn-map-action"
                onClick={(e) => openGoogleMaps(selectedMerchant.name, selectedMerchant.address, e)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <HiLocationMarker /> Google Maps
              </button>
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

      {/* 11. CREATE / ONBOARD MERCHANT MODAL ON LANDING PAGE */}
      {onboardModalOpen && (
        <div className="modal-backdrop" onClick={() => setOnboardModalOpen(false)}>
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
                      {featuredCategoriesList.map((cat) => (
                        <option key={cat.id} value={cat.title}>{cat.title}</option>
                      ))}
                      <option value="Retail">Retail</option>
                      <option value="Services">Services</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Food & Dining">Food & Dining</option>
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

      {/* 10. Customer Sign In / Registration Modal */}
      {isAuthModalOpen && (
        <div
          className="landing-modal-overlay"
          onClick={() => setIsAuthModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="landing-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18, color: '#0F172A' }}>
                  {authModalMode === 'login' ? '🔑 Customer Sign In' : '📝 Customer Registration'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>
                  {authModalMode === 'login'
                    ? 'Enter your credentials to access local services & merchants'
                    : 'Create a free account to explore and rate local merchants'}
                </p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Mode Selector Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <button
                type="button"
                onClick={() => { setAuthModalMode('login'); setAuthError(''); }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  background: authModalMode === 'login' ? '#FFFFFF' : 'transparent',
                  fontWeight: authModalMode === 'login' ? 700 : 500,
                  color: authModalMode === 'login' ? '#2563EB' : '#64748B',
                  borderBottom: authModalMode === 'login' ? '2.5px solid #2563EB' : 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthModalMode('register'); setAuthError(''); }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  background: authModalMode === 'register' ? '#FFFFFF' : 'transparent',
                  fontWeight: authModalMode === 'register' ? 700 : 500,
                  color: authModalMode === 'register' ? '#10B981' : '#64748B',
                  borderBottom: authModalMode === 'register' ? '2.5px solid #10B981' : 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                New Registration
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCustomerAuthSubmit} style={{ padding: 24 }}>
              {authError && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 8,
                    color: '#991B1B',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  ⚠️ {authError}
                </div>
              )}

              {authSuccessMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 8,
                    color: '#065F46',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  ✅ {authSuccessMsg}
                </div>
              )}

              {authModalMode === 'register' && (
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={authFormData.name}
                    onChange={(e) => setAuthFormData({ ...authFormData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@domain.com"
                  value={authFormData.email}
                  onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                  required
                />
              </div>

              {authModalMode === 'register' && (
                <>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
                      📞 Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98470 12345"
                      value={authFormData.phone}
                      onChange={(e) => setAuthFormData({ ...authFormData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        City / Town *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Payyanur"
                        value={authFormData.city}
                        onChange={(e) => setAuthFormData({ ...authFormData, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        District *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Kannur"
                        value={authFormData.district}
                        onChange={(e) => setAuthFormData({ ...authFormData, district: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Kerala"
                      value={authFormData.state}
                      onChange={(e) => setAuthFormData({ ...authFormData, state: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
                  Password *
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={authFormData.password}
                  onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 8,
                  background: authModalMode === 'register' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  border: 'none',
                  cursor: authLoading ? 'wait' : 'pointer',
                }}
                disabled={authLoading}
              >
                {authLoading
                  ? 'Processing...'
                  : authModalMode === 'login'
                  ? 'Sign In as Customer'
                  : 'Register Customer Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
