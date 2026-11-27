import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiX,
  HiUser,
  HiKey,
  HiChatAlt2,
  HiUserAdd,
  HiEye,
  HiEyeOff,
  HiLocationMarker,
  HiCheckCircle,
  HiExclamationCircle,
  HiShoppingBag,
  HiSparkles,
  HiPlusCircle,
  HiHeart,
  HiLogout,
  HiChevronRight,
  HiChevronLeft,
  HiPhotograph,
  HiVideoCamera,
  HiShieldCheck,
  HiCreditCard,
} from 'react-icons/hi';
import {
  customerEmailLogin,
  customerSendOTP,
  customerVerifyOTP,
  customerRegister,
  customerForgotPassword,
  customerResetPassword,
  fetchCustomerProfile,
  logoutCustomerSession,
  getStoredCustomerUser,
  isCustomerAuthenticated,
  updateCustomerLocation,
} from '../api/customerApi';
import {
  merchantEmailLogin,
  merchantSendOTP,
  merchantVerifyOTP,
  merchantForgotPassword,
  merchantResetPassword,
  onboardMerchant,
  uploadMerchantMedia,
  logoutMerchantSession,
  getStoredMerchantUser,
  getMerchantToken,
} from '../api/merchantApi';
import {
  fetchAdminSubscriptionPackages,
  fetchMyActiveSubscriptions,
  cancelMySubscription,
  hasActiveSellerSubscription,
  startCustomerRazorpaySubscription,
} from '../api/subscriptionApi';
import { useAuth } from '../context/AuthContext';

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

const DISTRICT_TOWNS_MAP = {
  Kannur: ['Payyanur', 'Kannur City', 'Taliparamba', 'Thalassery', 'Mattannur'],
  Kozhikode: ['Kozhikode City', 'Calicut', 'Vadakara', 'Koyilandy', 'Feroke'],
  Ernakulam: ['Kochi', 'Edappally', 'Aluva', 'Kakkanad', 'Kaloor'],
  Thiruvananthapuram: ['Trivandrum City', 'East Fort', 'Technopark', 'Neyyattinkara'],
  Thrissur: ['Thrissur City', 'Chalakudy', 'Guruvayur', 'Kunnamkulam'],
  Wayanad: ['Kalpetta', 'Sulthan Bathery', 'Mananthavady', 'Vythiri'],
  Kasaragod: ['Kasaragod City', 'Kanhangad', 'Nileshwar', 'Trikaripur'],
  Malappuram: ['Malappuram City', 'Manjeri', 'Perinthalmanna', 'Tirur', 'Kottakkal'],
  Palakkad: ['Palakkad City', 'Ottapalam', 'Chittur', 'Mannarkkad'],
  Alappuzha: ['Alappuzha City', 'Cherthala', 'Kayamkulam', 'Haripad'],
  Kollam: ['Kollam City', 'Karunagappally', 'Punalur', 'Kottarakkara'],
  Kottayam: ['Kottayam City', 'Pala', 'Changanassery', 'Vaikom'],
  Idukki: ['Thodupuzha', 'Munnar', 'Kattappana', 'Nedumkandam'],
  Pathanamthitta: ['Pathanamthitta City', 'Adoor', 'Thiruvalla', 'Ranni'],
};

const MERCHANT_CATEGORIES = [
  'Retail',
  'Restaurants',
  'Hotels & Dining',
  'Bakery',
  'Super Market',
  'Textiles',
  'Electronics',
  'Solar & Electricals',
  'Automobiles',
  'Healthcare & Medicals',
  'Jewellery',
  'Beauty Parlour',
  'Education',
  'Real Estate',
  'Interiors & Furniture',
  'Home Services',
  'General Services',
];

export default function MobileAccountModal({
  isOpen,
  onClose,
  initialSection = 'hub', // 'hub' | 'customer-login' | 'customer-otp' | 'customer-register' | 'merchant-login' | 'merchant-register' | 'subscriptions'
  promptMessage = '',
  onAuthSuccess,
  onOpenCreateProduct,
  onOpenWishlist,
}) {
  const navigate = useNavigate();
  const { login: authContextLogin } = useAuth();

  // Which view is visible: 'hub' | 'customer-auth' | 'merchant-auth' | 'subscriptions'
  const [section, setSection] = useState('hub');
  const [customerTab, setCustomerTab] = useState('login'); // 'login' | 'otp' | 'register' | 'forgot'
  const [merchantTab, setMerchantTab] = useState('login'); // 'login' | 'otp' | 'register' | 'forgot'

  // Live session states
  const [customerUser, setCustomerUser] = useState(() =>
    isCustomerAuthenticated() ? getStoredCustomerUser() : null
  );
  const [merchantUser, setMerchantUser] = useState(() =>
    getMerchantToken() ? getStoredMerchantUser() : null
  );

  // Shared UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Customer Login / OTP / Register / Forgot fields
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [showCustPass, setShowCustPass] = useState(false);
  const [custOtpEmail, setCustOtpEmail] = useState('');
  const [custOtpCode, setCustOtpCode] = useState('');
  const [custOtpSent, setCustOtpSent] = useState(false);
  const [custOtpTimer, setCustOtpTimer] = useState(0);

  const [custRegName, setCustRegName] = useState('');
  const [custRegPhone, setCustRegPhone] = useState('');
  const [custRegEmail, setCustRegEmail] = useState('');
  const [custRegPassword, setCustRegPassword] = useState('');
  const [custRegDistrict, setCustRegDistrict] = useState('Ernakulam');
  const [custRegCity, setCustRegCity] = useState('Kochi');
  const [detectingLoc, setDetectingLoc] = useState(false);

  const [custResetEmail, setCustResetEmail] = useState('');
  const [custResetOtp, setCustResetOtp] = useState('');
  const [custResetPass, setCustResetPass] = useState('');
  const [custResetConfirm, setCustResetConfirm] = useState('');
  const [custResetOtpSent, setCustResetOtpSent] = useState(false);

  // Merchant Login / OTP / Register / Forgot fields
  const [merchEmail, setMerchEmail] = useState('');
  const [merchPassword, setMerchPassword] = useState('');
  const [showMerchPass, setShowMerchPass] = useState(false);
  const [merchOtpEmail, setMerchOtpEmail] = useState('');
  const [merchOtpCode, setMerchOtpCode] = useState('');
  const [merchOtpSent, setMerchOtpSent] = useState(false);
  const [merchOtpTimer, setMerchOtpTimer] = useState(0);

  const [merchForgotEmail, setMerchForgotEmail] = useState('');
  const [merchResetOtp, setMerchResetOtp] = useState('');
  const [merchResetPass, setMerchResetPass] = useState('');
  const [merchResetConfirm, setMerchResetConfirm] = useState('');
  const [merchResetSent, setMerchResetSent] = useState(false);

  const [merchReg, setMerchReg] = useState({
    business_name: '',
    owner_name: '',
    category: 'Retail',
    phone_number: '',
    whatsapp: '',
    email: '',
    password: '',
    confirm_password: '',
    district: 'Kannur',
    city: 'Payyanur',
    address: '',
    service_timing: '09:00 AM - 08:00 PM',
    about: '',
  });
  const [merchPhotos, setMerchPhotos] = useState(['', '', '', '']);
  const [merchVideoUrl, setMerchVideoUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Subscription Package states
  const [subAudience, setSubAudience] = useState('USER');
  const [subPackages, setSubPackages] = useState([]);
  const [activeSubData, setActiveSubData] = useState(null);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subscribingId, setSubscribingId] = useState(null);

  const timerRef = useRef(null);

  const syncSessions = async () => {
    const cAuth = isCustomerAuthenticated();
    if (cAuth) {
      const localC = getStoredCustomerUser();
      setCustomerUser(localC);
      fetchCustomerProfile()
        .then((fresh) => {
          if (fresh) setCustomerUser(fresh);
        })
        .catch(() => {});
      fetchMyActiveSubscriptions()
        .then((subs) => setActiveSubData(subs))
        .catch(() => {});
    } else {
      setCustomerUser(null);
    }
    if (getMerchantToken()) {
      setMerchantUser(getStoredMerchantUser());
    } else {
      setMerchantUser(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccess(promptMessage || '');
    syncSessions();

    if (initialSection === 'customer-login') {
      setSection('customer-auth');
      setCustomerTab('login');
    } else if (initialSection === 'customer-otp') {
      setSection('customer-auth');
      setCustomerTab('otp');
    } else if (initialSection === 'customer-register') {
      setSection('customer-auth');
      setCustomerTab('register');
    } else if (initialSection === 'merchant-login') {
      setSection('merchant-auth');
      setMerchantTab('login');
    } else if (initialSection === 'merchant-register') {
      setSection('merchant-auth');
      setMerchantTab('register');
    } else if (initialSection === 'subscriptions') {
      setSection('subscriptions');
      loadSubscriptionData('USER');
    } else {
      setSection('hub');
    }
  }, [isOpen, initialSection, promptMessage]);

  useEffect(() => {
    const onSessChange = () => {
      setCustomerUser(isCustomerAuthenticated() ? getStoredCustomerUser() : null);
      setMerchantUser(getMerchantToken() ? getStoredMerchantUser() : null);
    };
    window.addEventListener('customer-session-changed', onSessChange);
    window.addEventListener('merchant-session-changed', onSessChange);
    return () => {
      window.removeEventListener('customer-session-changed', onSessChange);
      window.removeEventListener('merchant-session-changed', onSessChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const isSeller = hasActiveSellerSubscription(customerUser, activeSubData);

  const startTimer = (setter) => {
    setter(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadSubscriptionData = async (audience = 'USER') => {
    setLoadingSubs(true);
    setSubAudience(audience);
    try {
      const [pkgs, active] = await Promise.all([
        fetchAdminSubscriptionPackages({ audience, activeOnly: true }).catch(() => []),
        fetchMyActiveSubscriptions().catch(() => null),
      ]);
      setSubPackages(Array.isArray(pkgs) ? pkgs : []);
      setActiveSubData(active);
    } catch (err) {
      setError('Could not load subscription plans.');
    } finally {
      setLoadingSubs(false);
    }
  };

  // ── Customer Auth Handlers (Login ID + Password Only) ────────────────────
  const handleCustomerPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const rawTarget = custEmail.trim();
    if (!rawTarget) {
      setError('Please enter your assigned Login ID (e.g. DAN81493)');
      return;
    }
    if (rawTarget.includes('@')) {
      setError('Email login is not allowed. Please enter your assigned Login ID (e.g. DAN81493) and password.');
      return;
    }
    const target = rawTarget.toUpperCase();
    if (!/^[A-Z0-9_\s-]{3,30}$/.test(target)) {
      setError('Please enter a valid Login ID (e.g. DAN81493)');
      return;
    }
    if (!custPassword.trim()) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    try {
      const res = await customerEmailLogin({ login_id: target, email: target, password: custPassword.trim() });
      const userObj = res.user || res.customer || getStoredCustomerUser();
      await fetchCustomerProfile().catch(() => null);
      setCustomerUser(getStoredCustomerUser() || userObj);
      if (onAuthSuccess) onAuthSuccess(getStoredCustomerUser() || userObj, 'CUSTOMER', res);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid Login ID or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSendOtp = async () => {
    setError('');
    setSuccess('');
    const target = custOtpEmail.trim().toLowerCase();
    if (!target || !target.includes('@')) {
      setError('Please enter a valid registered email address');
      return;
    }
    setLoading(true);
    try {
      const res = await customerSendOTP({ email: target });
      setCustOtpSent(true);
      startTimer(setCustOtpTimer);
      const devNote = res?.dev_otp ? ` (Code: ${res.dev_otp})` : '';
      setSuccess(`6-digit OTP sent to ${target}.${devNote}`);
    } catch (err) {
      setError(err.message || 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!custOtpCode.trim() || custOtpCode.trim().length < 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }
    setLoading(true);
    try {
      const res = await customerVerifyOTP({ email: custOtpEmail.trim(), otp: custOtpCode.trim() });
      const userObj = res.user || res.customer || getStoredCustomerUser();
      await fetchCustomerProfile().catch(() => null);
      setCustomerUser(getStoredCustomerUser() || userObj);
      if (onAuthSuccess) onAuthSuccess(getStoredCustomerUser() || userObj, 'CUSTOMER', res);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectCustomerGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const rawDist = (data?.address?.state_district || data?.address?.county || '').toLowerCase();
            const matchedDist = KERALA_DISTRICTS.find((d) => rawDist.includes(d.toLowerCase()));
            if (matchedDist) setCustRegDistrict(matchedDist);
            const town = data?.address?.city || data?.address?.town || data?.address?.village;
            if (town) setCustRegCity(town);
            setSuccess(`Location detected: ${town || ''}, ${matchedDist || 'Kerala'}`);
          }
        } catch (_) {}
        setDetectingLoc(false);
      },
      () => {
        setDetectingLoc(false);
        setError('Could not detect GPS location. Please choose your district manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleCustomerRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanPhone = custRegPhone.replace(/[^0-9]/g, '');
    if (!custRegName.trim()) return setError('Please enter your full name');
    if (cleanPhone.length < 10) return setError('Please enter a valid 10-digit mobile number');
    if (!custRegPassword || custRegPassword.length < 4) {
      return setError('Password must be at least 4 characters');
    }
    setLoading(true);
    try {
      const res = await customerRegister({
        name: custRegName.trim(),
        phone: cleanPhone,
        email: custRegEmail.trim() || undefined,
        password: custRegPassword.trim(),
        district: custRegDistrict,
        city: custRegCity.trim() || custRegDistrict,
      });
      const userObj = res.user || res.customer || getStoredCustomerUser();
      setCustomerUser(userObj);
      if (onAuthSuccess) onAuthSuccess(userObj, 'CUSTOMER', res);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustSendResetOtp = async () => {
    setError('');
    const target = custResetEmail.trim().toLowerCase();
    if (!target || !target.includes('@')) return setError('Please enter your registered email address');
    setLoading(true);
    try {
      const res = await customerForgotPassword(target);
      setCustResetOtpSent(true);
      const devNote = res?.dev_otp ? ` (Code: ${res.dev_otp})` : '';
      setSuccess(`Reset code sent to ${target}.${devNote}`);
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleCustResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!custResetOtp || custResetOtp.length < 6) return setError('Enter 6-digit OTP code');
    if (!custResetPass || custResetPass.length < 8) return setError('Password must be at least 8 characters');
    if (custResetPass !== custResetConfirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const resetRes = await customerResetPassword({
        email: custResetEmail.trim(),
        otp: custResetOtp.trim(),
        new_password: custResetPass,
      });
      if (resetRes?.login_id) {
        setSuccess(`Password reset! Signing in with ID ${resetRes.login_id}...`);
        const res = await customerEmailLogin({ login_id: resetRes.login_id, password: custResetPass });
        const userObj = res.user || res.customer || getStoredCustomerUser();
        setCustomerUser(userObj);
        if (onAuthSuccess) onAuthSuccess(userObj, 'CUSTOMER', res);
        onClose();
      } else {
        setCustEmail('');
        setCustPassword('');
        setCustomerTab('login');
        setSuccess('Password reset! Please sign in using your assigned Login ID and new password.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // ── Merchant Auth Handlers (Exact Mobile App Logic) ──────────────────────
  const completeMerchantSignIn = (res, fallbackEmail) => {
    const u = res.user || res.merchant || { email: fallbackEmail, name: 'Merchant', role: 'MERCHANT' };
    const enriched = { ...u, role: 'MERCHANT' };
    setMerchantUser(enriched);
    // Also authenticate in AuthContext so /merchant portal route opens immediately
    authContextLogin(enriched, {
      accessToken: res.access_token || res.token,
      refreshToken: res.refresh_token || '',
    });
    if (onAuthSuccess) onAuthSuccess(enriched, 'MERCHANT', res);
    onClose();
    navigate('/merchant');
  };

  const handleMerchantPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const rawTarget = merchEmail.trim();
    if (!rawTarget) return setError('Please enter your Merchant Login ID (e.g. ASH4906)');
    if (rawTarget.includes('@')) {
      return setError('Email login is not allowed. Please enter your Merchant Login ID (e.g. ASH4906) and password.');
    }
    const target = rawTarget.toUpperCase();
    if (!/^[A-Z0-9_\s-]{3,30}$/.test(target)) {
      return setError('Please enter a valid Merchant Login ID (e.g. ASH4906)');
    }
    if (!merchPassword.trim()) return setError('Please enter your password');
    setLoading(true);
    try {
      const res = await merchantEmailLogin({ login_id: target, identifier: target, password: merchPassword.trim() });
      completeMerchantSignIn(res, res?.user?.email || target);
    } catch (err) {
      if (err.passwordSetupRequired || err.code === 'MERCHANT_PASSWORD_NOT_SET') {
        setMerchForgotEmail('');
        setMerchantTab('forgot');
        setError('Password setup required. Enter your registered email to receive an OTP and set your password.');
        return;
      }
      setError(err.message || 'Invalid Merchant Login ID or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleMerchSendOtp = async () => {
    setError('');
    const target = merchOtpEmail.trim().toLowerCase();
    if (!target || !target.includes('@')) return setError('Please enter your registered merchant email');
    setLoading(true);
    try {
      const res = await merchantSendOTP(target);
      setMerchOtpSent(true);
      startTimer(setMerchOtpTimer);
      const devNote = res?.dev_otp ? ` (Code: ${res.dev_otp})` : '';
      setSuccess(`OTP sent to ${target}.${devNote}`);
    } catch (err) {
      setError(err.message || 'Failed to send merchant OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleMerchVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!merchOtpCode.trim() || merchOtpCode.trim().length < 6) {
      return setError('Please enter the 6-digit OTP sent to your email');
    }
    setLoading(true);
    try {
      const res = await merchantVerifyOTP(merchOtpEmail.trim(), merchOtpCode.trim());
      completeMerchantSignIn(res, merchOtpEmail.trim());
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleMerchSendResetOtp = async () => {
    setError('');
    const target = merchForgotEmail.trim().toLowerCase();
    if (!target || !target.includes('@')) return setError('Please enter registered merchant email');
    setLoading(true);
    try {
      const res = await merchantForgotPassword(target);
      setMerchResetSent(true);
      const devNote = res?.dev_otp ? ` (Code: ${res.dev_otp})` : '';
      setSuccess(`Reset OTP sent to ${target}.${devNote}`);
    } catch (err) {
      setError(err.message || 'Failed to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleMerchResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!merchResetOtp || merchResetOtp.length < 6) return setError('Enter 6-digit OTP code');
    if (!merchResetPass || merchResetPass.length < 8) return setError('Password must be at least 8 characters');
    if (merchResetPass !== merchResetConfirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const resetRes = await merchantResetPassword({
        email: merchForgotEmail.trim(),
        otp: merchResetOtp.trim(),
        new_password: merchResetPass,
      });
      if (resetRes?.login_id) {
        setSuccess(`Password set! Signing in with Merchant ID ${resetRes.login_id}...`);
        const res = await merchantEmailLogin({ login_id: resetRes.login_id, identifier: resetRes.login_id, password: merchResetPass });
        completeMerchantSignIn(res, res?.user?.email || merchForgotEmail.trim());
      } else {
        setMerchEmail('');
        setMerchPassword('');
        setMerchantTab('login');
        setSuccess('Password set! Please sign in using your Merchant Login ID and new password.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset merchant password');
    } finally {
      setLoading(false);
    }
  };

  const handleMerchMediaPick = async (type, index, file) => {
    if (!file) return;
    setUploadingMedia(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append(type === 'video' ? 'videos' : 'photos', file);
      const res = await uploadMerchantMedia(fd);
      if (type === 'video') {
        const vid = res?.videos?.[0] || res?.all_urls?.[0];
        if (vid) setMerchVideoUrl(vid);
      } else {
        const photo = res?.photos?.[0] || res?.all_urls?.[0];
        if (photo) {
          setMerchPhotos((prev) => {
            const next = [...prev];
            next[index] = photo;
            return next;
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Media upload failed');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleMerchantRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const storeName = merchReg.business_name.trim();
    const cleanPhone = merchReg.phone_number.replace(/[^0-9]/g, '');
    const cleanEmail = merchReg.email.trim().toLowerCase();

    if (!storeName) return setError('Please enter Business / Shop Name');
    if (cleanPhone.length < 10) return setError('Please enter a valid 10-digit mobile number');
    if (!cleanEmail || !cleanEmail.includes('@')) return setError('Valid Business Email is required');
    if (!merchReg.password || merchReg.password.length < 8) return setError('Password must be at least 8 characters');
    if (merchReg.password !== merchReg.confirm_password) return setError('Passwords do not match');
    if (!merchReg.address.trim()) return setError('Please enter Street Address');

    const validPhotos = merchPhotos.filter((p) => p && p.trim() !== '');
    setLoading(true);
    try {
      await onboardMerchant({
        business_name: storeName,
        name: storeName,
        owner_name: merchReg.owner_name.trim() || 'Owner',
        category: merchReg.category,
        categories: [merchReg.category],
        phone_number: cleanPhone,
        whatsapp: merchReg.whatsapp.trim() || cleanPhone,
        email: cleanEmail,
        password: merchReg.password.trim(),
        state: 'Kerala',
        district: merchReg.district,
        city: merchReg.city.trim() || merchReg.district,
        address: merchReg.address.trim(),
        service_timing: merchReg.service_timing.trim(),
        about: merchReg.about.trim(),
        photos: validPhotos,
        merchant_photos: validPhotos,
        photo_1: validPhotos[0] || null,
        photo_2: validPhotos[1] || null,
        photo_3: validPhotos[2] || null,
        photo_4: validPhotos[3] || null,
        video_url: merchVideoUrl || null,
        merchant_videos: merchVideoUrl ? [merchVideoUrl] : [],
        status: 'PENDING',
      });
      setSuccess(
        'Merchant registered successfully! Your account is saved and pending admin approval. You can sign in once approved.'
      );
      setMerchEmail(cleanEmail);
      setMerchPassword(merchReg.password.trim());
      setMerchantTab('login');
    } catch (err) {
      setError(err.message || 'Merchant registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Subscription Handlers ──────────────────────────────────────────────────
  const handleSubscribePkg = async (pkg) => {
    setError('');
    setSuccess('');
    const targetUser = subAudience === 'MERCHANT' ? (merchantUser || customerUser) : customerUser;
    if (!targetUser) {
      setSection(subAudience === 'MERCHANT' ? 'merchant-auth' : 'customer-auth');
      setError('Please sign in first to purchase this subscription plan.');
      return;
    }
    setSubscribingId(pkg.id);
    try {
      await startCustomerRazorpaySubscription({
        packageItem: pkg,
        customerUser: targetUser,
        audience: subAudience,
        merchantProfileId: subAudience === 'MERCHANT' ? merchantUser?.id : null,
        onSuccess: async () => {
          setSuccess(`✓ Activated ${pkg.name}! You can now create and sell products!`);
          await syncSessions();
          await loadSubscriptionData(subAudience);
        },
        onError: (err) => setError(err?.message || 'Subscription payment failed.'),
        onDismiss: () => setError('Payment cancelled.'),
      });
    } catch (err) {
      setError(err.message || 'Could not start subscription checkout');
    } finally {
      setSubscribingId(null);
    }
  };

  const handleLogoutCustomer = async () => {
    await logoutCustomerSession();
    setCustomerUser(null);
    setActiveSubData(null);
    setSuccess('Signed out of customer account.');
  };

  const handleLogoutMerchant = async () => {
    await logoutMerchantSession();
    setMerchantUser(null);
    setSuccess('Signed out of merchant account.');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 22,
          width: '100%',
          maxWidth: section === 'merchant-auth' && merchantTab === 'register' ? 680 : 480,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Blue Gradient Header (Mobile App Brand Look) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 55%, #1E40AF 100%)',
            color: '#FFFFFF',
            padding: '18px 22px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {section !== 'hub' && (
                <button
                  type="button"
                  onClick={() => {
                    setSection('hub');
                    setError('');
                    setSuccess('');
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#FFFFFF',
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Back to Account"
                >
                  <HiChevronLeft size={18} />
                </button>
              )}
              <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.03em' }}>LOGO APP</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: 'rgba(255,255,255,0.22)',
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                {section === 'merchant-auth'
                  ? 'MERCHANT PORTAL'
                  : section === 'subscriptions'
                  ? 'PLANS & SUBSCRIPTIONS'
                  : 'ACCOUNT'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#FFFFFF',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <HiX size={18} />
            </button>
          </div>

          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>
            {section === 'hub'
              ? customerUser
                ? customerUser.name || 'Customer Account'
                : merchantUser
                ? merchantUser.business_name || 'Merchant Workspace'
                : 'Welcome to Logo App'
              : section === 'customer-auth'
              ? customerTab === 'register'
                ? 'New Customer Registration'
                : customerTab === 'otp'
                ? 'Instant Email OTP Sign In'
                : customerTab === 'forgot'
                ? 'Reset Customer Password'
                : 'Customer Sign In'
              : section === 'merchant-auth'
              ? merchantTab === 'register'
                ? 'Register Your Business Store'
                : merchantTab === 'otp'
                ? 'Merchant OTP Sign In'
                : merchantTab === 'forgot'
                ? 'Reset / Setup Merchant Password'
                : 'Merchant Portal Sign In'
              : 'Seller Plan & Subscriptions'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, opacity: 0.9 }}>
            {section === 'hub'
              ? customerUser
                ? `${customerUser.email || customerUser.phone || ''}`
                : merchantUser
                ? `${merchantUser.email || ''} • Verified Storefront`
                : "Kerala's local store discovery & marketplace platform"
              : section === 'customer-auth'
              ? 'Sign in or register using the same credentials across Mobile App & Web'
              : section === 'merchant-auth'
              ? 'Manage storefront photos, promo video, promotions & wallet'
              : 'Unlock product creation & marketplace selling with ₹500 Seller Plan'}
          </p>
        </div>

        {/* Scrollable Modal Body */}
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <HiExclamationCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#1E40AF',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <HiCheckCircle size={18} style={{ flexShrink: 0, color: '#2563EB' }} />
              <span>{success}</span>
            </div>
          )}

          {/* ════════════ 1. ACCOUNT HUB VIEW (Exact Mobile profile.js) ════════════ */}
          {section === 'hub' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!customerUser && !merchantUser && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSection('customer-auth');
                      setCustomerTab('login');
                      setError('');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 14.5,
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <HiUser size={20} />
                      <span>Customer Sign In / Register</span>
                    </span>
                    <HiChevronRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSection('merchant-auth');
                      setMerchantTab('login');
                      setError('');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: '#F8FAFC',
                      color: '#1E293B',
                      border: '1.5px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 14.5,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <HiShoppingBag size={20} color="#2563EB" />
                      <span>Merchant Sign In / Register Shop</span>
                    </span>
                    <HiChevronRight size={18} color="#64748B" />
                  </button>
                </>
              )}

              {/* Customer Logged In Hub */}
              {customerUser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 8,
                      padding: '10px',
                      background: '#F8FAFC',
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenWishlist) onOpenWishlist();
                        onClose();
                      }}
                      style={hubQuickBtnStyle}
                    >
                      <HiHeart size={18} color="#EF4444" />
                      <span>Saved</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/orders');
                      }}
                      style={hubQuickBtnStyle}
                    >
                      <HiShoppingBag size={18} color="#2563EB" />
                      <span>Orders</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSeller) {
                          onClose();
                          if (onOpenCreateProduct) onOpenCreateProduct();
                          else navigate('/seller');
                        } else {
                          setSection('subscriptions');
                          loadSubscriptionData('USER');
                        }
                      }}
                      style={hubQuickBtnStyle}
                    >
                      <HiPlusCircle size={18} color="#16A34A" />
                      <span>Sell</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogoutCustomer}
                      style={hubQuickBtnStyle}
                    >
                      <HiLogout size={18} color="#64748B" />
                      <span>Log Out</span>
                    </button>
                  </div>

                  {/* Account Menu Items matching Mobile App profile.js */}
                  <AccountMenuRow
                    icon={<HiShoppingBag size={18} color={isSeller ? '#2563EB' : '#64748B'} />}
                    title="My Products & Seller Orders"
                    subtitle={
                      isSeller
                        ? 'Manage your listed items, stock & buyer orders'
                        : 'Unlock product creation & orders (Requires ₹500 Plan)'
                    }
                    badge={isSeller ? 'VERIFIED' : '₹500 PLAN'}
                    badgeBg={isSeller ? '#DCFCE7' : '#FAE8FF'}
                    badgeColor={isSeller ? '#15803D' : '#A21CAF'}
                    onClick={() => {
                      if (isSeller) {
                        onClose();
                        navigate('/seller');
                      } else {
                        setSection('subscriptions');
                        loadSubscriptionData('USER');
                      }
                    }}
                  />

                  <AccountMenuRow
                    icon={<HiPlusCircle size={18} color="#16A34A" />}
                    title="Create / Sell a Product"
                    subtitle={
                      isSeller
                        ? 'List new item on Logo Kerala Marketplace'
                        : 'Only ₹500 Plan subscribers can create products'
                    }
                    badge={isSeller ? 'CREATE' : '₹500 SUB'}
                    badgeBg={isSeller ? '#DBEAFE' : '#FAE8FF'}
                    badgeColor={isSeller ? '#1D4ED8' : '#A21CAF'}
                    onClick={() => {
                      if (isSeller) {
                        onClose();
                        if (onOpenCreateProduct) {
                          onOpenCreateProduct();
                        } else {
                          navigate('/marketplace');
                        }
                      } else {
                        setSection('subscriptions');
                        loadSubscriptionData('USER');
                      }
                    }}
                  />

                  <AccountMenuRow
                    icon={<HiSparkles size={18} color="#C026D3" />}
                    title="Seller Plan & Subscriptions"
                    subtitle={
                      isSeller
                        ? 'Your ₹500 Seller Plan is Active'
                        : 'Subscribe ₹500/mo to unlock selling products'
                    }
                    badge="₹500/MO"
                    badgeBg="#FDF4FF"
                    badgeColor="#C026D3"
                    onClick={() => {
                      setSection('subscriptions');
                      loadSubscriptionData('USER');
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleLogoutCustomer}
                    style={{
                      marginTop: 4,
                      padding: '11px',
                      borderRadius: 12,
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      fontWeight: 700,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <HiLogout size={16} />
                    <span>Log Out of Customer Account</span>
                  </button>
                </div>
              )}

              {/* Merchant Logged In Hub */}
              {merchantUser && !customerUser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <AccountMenuRow
                    icon={<HiShoppingBag size={18} color="#2563EB" />}
                    title="Open Merchant Portal"
                    subtitle="Manage storefront, photos, videos & promotions"
                    badge="OPEN"
                    badgeBg="#DBEAFE"
                    badgeColor="#1D4ED8"
                    onClick={() => {
                      onClose();
                      navigate('/merchant');
                    }}
                  />
                  <AccountMenuRow
                    icon={<HiSparkles size={18} color="#D97706" />}
                    title="Merchant Subscriptions"
                    subtitle="Promote store with banner ads & visibility"
                    badge="PLANS"
                    badgeBg="#FEF3C7"
                    badgeColor="#B45309"
                    onClick={() => {
                      setSection('subscriptions');
                      loadSubscriptionData('MERCHANT');
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleLogoutMerchant}
                    style={{
                      marginTop: 4,
                      padding: '11px',
                      borderRadius: 12,
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      fontWeight: 700,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <HiLogout size={16} />
                    <span>Log Out of Merchant Account</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════ 2. CUSTOMER AUTH VIEW (Password / OTP / New User) ════════════ */}
          {section === 'customer-auth' && (
            <div>
              {customerTab !== 'forgot' && (
                <div style={tabBarStyle}>
                  <button
                    type="button"
                    style={tabBtnStyle(customerTab === 'login')}
                    onClick={() => {
                      setCustomerTab('login');
                      setError('');
                      setSuccess('');
                    }}
                  >
                    <HiKey size={14} /> Password
                  </button>
                  <button
                    type="button"
                    style={tabBtnStyle(customerTab === 'otp')}
                    onClick={() => {
                      setCustomerTab('otp');
                      setError('');
                      setSuccess('');
                    }}
                  >
                    <HiChatAlt2 size={14} /> OTP Login
                  </button>
                  <button
                    type="button"
                    style={tabBtnStyle(customerTab === 'register')}
                    onClick={() => {
                      setCustomerTab('register');
                      setError('');
                      setSuccess('');
                    }}
                  >
                    <HiUserAdd size={14} /> New User
                  </button>
                </div>
              )}

              {customerTab === 'login' && (
                <form onSubmit={handleCustomerPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Login ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your Login ID (e.g. DAN81493)"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCustPass ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        value={custPassword}
                        onChange={(e) => setCustPassword(e.target.value)}
                        style={{ ...inputStyle, paddingRight: 38 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustPass(!showCustPass)}
                        style={eyeBtnStyle}
                      >
                        {showCustPass ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCustResetEmail(custEmail);
                        setCustomerTab('forgot');
                        setError('');
                      }}
                      style={linkBtnStyle}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button type="submit" disabled={loading} style={primaryBtnStyle}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustOtpEmail(custEmail);
                      setCustomerTab('otp');
                    }}
                    style={outlineBlueBtnStyle}
                  >
                    ✉️ Sign In with Email OTP
                  </button>
                </form>
              )}

              {customerTab === 'otp' && (
                <form onSubmit={handleCustomerVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Registered Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={custOtpEmail}
                      onChange={(e) => setCustOtpEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  {!custOtpSent ? (
                    <button type="button" onClick={handleCustomerSendOtp} disabled={loading} style={primaryBtnStyle}>
                      {loading ? 'Sending OTP...' : 'Send 6-Digit OTP'}
                    </button>
                  ) : (
                    <>
                      <div>
                        <label style={labelStyle}>6-Digit OTP Code *</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          placeholder="Enter 6-digit OTP"
                          value={custOtpCode}
                          onChange={(e) => setCustOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          style={{ ...inputStyle, letterSpacing: '0.25em', fontWeight: 800, textAlign: 'center' }}
                        />
                      </div>
                      <button type="submit" disabled={loading} style={primaryBtnStyle}>
                        {loading ? 'Verifying...' : 'Verify & Sign In'}
                      </button>
                      <button
                        type="button"
                        disabled={custOtpTimer > 0}
                        onClick={handleCustomerSendOtp}
                        style={linkBtnStyle}
                      >
                        {custOtpTimer > 0 ? `Resend OTP in ${custOtpTimer}s` : 'Resend OTP'}
                      </button>
                    </>
                  )}
                </form>
              )}

              {customerTab === 'register' && (
                <form onSubmit={handleCustomerRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Nair"
                      value={custRegName}
                      onChange={(e) => setCustRegName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Mobile / WhatsApp Number *</label>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="10-digit mobile number"
                      value={custRegPhone}
                      onChange={(e) => setCustRegPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address (Recommended)</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={custRegEmail}
                      onChange={(e) => setCustRegEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Password *</label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      placeholder="Minimum 4 characters"
                      value={custRegPassword}
                      onChange={(e) => setCustRegPassword(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={labelStyle}>District *</label>
                      <select
                        value={custRegDistrict}
                        onChange={(e) => {
                          const d = e.target.value;
                          setCustRegDistrict(d);
                          setCustRegCity((DISTRICT_TOWNS_MAP[d] && DISTRICT_TOWNS_MAP[d][0]) || d);
                        }}
                        style={inputStyle}
                      >
                        {KERALA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>City / Town *</label>
                      <input
                        type="text"
                        required
                        value={custRegCity}
                        onChange={(e) => setCustRegCity(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectCustomerGPS}
                    disabled={detectingLoc}
                    style={{
                      ...outlineBlueBtnStyle,
                      padding: '8px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <HiLocationMarker size={15} />
                    <span>{detectingLoc ? 'Detecting GPS...' : 'Auto-Detect GPS Location'}</span>
                  </button>
                  <button type="submit" disabled={loading} style={primaryBtnStyle}>
                    {loading ? 'Creating Account...' : 'Create Customer Account & Sign In'}
                  </button>
                </form>
              )}

              {customerTab === 'forgot' && (
                <form onSubmit={handleCustResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Registered Email *</label>
                    <input
                      type="email"
                      required
                      value={custResetEmail}
                      onChange={(e) => setCustResetEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  {!custResetOtpSent ? (
                    <button type="button" onClick={handleCustSendResetOtp} disabled={loading} style={primaryBtnStyle}>
                      {loading ? 'Sending...' : 'Send Reset OTP'}
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="6-digit OTP"
                        value={custResetOtp}
                        onChange={(e) => setCustResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        style={inputStyle}
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="New Password (min 8 chars)"
                        value={custResetPass}
                        onChange={(e) => setCustResetPass(e.target.value)}
                        style={inputStyle}
                      />
                      <input
                        type="password"
                        required
                        placeholder="Confirm New Password"
                        value={custResetConfirm}
                        onChange={(e) => setCustResetConfirm(e.target.value)}
                        style={inputStyle}
                      />
                      <button type="submit" disabled={loading} style={primaryBtnStyle}>
                        {loading ? 'Updating...' : 'Reset Password & Sign In'}
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => setCustomerTab('login')} style={linkBtnStyle}>
                    ← Back to Sign In
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ════════════ 3. MERCHANT AUTH VIEW (Password / OTP / Register Shop) ════════════ */}
          {section === 'merchant-auth' && (
            <div>
              {merchantTab !== 'forgot' && (
                <div style={tabBarStyle}>
                  <button
                    type="button"
                    style={tabBtnStyle(merchantTab === 'login')}
                    onClick={() => {
                      setMerchantTab('login');
                      setError('');
                    }}
                  >
                    <HiKey size={14} /> Password
                  </button>
                  <button
                    type="button"
                    style={tabBtnStyle(merchantTab === 'otp')}
                    onClick={() => {
                      setMerchantTab('otp');
                      setError('');
                    }}
                  >
                    <HiChatAlt2 size={14} /> OTP Login
                  </button>
                  <button
                    type="button"
                    style={tabBtnStyle(merchantTab === 'register')}
                    onClick={() => {
                      setMerchantTab('register');
                      setError('');
                    }}
                  >
                    <HiUserAdd size={14} /> Register Shop
                  </button>
                </div>
              )}

              {merchantTab === 'login' && (
                <form onSubmit={handleMerchantPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Merchant Login ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your Merchant Login ID (e.g. ASH4906)"
                      value={merchEmail}
                      onChange={(e) => setMerchEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showMerchPass ? 'text' : 'password'}
                        required
                        placeholder="Enter merchant password"
                        value={merchPassword}
                        onChange={(e) => setMerchPassword(e.target.value)}
                        style={{ ...inputStyle, paddingRight: 38 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowMerchPass(!showMerchPass)}
                        style={eyeBtnStyle}
                      >
                        {showMerchPass ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setMerchForgotEmail(merchEmail);
                        setMerchantTab('forgot');
                        setError('');
                      }}
                      style={linkBtnStyle}
                    >
                      Forgot / Setup Password?
                    </button>
                  </div>
                  <button type="submit" disabled={loading} style={primaryBtnStyle}>
                    {loading ? 'Signing In...' : 'Sign In to Merchant Portal'}
                  </button>
                </form>
              )}

              {merchantTab === 'otp' && (
                <form onSubmit={handleMerchVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Registered Merchant Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="merchant@business.com"
                      value={merchOtpEmail}
                      onChange={(e) => setMerchOtpEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  {!merchOtpSent ? (
                    <button type="button" onClick={handleMerchSendOtp} disabled={loading} style={primaryBtnStyle}>
                      {loading ? 'Sending OTP...' : 'Send Merchant Login OTP'}
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="Enter 6-digit OTP"
                        value={merchOtpCode}
                        onChange={(e) => setMerchOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        style={{ ...inputStyle, letterSpacing: '0.25em', fontWeight: 800, textAlign: 'center' }}
                      />
                      <button type="submit" disabled={loading} style={primaryBtnStyle}>
                        {loading ? 'Verifying...' : 'Verify & Enter Portal'}
                      </button>
                      <button
                        type="button"
                        disabled={merchOtpTimer > 0}
                        onClick={handleMerchSendOtp}
                        style={linkBtnStyle}
                      >
                        {merchOtpTimer > 0 ? `Resend in ${merchOtpTimer}s` : 'Resend OTP'}
                      </button>
                    </>
                  )}
                </form>
              )}

              {merchantTab === 'register' && (
                <form onSubmit={handleMerchantRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Business / Shop Name *</label>
                      <input
                        type="text"
                        required
                        value={merchReg.business_name}
                        onChange={(e) => setMerchReg({ ...merchReg, business_name: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Owner Name</label>
                      <input
                        type="text"
                        value={merchReg.owner_name}
                        onChange={(e) => setMerchReg({ ...merchReg, owner_name: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Category *</label>
                      <select
                        value={merchReg.category}
                        onChange={(e) => setMerchReg({ ...merchReg, category: e.target.value })}
                        style={inputStyle}
                      >
                        {MERCHANT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={merchReg.phone_number}
                        onChange={(e) => setMerchReg({ ...merchReg, phone_number: e.target.value.replace(/[^0-9]/g, '') })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Business Email *</label>
                      <input
                        type="email"
                        required
                        value={merchReg.email}
                        onChange={(e) => setMerchReg({ ...merchReg, email: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>District *</label>
                      <select
                        value={merchReg.district}
                        onChange={(e) => setMerchReg({ ...merchReg, district: e.target.value })}
                        style={inputStyle}
                      >
                        {KERALA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>City / Town *</label>
                      <input
                        type="text"
                        required
                        value={merchReg.city}
                        onChange={(e) => setMerchReg({ ...merchReg, city: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Working Hours</label>
                      <input
                        type="text"
                        value={merchReg.service_timing}
                        onChange={(e) => setMerchReg({ ...merchReg, service_timing: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Street Address *</label>
                    <input
                      type="text"
                      required
                      value={merchReg.address}
                      onChange={(e) => setMerchReg({ ...merchReg, address: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Password (min 8 chars) *</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={merchReg.password}
                        onChange={(e) => setMerchReg({ ...merchReg, password: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Confirm Password *</label>
                      <input
                        type="password"
                        required
                        value={merchReg.confirm_password}
                        onChange={(e) => setMerchReg({ ...merchReg, confirm_password: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Up to 4 Storefront Photos + Promo Video Upload */}
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HiPhotograph size={16} color="#2563EB" /> Storefront Photos (Up to 4) &amp; Promo Video
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
                      {[0, 1, 2, 3].map((i) => (
                        <label
                          key={i}
                          style={{
                            border: '1.5px dashed #CBD5E1',
                            borderRadius: 8,
                            padding: 6,
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: '#FFFFFF',
                            fontSize: 11,
                          }}
                        >
                          {merchPhotos[i] ? (
                            <img
                              src={merchPhotos[i]}
                              alt={`Shop ${i + 1}`}
                              style={{ width: '100%', height: 48, objectFit: 'cover', borderRadius: 4 }}
                            />
                          ) : (
                            <span style={{ color: '#64748B', fontWeight: 600 }}>+ Photo {i + 1}</span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleMerchMediaPick('photo', i, e.target.files?.[0])}
                          />
                        </label>
                      ))}
                    </div>

                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: merchVideoUrl ? '#DBEAFE' : '#EFF6FF',
                        color: '#1D4ED8',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <HiVideoCamera size={16} />
                      <span>{uploadingMedia ? 'Uploading...' : merchVideoUrl ? 'Promo Video Added ✓' : 'Upload Promo Video'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleMerchMediaPick('video', 0, e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading || uploadingMedia} style={primaryBtnStyle}>
                    {loading ? 'Submitting Shop...' : 'Register Business Account'}
                  </button>
                </form>
              )}

              {merchantTab === 'forgot' && (
                <form onSubmit={handleMerchResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="email"
                    required
                    placeholder="Registered Merchant Email"
                    value={merchForgotEmail}
                    onChange={(e) => setMerchForgotEmail(e.target.value)}
                    style={inputStyle}
                  />
                  {!merchResetSent ? (
                    <button type="button" onClick={handleMerchSendResetOtp} disabled={loading} style={primaryBtnStyle}>
                      {loading ? 'Sending...' : 'Send Verification OTP'}
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="6-digit OTP"
                        value={merchResetOtp}
                        onChange={(e) => setMerchResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        style={inputStyle}
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="New Password (min 8 chars)"
                        value={merchResetPass}
                        onChange={(e) => setMerchResetPass(e.target.value)}
                        style={inputStyle}
                      />
                      <input
                        type="password"
                        required
                        placeholder="Confirm Password"
                        value={merchResetConfirm}
                        onChange={(e) => setMerchResetConfirm(e.target.value)}
                        style={inputStyle}
                      />
                      <button type="submit" disabled={loading} style={primaryBtnStyle}>
                        {loading ? 'Saving...' : 'Set Password & Sign In'}
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => setMerchantTab('login')} style={linkBtnStyle}>
                    ← Back to Sign In
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ════════════ 4. SUBSCRIPTIONS VIEW (₹500 Seller Plan & Packages) ════════════ */}
          {section === 'subscriptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={tabBarStyle}>
                <button
                  type="button"
                  style={tabBtnStyle(subAudience === 'USER')}
                  onClick={() => loadSubscriptionData('USER')}
                >
                  Customer / Seller Plans
                </button>
                <button
                  type="button"
                  style={tabBtnStyle(subAudience === 'MERCHANT')}
                  onClick={() => loadSubscriptionData('MERCHANT')}
                >
                  Merchant Business Plans
                </button>
              </div>

              {loadingSubs ? (
                <p style={{ textAlign: 'center', color: '#64748B', fontSize: 13 }}>Loading official plans...</p>
              ) : (
                <>
                  {subPackages.length === 0 ? (
                    <div
                      style={{
                        border: '1.5px solid #DDD6FE',
                        background: '#FAF5FF',
                        borderRadius: 14,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#581C87' }}>
                          Verified Seller Plan
                        </h4>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#7E22CE' }}>₹500 / mo</span>
                      </div>
                      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#6B21A8' }}>
                        Only customers with an active ₹500 Seller Plan subscription can create and sell products on the Logo Kerala Marketplace.
                      </p>
                      <button
                        type="button"
                        disabled={subscribingId === 'seller-500'}
                        onClick={() =>
                          handleSubscribePkg({
                            id: 1,
                            name: '₹500 Seller Plan',
                            price: 500,
                          })
                        }
                        style={{
                          ...primaryBtnStyle,
                          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                        }}
                      >
                        <HiCreditCard size={16} />
                        <span>{subscribingId === 'seller-500' ? 'Processing...' : 'Subscribe Now for ₹500'}</span>
                      </button>
                    </div>
                  ) : (
                    subPackages.map((pkg) => {
                      const activeList =
                        subAudience === 'MERCHANT'
                          ? activeSubData?.merchant_subscriptions || []
                          : activeSubData?.user_subscriptions || activeSubData?.subscriptions || [];
                      const activeSub = activeList.find(
                        (s) => String(s.package_id || s.package?.id) === String(pkg.id)
                      );
                      return (
                        <div
                          key={pkg.id}
                          style={{
                            border: activeSub ? '2px solid #2563EB' : '1px solid #E2E8F0',
                            background: activeSub ? '#EFF6FF' : '#FFFFFF',
                            borderRadius: 14,
                            padding: 14,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <strong style={{ fontSize: 15, color: '#0F172A' }}>{pkg.name}</strong>
                            <span style={{ fontWeight: 900, fontSize: 16, color: '#2563EB' }}>
                              ₹{Number(pkg.price || 500)}
                            </span>
                          </div>
                          {pkg.description && (
                            <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#475569' }}>{pkg.description}</p>
                          )}
                          {activeSub ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <HiShieldCheck size={16} /> Active Plan
                              </span>
                              <button
                                type="button"
                                onClick={async () => {
                                  await cancelMySubscription(activeSub.id, subAudience);
                                  await syncSessions();
                                  await loadSubscriptionData(subAudience);
                                }}
                                style={{
                                  border: '1px solid #FCA5A5',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  borderRadius: 6,
                                  padding: '4px 10px',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={subscribingId === pkg.id}
                              onClick={() => handleSubscribePkg(pkg)}
                              style={primaryBtnStyle}
                            >
                              {subscribingId === pkg.id ? 'Processing...' : `Subscribe ₹${Number(pkg.price || 500)}`}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountMenuRow({ icon, title, subtitle, badge, badgeBg, badgeColor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{title}</div>
          <div style={{ fontSize: 11.5, color: '#64748B' }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              background: badgeBg || '#EFF6FF',
              color: badgeColor || '#2563EB',
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            {badge}
          </span>
        )}
        <HiChevronRight size={16} color="#94A3B8" />
      </div>
    </button>
  );
}

const tabBarStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 6,
  background: '#F1F5F9',
  padding: 4,
  borderRadius: 10,
  marginBottom: 14,
};

const tabBtnStyle = (active) => ({
  border: 'none',
  borderRadius: 8,
  padding: '8px 6px',
  background: active ? '#2563EB' : 'transparent',
  color: active ? '#FFFFFF' : '#334155',
  fontWeight: 700,
  fontSize: 12,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
});

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 4,
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid #CBD5E1',
  fontSize: 13.5,
  color: '#0F172A',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#FFFFFF',
};

const primaryBtnStyle = {
  width: '100%',
  padding: '11px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#2563EB',
  color: '#FFFFFF',
  fontSize: 13.5,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

const outlineBlueBtnStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1.5px solid #3B82F6',
  background: '#EFF6FF',
  color: '#1D4ED8',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#2563EB',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
};

const eyeBtnStyle = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: '#64748B',
  cursor: 'pointer',
};

const hubQuickBtnStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: '6px 4px',
  background: '#FFFFFF',
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 700,
  color: '#334155',
};
