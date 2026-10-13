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
 * Detect location from IP Geolocation services (works reliably over HTTP, Mobile & Desktop)
 */
export async function detectLocationFromIP() {
  // Source 1: ipwho.is (Free, fast, supports CORS and HTTPS/HTTP)
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || '',
          region: data.region || '',
          postal: data.postal || '',
          accuracy: 5000,
          source: 'ip_ipwhois',
        };
      }
    }
  } catch (err) {
    console.warn('ipwho.is failed, trying fallback:', err);
  }

  // Source 2: ip-api.com (Works over HTTP, extremely fast in India)
  try {
    const res = await fetch('http://ip-api.com/json/', { signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined });
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success' && data.lat && data.lon) {
        return {
          latitude: data.lat,
          longitude: data.lon,
          city: data.city || '',
          region: data.regionName || '',
          postal: data.zip || '',
          accuracy: 5000,
          source: 'ip_ipapi',
        };
      }
    }
  } catch (err) {
    console.warn('ip-api.com failed, trying fallback:', err);
  }

  // Source 3: BigDataCloud Client API (Free, client-side, CORS enabled)
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', { signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined });
    if (res.ok) {
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.locality || data.city || '',
          region: data.principalSubdivision || '',
          accuracy: 5000,
          source: 'ip_bigdatacloud',
        };
      }
    }
  } catch (err) {
    console.warn('BigDataCloud IP detection failed:', err);
  }

  return null;
}

/**
/**
 * High-accuracy Browser Geolocation using device/browser native Geolocation API
 * Fresh coordinates with maximumAge: 0, suitable mobile timeout, and graceful error handling.
 */
export function detectLocationFromBrowser(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const err = new Error('Geolocation is not supported by your browser.');
      err.code = 0;
      return reject(err);
    }

    const timeout = options.timeout || 12000;

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
        // If high accuracy times out or is unavailable (e.g. indoors GPS lock),
        // try low accuracy (cell/WiFi network location) still requesting fresh position
        if (err.code === 3 /* TIMEOUT */ || err.code === 2 /* POSITION_UNAVAILABLE */) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                source: 'browser_network',
              });
            },
            (err2) => {
              reject(err2 || err);
            },
            {
              enableHighAccuracy: false,
              maximumAge: 0,
              timeout: 8000,
            }
          );
        } else {
          // Permission denied or other fatal error
          reject(err);
        }
      },
      {
        enableHighAccuracy: options.enableHighAccuracy !== false,
        maximumAge: 0, // Fresh coordinates only - never stale cache
        timeout: timeout,
      }
    );
  });
}

/**
 * Main Current Location Detection Orchestrator:
 * 1. Obtains ACTUAL current coordinates from device/browser native Geolocation API.
 * 2. Never substitutes hardcoded coordinates, server coordinates, default Kerala/Kollam, or IP-based locations.
 * 3. Reverse-geocodes the actual coordinates to obtain a readable display address anywhere in the world.
 * 4. Never alters or replaces the original coordinates returned by the browser.
 * 5. Rejects with clear error on permission denied, unavailable, or timeout.
 */
export async function detectAccurateUserLocation(options = {}) {
  // 1. Obtain ACTUAL coordinates from browser native Geolocation API
  const coords = await detectLocationFromBrowser(options);

  const { latitude, longitude, accuracy, source } = coords;

  // 2. Reverse geocode ACTUAL coordinates to get a human-readable display label
  let revGeo = null;
  if (GOOGLE_MAPS_API_KEY) {
    try {
      revGeo = await reverseGeocodeGoogle(latitude, longitude, GOOGLE_MAPS_API_KEY);
    } catch {}
  }
  if (!revGeo) {
    try {
      revGeo = await reverseGeocodeBigDataCloud(latitude, longitude);
    } catch {}
  }
  if (!revGeo) {
    try {
      revGeo = await reverseGeocodeNominatim(latitude, longitude);
    } catch {}
  }

  // 3. Resolve display name and optional Kerala district match (if located in Kerala)
  let displayName = '';
  let resolvedCity = '';
  let matchedDistrict = null;

  if (revGeo) {
    resolvedCity = revGeo.city || '';
    if (revGeo.formattedAddress) {
      displayName = revGeo.formattedAddress;
    } else {
      const parts = [revGeo.city, revGeo.district, revGeo.raw?.principalSubdivision, revGeo.raw?.countryName].filter(Boolean);
      displayName = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    const fullText = `${revGeo.district || ''} ${revGeo.city || ''} ${revGeo.formattedAddress || ''}`;
    matchedDistrict = resolveDistrictFromText(fullText);
  }

  if (!displayName) {
    displayName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  // RETURN ACTUAL BROWSER COORDINATES UNTOUCHED!
  return {
    type: 'gps',
    lat: latitude,       // Real latitude from browser
    lng: longitude,      // Real longitude from browser
    accuracy: accuracy || 50,
    source: source,
    district: matchedDistrict, // null if outside Kerala
    cityName: resolvedCity || displayName,
    name: displayName,
    address: revGeo?.formattedAddress || displayName,
  };
}
