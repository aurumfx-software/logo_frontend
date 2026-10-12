/**
 * Advanced Fuzzy Search & Semantic Relevance Engine for Logo Kerala
 * Handles:
 *  - Spelling mistakes / typos (e.g. "resturant", "hosptial", "bakry", "supermarkt")
 *  - Category synonyms & relative keywords (e.g. "hotel" -> restaurant/food, "doctor" -> hospital/clinic)
 *  - Location aliases & Kerala district / town mappings (e.g. "calicut" -> Kozhikode, "cochin" -> Kochi/Ernakulam)
 *  - Multi-word queries with location + category intent (e.g. "kannur resturant", "kochi clinic")
 *  - Dynamic ranking by relevance score
 */

// 1. FAST LEVENSHTEIN DISTANCE
export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a || !a.length) return (b || '').length;
  if (!b || !b.length) return a.length;

  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  if (s1 === s2) return 0;

  const row = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s1.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= s2.length; j++) {
      const temp = row[j];
      if (s1[i - 1] === s2[j - 1]) {
        row[j] = prev;
      } else {
        row[j] = Math.min(prev, row[j - 1], row[j]) + 1;
      }
      prev = temp;
    }
  }
  return row[s2.length];
}

// 2. STRING CLEANING & TOKENIZING
export function cleanTokens(str) {
  if (!str) return [];
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// 3. KERALA DISTRICTS & REGIONAL LOCATION ALIASES
export const KERALA_LOCATION_DICTIONARY = {
  kozhikode: {
    district: 'kozhikode',
    canonical: 'Kozhikode',
    aliases: [
      'kozhikode', 'kozhikod', 'kozhikkode', 'calicut', 'clt', 'sm street',
      'mavoor', 'mavoor road', 'mananchira', 'feroke', 'vadakara', 'vatakara',
      'koyilandy', 'ramanattukara', 'balussery'
    ],
  },
  ernakulam: {
    district: 'ernakulam',
    canonical: 'Ernakulam (Kochi)',
    aliases: [
      'ernakulam', 'ernaklam', 'ernkulam', 'kochi', 'cochin', 'kochii',
      'edappally', 'palarivattom', 'kaloor', 'aluva', 'aluvva', 'angamaly',
      'fort kochi', 'vyttila', 'kakkanad', 'tripunithura', 'kadavanthra',
      'panampilly', 'marine drive', 'thevara', 'kalamassery'
    ],
  },
  thiruvananthapuram: {
    district: 'thiruvananthapuram',
    canonical: 'Thiruvananthapuram',
    aliases: [
      'thiruvananthapuram', 'thiruvanandapuram', 'trivandrum', 'trivandram',
      'tvm', 'kazhakkoottam', 'technopark', 'pattom', 'kovalam', 'varkala',
      'attingal', 'neyyattinkara', 'statue', 'palayam', 'thampanoor'
    ],
  },
  kannur: {
    district: 'kannur',
    canonical: 'Kannur',
    aliases: [
      'kannur', 'cannanore', 'payyanur', 'payyannur', 'payannur', 'thalassery',
      'tellicherry', 'taliparamba', 'mattannur', 'iritty', 'peringome',
      'koothuparamba', 'pilathara'
    ],
  },
  thrissur: {
    district: 'thrissur',
    canonical: 'Thrissur',
    aliases: [
      'thrissur', 'trichur', 'trissur', 'thrissr', 'thrisur', 'guruvayur',
      'chalakudy', 'kodungallur', 'irinjalakuda', 'kunnamkulam', 'wadakkanchery'
    ],
  },
  malappuram: {
    district: 'malappuram',
    canonical: 'Malappuram',
    aliases: [
      'malappuram', 'malapuram', 'mlp', 'manjeri', 'perinthalmanna', 'tirur',
      'kottakkal', 'ponnani', 'nilambur', 'kondotty', 'valanchery', 'edapal'
    ],
  },
  kollam: {
    district: 'kollam',
    canonical: 'Kollam',
    aliases: [
      'kollam', 'quilon', 'karunagappally', 'kottarakkara', 'punalur', 'paravur',
      'chathannoor', 'kundara'
    ],
  },
  alappuzha: {
    district: 'alappuzha',
    canonical: 'Alappuzha',
    aliases: [
      'alappuzha', 'alapuzha', 'alleppey', 'alleppy', 'alp', 'kayamkulam',
      'cherthala', 'mavelikkara', 'haripad', 'ambalappuzha'
    ],
  },
  palakkad: {
    district: 'palakkad',
    canonical: 'Palakkad',
    aliases: [
      'palakkad', 'palghat', 'ottapalam', 'shoranur', 'mannarkkad', 'chittur',
      'alathur', 'cherpulassery'
    ],
  },
  kottayam: {
    district: 'kottayam',
    canonical: 'Kottayam',
    aliases: [
      'kottayam', 'ktm', 'changanassery', 'pala', 'ettumanoor', 'vaikom',
      'kanjirappally', 'kottayam town'
    ],
  },
  kasaragod: {
    district: 'kasaragod',
    canonical: 'Kasaragod',
    aliases: [
      'kasaragod', 'kasargod', 'kasargode', 'ksd', 'kanhangad', 'bekal',
      'nileshwar', 'trikaripur', 'uppala', 'manjeshwar'
    ],
  },
  wayanad: {
    district: 'wayanad',
    canonical: 'Wayanad',
    aliases: [
      'wayanad', 'waynad', 'kalpetta', 'sulthan bathery', 'bathery',
      'mananthavady', 'vythiri', 'meppadi'
    ],
  },
  pathanamthitta: {
    district: 'pathanamthitta',
    canonical: 'Pathanamthitta',
    aliases: [
      'pathanamthitta', 'pathanamtitta', 'pta', 'adoor', 'thiruvalla', 'ranni',
      'pandalam', 'kozhencherry'
    ],
  },
  idukki: {
    district: 'idukki',
    canonical: 'Idukki',
    aliases: [
      'idukki', 'iduki', 'munnar', 'thodupuzha', 'kattappana', 'adimali',
      'nedumkandam', 'peermade'
    ],
  },
};

// 4. CATEGORY SYNONYMS & RELATIVE KEYWORD DICTIONARY
export const CATEGORY_SYNONYMS_DICTIONARY = [
  {
    canonical: 'Food & Dining',
    categories: ['Food & Dining', 'Restaurants', 'Food', 'Cafe', 'Dining'],
    keywords: [
      'restaurant', 'resturant', 'restraunt', 'restarant', 'restrant', 'restuarant',
      'hotel', 'hotl', 'cafe', 'kafe', 'coffee', 'tea', 'chai', 'bakery', 'bakry',
      'bakeri', 'bake', 'bakes', 'dining', 'food', 'foodie', 'biriyani', 'biriyaani',
      'briyani', 'parotta', 'porotta', 'juice', 'shakes', 'shawarma', 'burger',
      'pizza', 'meals', 'mess', 'fast food', 'snacks', 'ice cream', 'catering',
      'canteen', 'tiffin', 'dosa', 'kulfi', 'sweets', 'dessert', 'chicking', 'al faham'
    ],
  },
  {
    canonical: 'Healthcare & Wellness',
    categories: ['Healthcare & Wellness', 'Hospital', 'Medical', 'Clinic'],
    keywords: [
      'hospital', 'hosptial', 'hospitl', 'hospitol', 'hsptl', 'hspital', 'doctor',
      'dr', 'clinic', 'clinc', 'clinick', 'medical', 'medicals', 'medicine', 'medicin',
      'pharmacy', 'pharamcy', 'chemist', 'dental', 'dentist', 'eye', 'opticals',
      'opticians', 'ayurveda', 'ayurvedic', 'homeo', 'homeopathy', 'lab', 'laboratory',
      'scanning', 'x-ray', 'scan', 'physio', 'physiotherapy', 'health', 'wellness',
      'pediatric', 'nursing'
    ],
  },
  {
    canonical: 'Supermarkets & Groceries',
    categories: ['Supermarkets & Groceries', 'Retail & Shopping', 'Grocery'],
    keywords: [
      'supermarket', 'supermarkt', 'supermart', 'supramarket', 'supermrkt', 'grocery',
      'groceries', 'grocerry', 'hypermarket', 'mart', 'store', 'stor', 'shop',
      'bazaar', 'bazar', 'provision', 'provisions', 'vegetables', 'fruits', 'meat',
      'fish', 'maligai', 'daily needs', 'minimart'
    ],
  },
  {
    canonical: 'Mobiles & Electronics',
    categories: ['Mobiles & Electronics', 'Electronics', 'Mobiles'],
    keywords: [
      'mobile', 'mobiles', 'mobil', 'mobl', 'phone', 'smartphone', 'laptop',
      'laptops', 'computer', 'pc', 'electronics', 'electronic', 'electonics',
      'elctronics', 'gadgets', 'repair', 'recharge', 'accessories', 'appliances',
      'tv', 'ac', 'air conditioner', 'fridge', 'refrigerator', 'washing machine',
      'apple', 'samsung', 'oppo', 'vivo', 'oneplus', 'charger'
    ],
  },
  {
    canonical: 'Fashion & Textiles',
    categories: ['Fashion & Textiles', 'Textiles', 'Clothing', 'Fashion'],
    keywords: [
      'textiles', 'textile', 'clothing', 'clothes', 'cloths', 'dress', 'dresses',
      'saree', 'sari', 'fashion', 'boutique', 'tailor', 'tailoring', 'mens wear',
      'ladies wear', 'kids wear', 'silk', 'cotton', 'footwear', 'shoes', 'slippers',
      'chappal', 'seemas', 'kalyan silks', 'wedding', 'shirt', 'jeans'
    ],
  },
  {
    canonical: 'Gold & Jewellery',
    categories: ['Gold & Jewellery', 'Jewellery', 'Jewelers'],
    keywords: [
      'jewellery', 'jewelry', 'jewlery', 'jwellery', 'jewelery', 'jewelers',
      'jewellers', 'gold', 'diamond', 'silver', 'ornaments', 'kalyan', 'malabar',
      'joyalukkas', 'bhiman', 'alukkas', 'carat', 'bangles', 'necklace', 'ring'
    ],
  },
  {
    canonical: 'Automobiles & Workshops',
    categories: ['Automobiles & Workshops', 'Automotive'],
    keywords: [
      'automobile', 'automobiles', 'automotive', 'car', 'cars', 'auto', 'bike',
      'bikes', 'two wheeler', 'motor', 'motors', 'workshop', 'garage', 'mechanic',
      'tyre', 'tire', 'wheel', 'puncture', 'wash', 'car wash', 'service station',
      'ev', 'spares', 'parts', 'service center', 'tvs', 'honda', 'maruti', 'hyundai'
    ],
  },
  {
    canonical: 'Beauty, Salons & Spas',
    categories: ['Beauty, Salons & Spas', 'Salon', 'Spa'],
    keywords: [
      'salon', 'saloon', 'parlour', 'parlor', 'beauty parlour', 'spa', 'hair',
      'haircut', 'makeup', 'bridal', 'barber', 'grooming', 'facial', 'mehandi',
      'tattoo', 'nails', 'skin care', 'massage', 'styling'
    ],
  },
  {
    canonical: 'Home, Furniture & Hardware',
    categories: ['Home, Furniture & Hardware'],
    keywords: [
      'furniture', 'hardware', 'hardwares', 'paints', 'paint', 'cement', 'electrical',
      'plumbing', 'sanitary', 'sanitaryware', 'tiles', 'marbles', 'granite', 'interior',
      'wood', 'timber', 'glass', 'kitchenware', 'plywood', 'doors', 'asian paints'
    ],
  },
  {
    canonical: 'Local Home Services',
    categories: ['Local Home Services', 'Services'],
    keywords: [
      'services', 'service', 'plumber', 'electrician', 'carpenter', 'painter',
      'cleaning', 'pest control', 'appliance repair', 'ac service', 'packer',
      'movers', 'cctv', 'security', 'installation', 'deep cleaning'
    ],
  },
  {
    canonical: 'Education & Coaching',
    categories: ['Education & Coaching'],
    keywords: [
      'education', 'school', 'college', 'tuition', 'tution', 'coaching', 'institute',
      'academy', 'training', 'classes', 'entrance', 'ielts', 'psc', 'spoken english',
      'driving school', 'study abroad', 'software training'
    ],
  },
  {
    canonical: 'Professional & Events',
    categories: ['Professional & Events'],
    keywords: [
      'studio', 'photography', 'photo', 'video', 'printing', 'press', 'xerox',
      'stationery', 'events', 'event management', 'auditorium', 'convention centre',
      'catering', 'auditor', 'lawyer', 'graphic design', 'flex printing'
    ],
  },
];

// 5. HELPER: Check if a query token matches a category (exact, synonym, or fuzzy)
export function matchTokenToCategory(token) {
  if (!token || token.length < 2) return null;
  const t = token.toLowerCase();

  // If token is an exact known Kerala location alias (e.g. "cochin", "calicut"), don't treat as category typo
  const exactLoc = matchTokenToLocation(t);
  const isExactLocation = exactLoc && exactLoc.score === 100;

  for (const cat of CATEGORY_SYNONYMS_DICTIONARY) {
    for (const kw of cat.keywords) {
      if (kw === t) {
        return { category: cat.canonical, matchedKeyword: kw, score: 100, isTypo: false };
      }
      if (kw.startsWith(t) && t.length >= 3) {
        return { category: cat.canonical, matchedKeyword: kw, score: 85, isTypo: false };
      }
      if (!isExactLocation && t.length >= 4 && kw.length >= 4) {
        const dist = levenshteinDistance(t, kw);
        const maxDist = Math.min(t.length, kw.length) <= 5 ? 1 : 2;
        if (dist <= maxDist) {
          return { category: cat.canonical, matchedKeyword: kw, score: 75, isTypo: true, typoOf: kw };
        }
      }
    }
  }
  return null;
}

// 6. HELPER: Check if a query token matches a location (exact, alias, or fuzzy)
export function matchTokenToLocation(token) {
  if (!token || token.length < 2) return null;
  const t = token.toLowerCase();

  for (const [key, data] of Object.entries(KERALA_LOCATION_DICTIONARY)) {
    for (const alias of data.aliases) {
      if (alias === t) {
        return { district: data.district, canonical: data.canonical, matchedAlias: alias, score: 100, isAlias: alias !== key };
      }
      if (alias.startsWith(t) && t.length >= 4) {
        return { district: data.district, canonical: data.canonical, matchedAlias: alias, score: 85, isAlias: true };
      }
      if (t.length >= 5 && alias.length >= 5) {
        const dist = levenshteinDistance(t, alias);
        if (dist <= (t.length <= 6 ? 1 : 2)) {
          return { district: data.district, canonical: data.canonical, matchedAlias: alias, score: 75, isAlias: true, isTypo: true };
        }
      }
    }
  }
  return null;
}

// 7. COMPREHENSIVE RELEVANCE SCORER FOR A SINGLE MERCHANT
export function scoreMerchantRelevance(merchant, query) {
  if (!merchant || !query || !query.trim()) return 0;

  const rawTokens = cleanTokens(query);
  if (!rawTokens.length) return 0;

  const name = String(merchant.business_name || merchant.name || '').toLowerCase();
  const cat = String(merchant.category || '').toLowerCase();
  const cats = Array.isArray(merchant.categories)
    ? merchant.categories.map((c) => String(c).toLowerCase()).join(' ')
    : '';
  const city = String(merchant.city || '').toLowerCase();
  const district = String(merchant.district || merchant.location || '').toLowerCase();
  const address = String(merchant.address || merchant.landmark || '').toLowerCase();
  const services = Array.isArray(merchant.services)
    ? merchant.services.map((s) => String(s).toLowerCase()).join(' ')
    : typeof merchant.services === 'string'
    ? merchant.services.toLowerCase()
    : '';
  const fullText = `${name} ${cat} ${cats} ${city} ${district} ${address} ${services}`;

  const cleanQ = query.trim().toLowerCase();

  let totalScore = 0;
  if (name.includes(cleanQ)) totalScore += 120;
  else if (cat.includes(cleanQ) || cats.includes(cleanQ)) totalScore += 90;
  else if (city.includes(cleanQ) || district.includes(cleanQ)) totalScore += 80;
  else if (services.includes(cleanQ)) totalScore += 70;
  else if (fullText.includes(cleanQ)) totalScore += 50;

  let matchedTokensCount = 0;
  let hasLocationMatch = false;
  let hasCategoryMatch = false;

  for (const token of rawTokens) {
    let tokenScore = 0;

    // A. Check Name
    if (name.includes(token)) {
      tokenScore = Math.max(tokenScore, 80);
    } else {
      const nameWords = cleanTokens(name);
      for (const nw of nameWords) {
        if (nw.startsWith(token) && token.length >= 3) {
          tokenScore = Math.max(tokenScore, 70);
          break;
        }
        if (token.length >= 4 && nw.length >= 4) {
          const dist = levenshteinDistance(token, nw);
          const maxDist = Math.min(token.length, nw.length) <= 5 ? 1 : 2;
          if (dist <= maxDist) {
            tokenScore = Math.max(tokenScore, 55);
            break;
          }
        }
      }
    }

    // B. Check Location & Aliases
    const locMatch = matchTokenToLocation(token);
    if (locMatch) {
      if (district.includes(locMatch.district) || city.includes(locMatch.matchedAlias) || address.includes(locMatch.matchedAlias)) {
        tokenScore = Math.max(tokenScore, locMatch.score);
        hasLocationMatch = true;
      }
    } else if (city.includes(token) || district.includes(token) || address.includes(token)) {
      tokenScore = Math.max(tokenScore, 65);
      hasLocationMatch = true;
    }

    // C. Check Category & Synonyms
    const catMatch = matchTokenToCategory(token);
    if (catMatch) {
      const matchInCat =
        cat.includes(catMatch.matchedKeyword) ||
        cats.includes(catMatch.matchedKeyword) ||
        cat.includes(catMatch.category.toLowerCase()) ||
        cats.includes(catMatch.category.toLowerCase()) ||
        services.includes(catMatch.matchedKeyword);

      if (matchInCat) {
        tokenScore = Math.max(tokenScore, catMatch.score);
        hasCategoryMatch = true;
      }
    } else if (cat.includes(token) || cats.includes(token)) {
      tokenScore = Math.max(tokenScore, 60);
      hasCategoryMatch = true;
    }

    // D. Check Services
    if (services.includes(token)) {
      tokenScore = Math.max(tokenScore, 50);
    } else {
      const serviceWords = cleanTokens(services);
      for (const sw of serviceWords) {
        if (token.length >= 4 && sw.length >= 4) {
          const dist = levenshteinDistance(token, sw);
          if (dist <= 1) {
            tokenScore = Math.max(tokenScore, 40);
            break;
          }
        }
      }
    }

    if (tokenScore > 0) {
      matchedTokensCount++;
      totalScore += tokenScore;
    }
  }

  // Multi-token co-occurrence bonus
  if (rawTokens.length > 1 && matchedTokensCount === rawTokens.length) {
    totalScore += 60;
  }
  if (hasLocationMatch && hasCategoryMatch) {
    totalScore += 50;
  }

  return totalScore;
}

// 8. MAIN FILTER & RANK ENGINE
export function filterAndRankMerchants(merchants, query, options = {}) {
  if (!Array.isArray(merchants)) return [];
  const q = String(query || '').trim();

  const { selectedDistrict = 'all', selectedCategory = 'all' } = options;

  if (!q) {
    return merchants.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.categoryKey === selectedCategory ||
        (item.category && item.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      const itemLoc = `${item.location || ''} ${item.city || ''} ${item.district || ''}`.toLowerCase();
      const matchesDistrict =
        selectedDistrict === 'all' ||
        itemLoc.includes(selectedDistrict.toLowerCase());

      return matchesCategory && matchesDistrict;
    });
  }

  const scored = [];
  for (const m of merchants) {
    const score = scoreMerchantRelevance(m, q);
    if (score >= 20) {
      scored.push({ merchant: m, score });
    }
  }

  if (scored.length < 3) {
    for (const m of merchants) {
      if (!scored.some((s) => s.merchant.id === m.id)) {
        const score = scoreMerchantRelevance(m, q);
        if (score >= 10) {
          scored.push({ merchant: m, score });
        }
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.map((item) => item.merchant);
}

// 9. QUERY INTENT & TYPO DETECTOR
export function detectSearchIntent(query) {
  if (!query || !query.trim()) return null;
  const tokens = cleanTokens(query);

  let detectedLocation = null;
  let detectedCategory = null;
  let typoCorrections = [];

  for (const token of tokens) {
    const loc = matchTokenToLocation(token);
    if (loc) {
      detectedLocation = loc.canonical;
      if (loc.isTypo) typoCorrections.push(`"${token}" → ${loc.canonical}`);
    }

    const cat = matchTokenToCategory(token);
    if (cat) {
      detectedCategory = cat.category;
      if (cat.isTypo) typoCorrections.push(`"${token}" → ${cat.matchedKeyword}`);
    }
  }

  return {
    query,
    detectedLocation,
    detectedCategory,
    typoCorrections,
    hasCorrection: typoCorrections.length > 0 || Boolean(detectedCategory) || Boolean(detectedLocation),
  };
}

// 10. GENERATE INTELLIGENT FUZZY AUTO-SUGGESTIONS
export function generateFuzzySuggestions(merchants = [], query = '', limit = 6) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const tokens = cleanTokens(q);
  const suggestions = [];

  for (const token of tokens) {
    const catMatch = matchTokenToCategory(token);
    if (catMatch && !suggestions.some((s) => s.text === catMatch.category)) {
      suggestions.push({
        type: 'category',
        text: catMatch.category,
        subtext: catMatch.isTypo ? `Related to "${token}"` : 'Category',
        icon: '🏷️',
      });
    }
  }

  for (const token of tokens) {
    const locMatch = matchTokenToLocation(token);
    if (locMatch && !suggestions.some((s) => s.text === locMatch.canonical)) {
      suggestions.push({
        type: 'location',
        text: locMatch.canonical,
        subtext: locMatch.isAlias ? `Matching "${token}"` : 'Kerala Location',
        icon: '📍',
      });
    }
  }

  if (Array.isArray(merchants)) {
    const merchantMatches = [];
    for (const m of merchants) {
      const name = String(m.business_name || m.name || '');
      if (!name) continue;
      const score = scoreMerchantRelevance(m, q);
      if (score >= 40) {
        merchantMatches.push({
          type: 'establishment',
          text: name,
          subtext: `${m.category || 'Shop'} • ${m.city || m.district || 'Kerala'}`,
          icon: '🏪',
          score,
        });
      }
    }
    merchantMatches.sort((a, b) => b.score - a.score);
    for (const mm of merchantMatches) {
      if (!suggestions.some((s) => s.text === mm.text)) {
        suggestions.push(mm);
      }
    }
  }

  return suggestions.slice(0, limit);
}
