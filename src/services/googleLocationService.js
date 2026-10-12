/**
 * Google Maps & High-Accuracy Geolocation Service for Kerala
 * Supports Google Maps Geolocation API, Google Maps Reverse Geocoding API,
 * HTML5 Geolocation with zero cache (maximumAge: 0), and multi-source reverse geocoding.
 */

// Kerala 14 Districts Center Coordinates
export const KERALA_DISTRICT_COORDINATES = {
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram', title: 'Thiruvananthapuram (Trivandrum)' },
  kollam: { lat: 8.8932, lng: 76.6141, name: 'Kollam', title: 'Kollam (Quilon)' },
  pathanamthitta: { lat: 9.2648, lng: 76.7870, name: 'Pathanamthitta', title: 'Pathanamthitta' },
  alappuzha: { lat: 9.4981, lng: 76.3388, name: 'Alappuzha', title: 'Alappuzha (Alleppey)' },
  kottayam: { lat: 9.5916, lng: 76.5222, name: 'Kottayam', title: 'Kottayam' },
  idukki: { lat: 9.8500, lng: 76.9700, name: 'Idukki', title: 'Idukki' },
  ernakulam: { lat: 9.9816, lng: 76.2999, name: 'Ernakulam', title: 'Ernakulam (Kochi)' },
  thrissur: { lat: 10.5276, lng: 76.2144, name: 'Thrissur', title: 'Thrissur' },
  palakkad: { lat: 10.7867, lng: 76.6548, name: 'Palakkad', title: 'Palakkad' },
  malappuram: { lat: 11.0510, lng: 76.0711, name: 'Malappuram', title: 'Malappuram' },
  kozhikode: { lat: 11.2588, lng: 75.7804, name: 'Kozhikode', title: 'Kozhikode (Calicut)' },
  wayanad: { lat: 11.6854, lng: 76.1320, name: 'Wayanad', title: 'Wayanad' },
  kannur: { lat: 11.8745, lng: 75.3704, name: 'Kannur', title: 'Kannur' },
  kasaragod: { lat: 12.4996, lng: 74.9869, name: 'Kasaragod', title: 'Kasaragod' },
};

// Popular Kerala Towns Coordinates
export const KERALA_TOWN_COORDINATES = {
  payyanur: { lat: 12.1030, lng: 75.2028, name: 'Payyanur', district: 'Kannur' },
  taliparamba: { lat: 12.0437, lng: 75.3585, name: 'Taliparamba', district: 'Kannur' },
  thalassery: { lat: 11.7491, lng: 75.4890, name: 'Thalassery', district: 'Kannur' },
  kanhangad: { lat: 12.3088, lng: 75.0927, name: 'Kanhangad', district: 'Kasaragod' },
  trikaripur: { lat: 12.1528, lng: 75.1610, name: 'Trikaripur', district: 'Kasaragod' },
  nileshwar: { lat: 12.2536, lng: 75.1328, name: 'Nileshwar', district: 'Kasaragod' },
  vadakara: { lat: 11.6089, lng: 75.5917, name: 'Vadakara', district: 'Kozhikode' },
  koyilandy: { lat: 11.4398, lng: 75.6967, name: 'Koyilandy', district: 'Kozhikode' },
  manjeri: { lat: 11.1203, lng: 76.1207, name: 'Manjeri', district: 'Malappuram' },
  perinthalmanna: { lat: 10.9760, lng: 76.2255, name: 'Perinthalmanna', district: 'Malappuram' },
  tirur: { lat: 10.9161, lng: 75.9238, name: 'Tirur', district: 'Malappuram' },
  aluva: { lat: 10.1076, lng: 76.3516, name: 'Aluva', district: 'Ernakulam' },
  kakkanad: { lat: 10.0159, lng: 76.3419, name: 'Kakkanad', district: 'Ernakulam' },
  edapally: { lat: 10.0261, lng: 76.3082, name: 'Edapally', district: 'Ernakulam' },
  guruvayur: { lat: 10.5946, lng: 76.0416, name: 'Guruvayur', district: 'Thrissur' },
  chalakudy: { lat: 10.3070, lng: 76.3330, name: 'Chalakudy', district: 'Thrissur' },
  kalpetta: { lat: 11.6103, lng: 76.0827, name: 'Kalpetta', district: 'Wayanad' },
  sulthan_bathery: { lat: 11.6627, lng: 76.2570, name: 'Sulthan Bathery', district: 'Wayanad' },
  munnar: { lat: 10.0889, lng: 77.0595, name: 'Munnar', district: 'Idukki' },
  thodupuzha: { lat: 9.8959, lng: 76.7184, name: 'Thodupuzha', district: 'Idukki' },
  pala: { lat: 9.7124, lng: 76.6836, name: 'Pala', district: 'Kottayam' },
  changanassery: { lat: 9.4447, lng: 76.5414, name: 'Changanassery', district: 'Kottayam' },
  cherthala: { lat: 9.6845, lng: 76.3297, name: 'Cherthala', district: 'Alappuzha' },
  kayamkulam: { lat: 9.1724, lng: 76.5011, name: 'Kayamkulam', district: 'Alappuzha' },
  thiruvalla: { lat: 9.3835, lng: 76.5741, name: 'Thiruvalla', district: 'Pathanamthitta' },
  adoor: { lat: 9.1530, lng: 76.7356, name: 'Adoor', district: 'Pathanamthitta' },
  karunagappally: { lat: 9.0544, lng: 76.5369, name: 'Karunagappally', district: 'Kollam' },
  kovalam: { lat: 8.4004, lng: 76.9787, name: 'Kovalam', district: 'Thiruvananthapuram' },
  varkala: { lat: 8.7379, lng: 76.7163, name: 'Varkala', district: 'Thiruvananthapuram' },
};

export const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) ||
  '';

/**
 * Normalizes text to Kerala district key
 */
export function resolveDistrictFromText(text = '') {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  const districtMap = {
    thiruvananthapuram: ['thiruvananthapuram', 'trivandrum', 'tvm', 'nedumangad', 'neyyattinkara', 'attingal', 'varkala', 'kovalam', 'kazhakkoottam', 'pattom'],
    kollam: ['kollam', 'quilon', 'karunagappally', 'punalur', 'kottarakkara', 'paravur'],
    pathanamthitta: ['pathanamthitta', 'thiruvalla', 'adoor', 'ranni', 'konni'],
    alappuzha: ['alappuzha', 'alleppey', 'cherthala', 'kayamkulam', 'mavelikkara', 'haripad', 'kandalloor'],
    kottayam: ['kottayam', 'changanassery', 'pala', 'ettumanoor', 'vaikom'],
    idukki: ['idukki', 'thodupuzha', 'munnar', 'kattappana', 'adimali'],
    ernakulam: ['ernakulam', 'kochi', 'cochin', 'aluva', 'edapally', 'kakkanad', 'angamaly', 'tripunithura', 'perumbavoor', 'kanayannur', 'thrikkakara'],
    thrissur: ['thrissur', 'trichur', 'guruvayur', 'chalakudy', 'kodungallur', 'kunnamkulam', 'irinjallakuda', 'kechery', 'venkitangu'],
    palakkad: ['palakkad', 'palghat', 'ottapalam', 'chittur', 'mannarkkad', 'shornur', 'pattambi'],
    malappuram: ['malappuram', 'manjeri', 'perinthalmanna', 'tirur', 'ponnani', 'kottakkal', 'kondotty'],
    kozhikode: ['kozhikode', 'calicut', 'vadakara', 'koyilandy', 'thamarassery', 'feroke', 'omassery', 'malaparamba', 'east hill'],
    wayanad: ['wayanad', 'kalpetta', 'sulthan bathery', 'mananthavady', 'vythiri', 'meppadi'],
    kannur: ['kannur', 'cannannore', 'thalassery', 'payyanur', 'taliparamba', 'mattannur', 'chakkarakkal'],
    kasaragod: ['kasaragod', 'kasargod', 'kanhangad', 'nileshwar', 'trikaripur', 'uppala', 'bheemanady'],
  };

  for (const [distKey, aliases] of Object.entries(districtMap)) {
    for (const alias of aliases) {
      if (lower.includes(alias)) {
        return distKey;
      }
    }
  }

  return null;
}

/**
 * Calculates distance in km between two lat/lng coordinates (Haversine formula)
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Reverse geocodes coordinates using Google Maps Geocoding API if key is available
 */
export async function reverseGeocodeGoogle(lat, lng, apiKey = GOOGLE_MAPS_API_KEY) {
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const topResult = data.results[0];
      let district = null;
      let city = null;
      let locality = null;

      topResult.address_components.forEach((comp) => {
        if (comp.types.includes('administrative_area_level_2')) {
          district = comp.long_name;
        }
        if (comp.types.includes('locality')) {
          city = comp.long_name;
        }
        if (comp.types.includes('sublocality') || comp.types.includes('sublocality_level_1')) {
          locality = comp.long_name;
        }
      });

      return {
        formattedAddress: topResult.formatted_address,
        district,
        city: locality || city || district,
        raw: data,
      };
    }
  } catch (err) {
    console.warn('Google reverse geocode error:', err);
  }
  return null;
}

/**
 * Reverse geocodes using OpenStreetMap Nominatim
 */
export async function reverseGeocodeNominatim(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const district = a.state_district || a.county || a.district || a.city || '';
      const city = a.suburb || a.town || a.city || a.village || a.neighbourhood || district;
      return {
        formattedAddress: data.display_name,
        district,
        city,
        raw: data,
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode error:', err);
  }
  return null;
}

/**
 * Reverse geocodes using BigDataCloud Client API (Free, fast client-side)
 */
export async function reverseGeocodeBigDataCloud(lat, lng) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data) {
      let district = '';
      if (data.localityInfo && data.localityInfo.administrative) {
        const distObj = data.localityInfo.administrative.find(
          (ad) => ad.adminLevel === 5 || (ad.description && ad.description.toLowerCase().includes('district'))
        );
        if (distObj) district = distObj.name;
      }
      return {
        formattedAddress: `${data.locality || data.city || ''}, ${data.principalSubdivision || ''}`,
        district: district || data.city || '',
        city: data.locality || data.city || district,
        raw: data,
      };
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode error:', err);
  }
  return null;
}

/**
 * Calls Google Geolocation API if API key is provided
 */
export async function detectLocationFromGoogleAPI(apiKey = GOOGLE_MAPS_API_KEY) {
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ considerIp: true }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.location) {
      return {
        latitude: data.location.lat,
        longitude: data.location.lng,
        accuracy: data.accuracy || 50,
        source: 'google_api',
      };
    }
  } catch (err) {
    console.warn('Google Geolocation API failed:', err);
  }
  return null;
}

/**
 * High-accuracy Browser Geolocation with zero cache (maximumAge: 0)
 */
export function detectLocationFromBrowser(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'browser_gps',
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0, // Forces fresh positioning instead of stale ISP cache
        timeout: options.timeout || 15000,
      }
    );
  });
}

/**
 * Main Detection Orchestrator:
 * 1. Queries Google Geolocation API if key available, else Browser Geolocation (high accuracy, zero cache).
 * 2. Runs reverse geocoding via Google Maps, Nominatim & BigDataCloud.
 * 3. Maps to Kerala districts & popular towns.
 */
export async function detectAccurateUserLocation() {
  let coords = null;

  // Try Google Geolocation API first if key exists
  if (GOOGLE_MAPS_API_KEY) {
    coords = await detectLocationFromGoogleAPI(GOOGLE_MAPS_API_KEY);
  }

  // Fallback to high-accuracy browser geolocation
  if (!coords) {
    coords = await detectLocationFromBrowser({ timeout: 15000 });
  }

  const { latitude, longitude, accuracy, source } = coords;

  // Run reverse geocoding in parallel for highest accuracy
  let revGeo = null;
  if (GOOGLE_MAPS_API_KEY) {
    revGeo = await reverseGeocodeGoogle(latitude, longitude, GOOGLE_MAPS_API_KEY);
  }
  if (!revGeo) {
    revGeo = await reverseGeocodeNominatim(latitude, longitude);
  }
  if (!revGeo) {
    revGeo = await reverseGeocodeBigDataCloud(latitude, longitude);
  }

  // Try to match district from reverse geocoded address
  let matchedDistrict = null;
  let resolvedCity = '';

  if (revGeo) {
    const fullText = `${revGeo.district || ''} ${revGeo.city || ''} ${revGeo.formattedAddress || ''}`;
    matchedDistrict = resolveDistrictFromText(fullText);
    resolvedCity = revGeo.city || '';
  }

  // If reverse geocoding didn't match a Kerala district, calculate nearest Kerala district center
  if (!matchedDistrict) {
    let closestDist = 999999;
    let closestKey = 'thiruvananthapuram';
    let closestName = 'Thiruvananthapuram';

    Object.entries(KERALA_DISTRICT_COORDINATES).forEach(([distKey, distData]) => {
      const dist = getDistanceKm(latitude, longitude, distData.lat, distData.lng);
      if (dist < closestDist) {
        closestDist = dist;
        closestKey = distKey;
        closestName = distData.name;
      }
    });

    matchedDistrict = closestKey;
    if (!resolvedCity) resolvedCity = closestName;
  }

  const districtConfig = KERALA_DISTRICT_COORDINATES[matchedDistrict] || {
    name: matchedDistrict.charAt(0).toUpperCase() + matchedDistrict.slice(1),
  };

  const displayName = resolvedCity
    ? `${resolvedCity}`
    : districtConfig.name;

  return {
    type: 'gps',
    lat: latitude,
    lng: longitude,
    accuracy: accuracy || 50,
    source,
    district: matchedDistrict,
    districtName: districtConfig.name,
    cityName: resolvedCity || districtConfig.name,
    name: displayName,
    address: revGeo?.formattedAddress || '',
  };
}
