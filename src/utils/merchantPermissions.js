export const MERCHANT_PERMISSION_GROUPS = [
  'Profile Media',
  'Store Advertisements',
  'Products & Selling',
  'Platform Ad Placements',
];

export const MERCHANT_PERMISSION_ITEMS = [
  {
    key: 'merchant_profile_photos',
    label: 'Store Profile Photos',
    group: 'Profile Media',
    description: 'Upload and update up to 4 shop gallery photos on Web & Mobile App',
  },
  {
    key: 'merchant_profile_video',
    label: 'Store Tour & Promo Video',
    group: 'Profile Media',
    description: 'Upload Store Tour & Promo Video shown in merchant header gallery',
  },
  {
    key: 'merchant_store_ad',
    label: 'Store Page Ads (Image & Text)',
    group: 'Store Advertisements',
    description: 'Create and publish Image Banner and Text with Background ads inside store page',
  },
  {
    key: 'merchant_store_video_ad',
    label: 'Store Video Advertisements',
    group: 'Store Advertisements',
    description: 'Upload and publish Video Ads inside store advertisements studio',
  },
  {
    key: 'merchant_product_section',
    label: 'Product Selling & Storefront Orders',
    group: 'Products & Selling',
    description: 'Unlock My Products, Sell / Post an Ad, Customer Orders & Dispatched tabs',
  },
  {
    key: 'ad_home_top',
    label: 'Hero / Home Top Banner Ad',
    group: 'Platform Ad Placements',
    placement: 'Home Top',
    description: 'Publish banner ads in the Hero / Home Top slider (1920×600)',
  },
  {
    key: 'ad_home_middle',
    label: 'Home Middle Showcase Ad',
    group: 'Platform Ad Placements',
    placement: 'Home Middle',
    description: 'Publish ads in the Home Middle Showcase banner slider',
  },
  {
    key: 'ad_above_footer',
    label: 'Above Footer / Footer Strip Ad',
    group: 'Platform Ad Placements',
    placement: 'Above Footer',
    description: 'Publish ads in the Above Footer / Footer Strip banner slider',
  },
  {
    key: 'ad_featured_offers',
    label: 'Featured Offers / Category Top Ad',
    group: 'Platform Ad Placements',
    placement: 'Featured Offers',
    description: 'Publish ads in Featured Offers & Category Top placements',
  },
  {
    key: 'ad_special_deals',
    label: 'Special Deals / Feed / Popup Ad',
    group: 'Platform Ad Placements',
    placement: 'Special Offer',
    description: 'Publish ads in Special Deals, Moving Text, In-Between Feed, or Popup',
  },
  {
    key: 'ad_business_network',
    label: 'Business Network Poster Ad',
    group: 'Platform Ad Placements',
    placement: 'Business Network',
    description: 'Publish poster ads in the Business Network showcase',
  },
  {
    key: 'ad_square_poster',
    label: 'Square Poster & Product Ad',
    group: 'Platform Ad Placements',
    placement: 'Square Poster',
    description: 'Publish Square Poster & Product Section showcase ads',
  },
];

export const MERCHANT_PERMISSION_KEYS = MERCHANT_PERMISSION_ITEMS.map((item) => item.key);

const LEGACY_AD_KEYS = [
  'merchant_store_ad',
  'merchant_store_video_ad',
  'ad_home_top',
  'ad_home_middle',
  'ad_above_footer',
  'ad_featured_offers',
  'ad_special_deals',
  'ad_business_network',
  'ad_square_poster',
];

export function resolvePackageMerchantGrants(pkgOrGrants) {
  const raw =
    pkgOrGrants && typeof pkgOrGrants === 'object' && 'grants' in pkgOrGrants
      ? pkgOrGrants.grants || {}
      : pkgOrGrants || {};
  const resolved = {};
  MERCHANT_PERMISSION_KEYS.forEach((k) => {
    resolved[k] = false;
  });
  const hasGranular = Boolean(raw._granular) || MERCHANT_PERMISSION_KEYS.some((k) => k in raw);
  if (hasGranular) {
    MERCHANT_PERMISSION_KEYS.forEach((k) => {
      resolved[k] = Boolean(raw[k]);
    });
    if (raw.can_add_photos) resolved.merchant_profile_photos = true;
    if (raw.can_add_videos) resolved.merchant_profile_video = true;
    if (raw.can_sell_products) resolved.merchant_product_section = true;
    return resolved;
  }
  if (raw.can_add_photos) resolved.merchant_profile_photos = true;
  if (raw.can_add_videos) resolved.merchant_profile_video = true;
  if (raw.can_sell_products) resolved.merchant_product_section = true;
  if (raw.can_add_detail_page_ad) {
    resolved.merchant_store_ad = true;
    resolved.merchant_store_video_ad = true;
  }
  if (raw.can_promote_landing) {
    LEGACY_AD_KEYS.filter((k) => k.startsWith('ad_')).forEach((k) => {
      resolved[k] = true;
    });
  }
  if (raw.can_create_promotions) {
    LEGACY_AD_KEYS.forEach((k) => {
      resolved[k] = true;
    });
  }
  return resolved;
}

export function buildEmptyMerchantGrants(defaultValue = false) {
  const obj = { _granular: true };
  MERCHANT_PERMISSION_KEYS.forEach((k) => {
    obj[k] = Boolean(defaultValue);
  });
  return obj;
}

export function countEnabledMerchantGrants(grants) {
  const resolved = resolvePackageMerchantGrants(grants);
  return MERCHANT_PERMISSION_KEYS.filter((k) => resolved[k]).length;
}

export function getUnlockedPermissionItems(pkg) {
  const resolved = resolvePackageMerchantGrants(pkg);
  return MERCHANT_PERMISSION_ITEMS.filter((item) => resolved[item.key]);
}

export function mergeMerchantGrants(activeSubData, selectedShop, userSubData) {
  const merged = {};
  MERCHANT_PERMISSION_KEYS.forEach((k) => {
    merged[k] = false;
  });
  const sources = [
    activeSubData?.merchant_grants,
    selectedShop?.merchant_grants,
    userSubData?.merchant_grants,
  ];
  let foundAnyGrantMap = false;
  sources.forEach((src) => {
    if (src && typeof src === 'object' && Object.keys(src).length > 0) {
      foundAnyGrantMap = true;
      MERCHANT_PERMISSION_KEYS.forEach((k) => {
        if (src[k]) merged[k] = true;
      });
    }
  });
  if (activeSubData?.can_sell_products || userSubData?.can_sell_products) {
    merged.merchant_product_section = true;
  }
  return merged;
}

export function hasAnyAdGrant(grants) {
  if (!grants) return false;
  return LEGACY_AD_KEYS.some((k) => Boolean(grants[k]));
}

export function getRequiredAdPermissionKey(placement = 'Merchant Store', mediaType = 'image') {
  const p = String(placement || '').trim().toLowerCase();
  const m = String(mediaType || 'image').trim().toLowerCase();
  if (!p || p === 'merchant store') {
    return m === 'video' ? 'merchant_store_video_ad' : 'merchant_store_ad';
  }
  if (p.includes('home top') || p.includes('hero')) return 'ad_home_top';
  if (p.includes('home middle') || p.includes('middle banner')) return 'ad_home_middle';
  if (p.includes('footer')) return 'ad_above_footer';
  if (p.includes('featured') || p.includes('category')) return 'ad_featured_offers';
  if (p.includes('special') || p.includes('moving') || p.includes('in-between') || p.includes('popup')) {
    return 'ad_special_deals';
  }
  if (p.includes('business network')) return 'ad_business_network';
  if (p.includes('square') || p.includes('product section')) return 'ad_square_poster';
  return 'merchant_store_ad';
}
