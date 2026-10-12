/**
 * Kerala Commercial Zones & Municipal Hubs Master Dictionary
 * Maps every Kerala city/town to its exact specific commercial zones.
 * Ensures the zone count and the list of locations match 100%.
 */

export const KERALA_TOWN_ZONES_MASTER = {
  'payyanur': {
    city: 'Payyanur',
    district: 'Kannur District',
    zonesCount: 8,
    lat: 12.1000,
    lng: 75.2000,
    merchants: 272,
    users: 3420,
    zones: [
      { name: 'Zone 1: Payyanur Town Centre & Old Bus Stand', desc: 'Main retail hub, gold jewellery souk, silks, watches, and traditional bakeries', count: 58 },
      { name: 'Zone 2: Perumba Commercial Corridor & Highway', desc: 'Shopping malls, supermarkets, electronics, automobiles, and modern cafes', count: 52 },
      { name: 'Zone 3: Railway Station Road & Main Bazar', desc: 'Wholesale provisions, hardware, electricals, and travel logistics', count: 40 },
      { name: 'Zone 4: Keloth & Mall Road Arcade', desc: 'Fashion boutiques, departmental stores, and diagnostic centres', count: 34 },
      { name: 'Zone 5: Annur Commercial Junction', desc: 'Automobile garages, building materials, and retail groceries', count: 26 },
      { name: 'Zone 6: Vellur Trade Area', desc: 'Local retail shops, bakeries, and consumer service providers', count: 24 },
      { name: 'Zone 7: Kandoth Market Road', desc: 'Traditional weavers, handicrafts, hardware, and pottery trade', count: 20 },
      { name: 'Zone 8: Payyanur New Bus Stand Complex', desc: 'Travel booking hubs, food courts, textiles, and mobile accessories', count: 18 },
    ],
  },

  'taliparamba': {
    city: 'Taliparamba',
    district: 'Kannur District',
    zonesCount: 5,
    lat: 12.0416,
    lng: 75.3588,
    merchants: 73,
    users: 1850,
    zones: [
      { name: 'Zone 1: Taliparamba Main Bus Stand & Highway Hub', desc: 'High-traffic retail, supermarkets, textile showrooms, and bakeries', count: 24 },
      { name: 'Zone 2: Market Road & Commercial Bazar', desc: 'Vegetables, spices, wholesale provisions, and hardware stores', count: 18 },
      { name: 'Zone 3: Trichambaram Temple Road Retail Belt', desc: 'Traditional brassware, pooja materials, gifts, and sweet stalls', count: 12 },
      { name: 'Zone 4: Bakkalam & Kalliasseri Highway Junction', desc: 'Automobile sales, workshops, tiles, and sanitaryware showrooms', count: 10 },
      { name: 'Zone 5: Plathottam Commercial Arcade', desc: 'Mobile stores, opticals, medical clinics, and footwear shops', count: 9 },
    ],
  },

  'kannur city': {
    city: 'Kannur City',
    district: 'Kannur District',
    zonesCount: 6,
    lat: 11.8745,
    lng: 75.3704,
    merchants: 62,
    users: 2200,
    zones: [
      { name: 'Zone 1: Fort Road & Stadium Corner', desc: 'Premium jewellery showrooms, branded apparel, and corporate banks', count: 18 },
      { name: 'Zone 2: Thavakkara New Bus Stand Hub', desc: 'Commercial shopping complexes, dining, and multi-speciality medicals', count: 14 },
      { name: 'Zone 3: South Bazar & City Centre', desc: 'Electronics, mobile hubs, home appliances, and lifestyle stores', count: 11 },
      { name: 'Zone 4: Calicut Road Commercial Corridor', desc: 'Automobile dealerships, tiles, lighting, and sanitaryware', count: 8 },
      { name: 'Zone 5: Camp Bazar & Old Town Market', desc: 'Wholesale grains, spices, dry fruits, and packaging supplies', count: 6 },
      { name: 'Zone 6: Railway Station Road & SN Park Belt', desc: 'Hotels, travel agencies, book stalls, and fast food joints', count: 5 },
    ],
  },

  'calicut city': {
    city: 'Calicut City',
    district: 'Kozhikode District',
    zonesCount: 8,
    lat: 11.2588,
    lng: 75.7804,
    merchants: 41,
    users: 2890,
    zones: [
      { name: 'Zone 1: SM Street (Mittai Theruvu) Heritage Souk', desc: 'Iconic heritage sweet shops, halwa stalls, textiles, and fashion', count: 9 },
      { name: 'Zone 2: Mavoor Road & Focus Mall Corridor', desc: 'Mobiles, laptops, computer peripherals, and diagnostic clinics', count: 8 },
      { name: 'Zone 3: Palayam & Big Bazar Wholesale', desc: 'Spices, grains, stationery, and hardware wholesale trade', count: 6 },
      { name: 'Zone 4: Hilite Mall & Bypass Commercial Belt', desc: 'Luxury lifestyle brands, hypermarkets, and automotive flagships', count: 5 },
      { name: 'Zone 5: Mananchira & Town Hall Commercial Area', desc: 'Publishing houses, legal stationery, banks, and cafes', count: 4 },
      { name: 'Zone 6: Medical College Commercial Road', desc: 'Pharmacies, surgical supplies, labs, and student services', count: 3 },
      { name: 'Zone 7: Cherootty Road Corporate Strip', desc: 'Financial firms, travel agencies, and business consultancies', count: 3 },
      { name: 'Zone 8: Kallai Timber & Trade Hub', desc: 'Hardwood trade, plywood, glass, and construction supplies', count: 3 },
    ],
  },

  'kanhangad': {
    city: 'Kanhangad',
    district: 'Kasaragod District',
    zonesCount: 4,
    lat: 12.3082,
    lng: 75.0863,
    merchants: 31,
    users: 1420,
    zones: [
      { name: 'Zone 1: Kanhangad Old Bus Stand & MG Road', desc: 'High-street fashion, jewellery, footwears, and confectionery', count: 12 },
      { name: 'Zone 2: New Bus Stand Commercial Complex', desc: 'Departmental stores, mobile galleries, and family restaurants', count: 9 },
      { name: 'Zone 3: Kotikulam Coastal Trade Hub', desc: 'Fresh seafood trade, boat supplies, and provisioning', count: 5 },
      { name: 'Zone 4: Puthiyakotta Commercial Junction', desc: 'Hardware, agro-inputs, electronics, and repair centres', count: 5 },
    ],
  },

  'cheemeni': {
    city: 'Cheemeni',
    district: 'Kasaragod District',
    zonesCount: 3,
    lat: 12.2394,
    lng: 75.2289,
    merchants: 21,
    users: 890,
    zones: [
      { name: 'Zone 1: Cheemeni Town Junction & Bus Stand', desc: 'Retail groceries, textiles, bakeries, and pharmacy', count: 10 },
      { name: 'Zone 2: Power Project Road Commercial Belt', desc: 'Engineering workshops, hardware, and building materials', count: 6 },
      { name: 'Zone 3: Pothavur Retail Strip', desc: 'Local consumer provisions, agro seeds, and repair services', count: 5 },
    ],
  },

  'kasaragod town': {
    city: 'Kasaragod Town',
    district: 'Kasaragod District',
    zonesCount: 5,
    lat: 12.4996,
    lng: 74.9869,
    merchants: 16,
    users: 1650,
    zones: [
      { name: 'Zone 1: Kasaragod Old Bus Stand & Bank Road', desc: 'Gold souk, textile emporiums, and corporate bank branches', count: 5 },
      { name: 'Zone 2: New Bus Stand Commercial Complex', desc: 'Multi-brand electronics, supermarkets, and dining spaces', count: 4 },
      { name: 'Zone 3: MG Road & City Tower Corridor', desc: 'Fashion apparel, mobile outlets, and footwear galleries', count: 3 },
      { name: 'Zone 4: Nullippady Commercial Belt', desc: 'Automobile parts, tyre showrooms, and workshops', count: 2 },
      { name: 'Zone 5: Karanakkad Trade Area', desc: 'Building materials, timber, and sanitaryware stores', count: 2 },
    ],
  },

  'trikaripur': {
    city: 'Trikaripur',
    district: 'Kasaragod District',
    zonesCount: 3,
    lat: 12.1558,
    lng: 75.1557,
    merchants: 16,
    users: 940,
    zones: [
      { name: 'Zone 1: Trikaripur Town Centre & Bus Stand', desc: 'Retail groceries, fashion, mobile services, and bakeries', count: 7 },
      { name: 'Zone 2: Railway Station Road & Main Bazar', desc: 'Hardware, provisions, medical stores, and stationery', count: 5 },
      { name: 'Zone 3: Olavara Trade Corridor', desc: 'Agro products, coir retail, and home utility shops', count: 4 },
    ],
  },

  'thalassery': {
    city: 'Thalassery',
    district: 'Kannur District',
    zonesCount: 4,
    lat: 11.7491,
    lng: 75.4890,
    merchants: 16,
    users: 1580,
    zones: [
      { name: 'Zone 1: Logans Road & Old Bus Stand Hub', desc: 'Heritage bakeries, jewellery, textile flagships, and gifts', count: 6 },
      { name: 'Zone 2: New Bus Stand & Court Road Corridor', desc: 'Commercial complexes, opticals, and fast food joints', count: 4 },
      { name: 'Zone 3: Main Bazar Wholesale Market', desc: 'Spices, dry fish, grains, and kitchenware wholesale', count: 3 },
      { name: 'Zone 4: Goods Shed Road & Harbour Area', desc: 'Logistics hubs, packaging materials, and marine stores', count: 3 },
    ],
  },

  'vadakara': {
    city: 'Vadakara',
    district: 'Kozhikode District',
    zonesCount: 4,
    lat: 11.6033,
    lng: 75.5898,
    merchants: 15,
    users: 1340,
    zones: [
      { name: 'Zone 1: Vadakara Old Bus Stand & Link Road', desc: 'Gold souk, silks, watches, and traditional footwear', count: 5 },
      { name: 'Zone 2: New Bus Stand Commercial Complex', desc: 'Electronics, mobile gadgets, and department stores', count: 4 },
      { name: 'Zone 3: Edodi Junction & Trade Belt', desc: 'Hardware, sanitaryware, and electrical wholesale', count: 3 },
      { name: 'Zone 4: Nut Street Commercial Area', desc: 'Agricultural commodities, coconut wholesale, and provisions', count: 3 },
    ],
  },

  'alakode': {
    city: 'Alakode',
    district: 'Kannur District',
    zonesCount: 3,
    lat: 12.1818,
    lng: 75.4746,
    merchants: 13,
    users: 820,
    zones: [
      { name: 'Zone 1: Alakode Town Centre & Bus Stand', desc: 'Grocery stores, medical shops, and family apparel', count: 6 },
      { name: 'Zone 2: Karuvanchal Trade Junction', desc: 'Rubber trading, fertilisers, hardware, and farm machinery', count: 4 },
      { name: 'Zone 3: Udayagiri Hill Market Road', desc: 'Spices collection, hill produce, and local bakeries', count: 3 },
    ],
  },

  'malappuram town': {
    city: 'Malappuram Town',
    district: 'Malappuram District',
    zonesCount: 5,
    lat: 11.0510,
    lng: 76.0711,
    merchants: 13,
    users: 1950,
    zones: [
      { name: 'Zone 1: Kottakunnu Commercial Strip', desc: 'Dining, family entertainment, apparel, and souvenirs', count: 4 },
      { name: 'Zone 2: Down Hill Town Centre & Bus Stand', desc: 'Gold ornaments, textiles, mobile stores, and footwear', count: 3 },
      { name: 'Zone 3: Up Hill Government & Commercial Belt', desc: 'Corporate banks, educational supplies, and printing', count: 2 },
      { name: 'Zone 4: Collectorate Junction Shopping Area', desc: 'Hardware, sanitaryware, and departmental stores', count: 2 },
      { name: 'Zone 5: Melmuri Commercial Corridor', desc: 'Automobile service centres and building construction hubs', count: 2 },
    ],
  },

  'padiyotuchal': {
    city: 'Padiyotuchal',
    district: 'Kannur District',
    zonesCount: 2,
    lat: 12.2215,
    lng: 75.3112,
    merchants: 13,
    users: 640,
    zones: [
      { name: 'Zone 1: Padiyotuchal Main Junction & Bus Stop', desc: 'Retail groceries, medical stores, and textile retail', count: 7 },
      { name: 'Zone 2: Market Street & Agro Services', desc: 'Agricultural tools, rubber supplies, and farm hardware', count: 6 },
    ],
  },

  'dharmasala': {
    city: 'Dharmasala',
    district: 'Kannur District',
    zonesCount: 3,
    lat: 11.9567,
    lng: 75.3725,
    merchants: 11,
    users: 780,
    zones: [
      { name: 'Zone 1: Dharmasala NH 66 Commercial Junction', desc: 'Supermarkets, automobile showrooms, and fast dining', count: 5 },
      { name: 'Zone 2: Engineering College Road & Tech Retail', desc: 'Computer services, stationery, cafes, and youth fashion', count: 3 },
      { name: 'Zone 3: Morazha Trade Area', desc: 'Building hardware, timber, and local consumer shops', count: 3 },
    ],
  },

  'cherupuzha': {
    city: 'Cherupuzha',
    district: 'Kannur District',
    zonesCount: 3,
    lat: 12.2745,
    lng: 75.3670,
    merchants: 10,
    users: 720,
    zones: [
      { name: 'Zone 1: Cherupuzha Town Centre & Bus Stand', desc: 'Textiles, supermarkets, pharmacies, and gold jewellery', count: 4 },
      { name: 'Zone 2: Payyavoor Road Commercial Strip', desc: 'Plantation supplies, hardware, and automobile repair', count: 3 },
      { name: 'Zone 3: Prapoyil Market Junction', desc: 'Rubber trade, spices collection, and agro provisions', count: 3 },
    ],
  },

  'thrissur city': {
    city: 'Thrissur City',
    district: 'Thrissur District',
    zonesCount: 7,
    lat: 10.5276,
    lng: 76.2144,
    merchants: 102,
    users: 2650,
    zones: [
      { name: 'Zone 1: Swaraj Round (Thekkinkadu Ring)', desc: 'Gold & diamond ornaments, silks, watches, and banks', count: 28 },
      { name: 'Zone 2: High Road & Post Office Road', desc: 'Stationery, books, printing presses, and traditional textiles', count: 20 },
      { name: 'Zone 3: Kuruppam Road & Sakthan Stand Hub', desc: 'Vegetables & grocery wholesale, hardware, and lodges', count: 16 },
      { name: 'Zone 4: MG Road & City Centre Mall', desc: 'Branded footwear, lifestyle accessories, and electronics', count: 14 },
      { name: 'Zone 5: West Fort Commercial Corridor', desc: 'Hospitals, medical supplies, and pharmacy retail chains', count: 10 },
      { name: 'Zone 6: Round North & Silver Souk', desc: 'Silver jewellery, traditional vessels, and pooja stores', count: 8 },
      { name: 'Zone 7: Pattalam Road Wholesale Bazar', desc: 'Provisions, dry chillies, and bulk packaging materials', count: 6 },
    ],
  },

  'kochi / ernakulam': {
    city: 'Kochi / Ernakulam',
    district: 'Ernakulam District',
    zonesCount: 9,
    lat: 9.9816,
    lng: 76.2999,
    merchants: 60,
    users: 3800,
    zones: [
      { name: 'Zone 1: MG Road & Marine Drive Promenade', desc: 'Corporate flagships, luxury retail, electronics, and watches', count: 12 },
      { name: 'Zone 2: Edappally & Lulu Mall Corridor', desc: 'Mega shopping malls, entertainment, and lifestyle chains', count: 10 },
      { name: 'Zone 3: Kakkanad Infopark Commercial Belt', desc: 'Tech hub, youth cafes, co-working spaces, and IT services', count: 8 },
      { name: 'Zone 4: Broadway & Central Market Wholesale', desc: 'Traditional wholesale trade, spices, textiles, and imports', count: 7 },
      { name: 'Zone 5: Panampilly Nagar Boutique District', desc: 'Designer wear, gourmet dining, salons, and interiors', count: 6 },
      { name: 'Zone 6: Palarivattom Junction & Trade Hub', desc: 'Medical clinics, opticals, and consumer electronics', count: 5 },
      { name: 'Zone 7: Vytilla Mobility Hub Corridor', desc: 'Travel agencies, hotels, supermarkets, and fast food', count: 4 },
      { name: 'Zone 8: Kaloor Stadium Commercial Area', desc: 'Sports merchandise, automobile parts, and printing', count: 4 },
      { name: 'Zone 9: Fort Kochi & Mattancherry Tourist Souk', desc: 'Antiques, spice boutiques, art cafes, and handicrafts', count: 4 },
    ],
  },

  'thiruvananthapuram': {
    city: 'Thiruvananthapuram',
    district: 'Thiruvananthapuram District',
    zonesCount: 8,
    lat: 8.5241,
    lng: 76.9366,
    merchants: 24,
    users: 3100,
    zones: [
      { name: 'Zone 1: MG Road, Statue & Secretariat Corridor', desc: 'Government hub, books, textiles, and electronic stores', count: 5 },
      { name: 'Zone 2: Palayam & Chalai Traditional Market', desc: 'Centuries-old wholesale market, provisions, and vessels', count: 4 },
      { name: 'Zone 3: Technopark & Kazhakkoottam Corridor', desc: 'Tech corridors, cafes, bakeries, and modern dining', count: 3 },
      { name: 'Zone 4: East Fort & Padmanabhaswamy Area', desc: 'Pooja items, silks, jewellery, and traditional handicrafts', count: 3 },
      { name: 'Zone 5: Kowdiar & Vellayambalam Avenue', desc: 'Boutiques, luxury fitness, and premium lifestyle cafes', count: 3 },
      { name: 'Zone 6: Thampanoor Central Station & Bus Hub', desc: 'Travel logistics, hotels, books, and quick dining', count: 2 },
      { name: 'Zone 7: Pattom & Kesavadasapuram Belt', desc: 'Educational institutes, stationery, and home decor', count: 2 },
      { name: 'Zone 8: Karamana & Attukal Commercial Street', desc: 'Traditional hardware, vessels, textiles, and fruits', count: 2 },
    ],
  },

  'kottayam town': {
    city: 'Kottayam Town',
    district: 'Kottayam District',
    zonesCount: 4,
    lat: 9.5916,
    lng: 76.5222,
    merchants: 18,
    users: 1250,
    zones: [
      { name: 'Zone 1: Baker Junction & Kanjikuzhy Corridor', desc: 'Publishing houses, rubber goods, and banking institutions', count: 6 },
      { name: 'Zone 2: Nagampadam Bus Stand & Shastri Road', desc: 'Hotels, travel hubs, and commercial shopping arcades', count: 5 },
      { name: 'Zone 3: TB Road & Market Junction', desc: 'Wholesale provisions, spices, and hardware supplies', count: 4 },
      { name: 'Zone 4: Collectorate & Kalarickal Bazar', desc: 'Legal services, stationery, books, and pharmaceuticals', count: 3 },
    ],
  },

  'palakkad town': {
    city: 'Palakkad Town',
    district: 'Palakkad District',
    zonesCount: 5,
    lat: 10.7867,
    lng: 76.6548,
    merchants: 14,
    users: 1400,
    zones: [
      { name: 'Zone 1: GB Road & Sultanpet Commercial Area', desc: 'Automotive spares, hardware, and traditional groceries', count: 4 },
      { name: 'Zone 2: Fort Maidan & Stadium Road', desc: 'Sports goods, hotels, and agricultural equipment', count: 3 },
      { name: 'Zone 3: Robinson Road & Main Bazar', desc: 'Textiles, gold jewellery, and wedding purchases', count: 3 },
      { name: 'Zone 4: Head Post Office & College Road', desc: 'Books, stationery, opticals, and consumer electronics', count: 2 },
      { name: 'Zone 5: Olavakkode Railway Station Corridor', desc: 'Travel trade, lodges, restaurants, and logistics', count: 2 },
    ],
  },

  'kollam city': {
    city: 'Kollam City',
    district: 'Kollam District',
    zonesCount: 5,
    lat: 8.8932,
    lng: 76.6141,
    merchants: 12,
    users: 1500,
    zones: [
      { name: 'Zone 1: Chinnakada Clock Tower & Main Road', desc: 'Textile stores, gold jewellery, and clock shops', count: 4 },
      { name: 'Zone 2: Ashramam & Beach Road Corridor', desc: 'Hospitality, cashew processing retail, and spices', count: 3 },
      { name: 'Zone 3: Kadappakada Commercial Junction', desc: 'Supermarkets, clinics, and consumer durables', count: 2 },
      { name: 'Zone 4: Andamukkam City Bus Stand Hub', desc: 'Local retail, bakeries, and mobile repair centres', count: 2 },
      { name: 'Zone 5: Chamakkada Wholesale Market', desc: 'Wholesale rice, grains, spices, and dried fish', count: 1 },
    ],
  },

  'alappuzha town': {
    city: 'Alappuzha Town',
    district: 'Alappuzha District',
    zonesCount: 4,
    lat: 9.4981,
    lng: 76.3388,
    merchants: 10,
    users: 1180,
    zones: [
      { name: 'Zone 1: Mullakkal Street & Temple Bazar', desc: 'Gold shops, coir handicrafts, and traditional silk', count: 4 },
      { name: 'Zone 2: Boat Jetty & Finishing Point Corridor', desc: 'Resorts, tour operators, cafes, and seafood dining', count: 3 },
      { name: 'Zone 3: Cullen Road & Iron Bridge Market', desc: 'Hardware, metal fabrication, and marine supplies', count: 2 },
      { name: 'Zone 4: Beach Road & Tourism Commercial Strip', desc: 'Handicrafts, souvenir shops, and beachside dining', count: 1 },
    ],
  },

  'pathanamthitta town': {
    city: 'Pathanamthitta Town',
    district: 'Pathanamthitta District',
    zonesCount: 3,
    lat: 9.2648,
    lng: 76.7870,
    merchants: 8,
    users: 920,
    zones: [
      { name: 'Zone 1: Ring Road & Central Bus Stand', desc: 'Pilgrim hospitality, brass metalcraft, and provisions', count: 4 },
      { name: 'Zone 2: College Road Commercial Junction', desc: 'Stationery, books, footwear, and consumer retail', count: 2 },
      { name: 'Zone 3: Aban Junction Shopping Corridor', desc: 'Textiles, jewellery, and home appliances', count: 2 },
    ],
  },

  'kalpetta / wayanad': {
    city: 'Kalpetta / Wayanad',
    district: 'Wayanad District',
    zonesCount: 3,
    lat: 11.6103,
    lng: 76.0827,
    merchants: 6,
    users: 750,
    zones: [
      { name: 'Zone 1: Kalpetta Main Bazar & Bypass', desc: 'Eco-tourism gear, spices, forest honey, and organic produce', count: 3 },
      { name: 'Zone 2: Sulthan Bathery Town Commercial Belt', desc: 'Travel agencies, plantation supplies, and bakeries', count: 2 },
      { name: 'Zone 3: Mananthavady Market Junction', desc: 'Hill spices collection, tea stores, and agro provisions', count: 1 },
    ],
  },

  'thodupuzha / idukki': {
    city: 'Thodupuzha / Idukki',
    district: 'Idukki District',
    zonesCount: 3,
    lat: 9.8959,
    lng: 76.7184,
    merchants: 6,
    users: 680,
    zones: [
      { name: 'Zone 1: Thodupuzha River View & Town Hall Area', desc: 'Spices trading, hardware, timber, and supermarkets', count: 3 },
      { name: 'Zone 2: Mangattukavala Commercial Hub', desc: 'Automobile parts, consumer retail, and medicals', count: 2 },
      { name: 'Zone 3: Temple Road & Main Market Strip', desc: 'Textiles, footwear, groceries, and agro commodities', count: 1 },
    ],
  },
};

/**
 * Standard generator for custom or dynamic zones when count differs or town is custom added.
 * ALWAYS returns EXACTLY `expectedCount` zones.
 */
function generateDynamicZonesForTown(cityName, expectedCount) {
  const count = Math.max(1, parseInt(expectedCount) || 1);
  const zones = [];

  const zoneTemplates = [
    { title: 'Town Centre & Old Bus Stand Hub', desc: 'Central retail shops, gold jewellery, silks, and local bakeries' },
    { title: 'Commercial Corridor & Highway Belt', desc: 'Shopping arcades, supermarkets, electronics, and automobile showrooms' },
    { title: 'Market Road & Wholesale Bazar', desc: 'Wholesale provisions, spices, hardware, and packaging supplies' },
    { title: 'Bypass Road & Retail Complex', desc: 'Departmental stores, consumer durables, and modern dining' },
    { title: 'Hospital Road & Medical Hub', desc: 'Multi-speciality clinics, pharmacies, opticals, and diagnostic labs' },
    { title: 'Station Road & Transport Junction', desc: 'Hotels, travel booking centres, footwear, and mobile galleries' },
    { title: 'Temple / Cultural Souk Area', desc: 'Handicrafts, traditional textiles, gifts, and sweet stalls' },
    { title: 'Industrial & Trade Logistics Zone', desc: 'Building materials, timber, fabrication, and agro commodities' },
    { title: 'Suburban Growth Corridor', desc: 'Expanding residential retail, groceries, and home utility stores' },
    { title: 'North Junction Commercial Arcade', desc: 'Local consumer shops, vehicle garages, and service providers' },
  ];

  for (let i = 1; i <= count; i++) {
    const template = zoneTemplates[(i - 1) % zoneTemplates.length];
    zones.push({
      name: `Zone ${i}: ${cityName} ${template.title}`,
      desc: template.desc,
      count: Math.max(2, Math.round(30 / count)),
    });
  }

  return zones;
}

/**
 * Retrieves the exact commercial zones for any city/town.
 * GUARANTEES: The returned `zones` array length EXACTLY MATCHES `expectedCount` (or db count).
 *
 * @param {string} cityName - e.g. "Payyanur", "Taliparamba", "Kannur City"
 * @param {string} districtName - e.g. "Kannur District, Kerala"
 * @param {number} [targetZonesCount] - Count from PostgreSQL database (row.zones)
 * @returns {Object} { city, district, zonesCount, zones: Array(exactCount) }
 */
export function getExactZonesForTown(cityName, districtName, targetZonesCount) {
  if (!cityName) {
    return {
      city: 'Kerala Commercial Hub',
      district: districtName || 'Kerala',
      zonesCount: 3,
      zones: generateDynamicZonesForTown('Kerala Town', 3),
    };
  }

  const rawClean = cityName.toLowerCase().trim();
  const searchKey = rawClean.replace(/[^a-z0-9 ]/g, '').trim();

  // 1. Direct or partial key match in Master Dictionary
  let masterEntry = null;
  for (const [key, val] of Object.entries(KERALA_TOWN_ZONES_MASTER)) {
    if (key === searchKey || searchKey.startsWith(key) || key.startsWith(searchKey)) {
      masterEntry = val;
      break;
    }
  }

  // 2. Secondary check for compound names like "Kochi / Ernakulam", "Calicut City"
  if (!masterEntry) {
    for (const [key, val] of Object.entries(KERALA_TOWN_ZONES_MASTER)) {
      const parts = key.split(' ');
      const townHead = parts[0];
      if (searchKey.includes(townHead) || townHead.includes(searchKey.split(' ')[0])) {
        masterEntry = val;
        break;
      }
    }
  }

  // Desired count: prioritizes row.zones from PostgreSQL if valid, else masterEntry.zonesCount, else 3
  const finalCount =
    targetZonesCount !== undefined && parseInt(targetZonesCount) > 0
      ? parseInt(targetZonesCount)
      : masterEntry
      ? masterEntry.zonesCount
      : 3;

  if (masterEntry) {
    let zonesList = [...masterEntry.zones];

    // If database row specified the exact count and it matches, return directly
    if (zonesList.length === finalCount) {
      return {
        ...masterEntry,
        city: cityName,
        district: districtName || masterEntry.district,
        zonesCount: finalCount,
        zones: zonesList,
      };
    }

    // If database specifies more zones than master list, expand dynamically
    if (finalCount > zonesList.length) {
      const extraNeeded = finalCount - zonesList.length;
      const extraZones = generateDynamicZonesForTown(cityName, finalCount).slice(zonesList.length);
      zonesList = [...zonesList, ...extraZones];
    } else if (finalCount < zonesList.length) {
      // If database specifies fewer zones, take first N
      zonesList = zonesList.slice(0, finalCount);
    }

    return {
      ...masterEntry,
      city: cityName,
      district: districtName || masterEntry.district,
      zonesCount: finalCount,
      zones: zonesList,
    };
  }

  // 3. Fallback for custom added town
  const dynamicZones = generateDynamicZonesForTown(cityName, finalCount);
  return {
    city: cityName,
    district: districtName || 'Kerala',
    zonesCount: finalCount,
    lat: 10.8505,
    lng: 76.2711,
    merchants: 0,
    users: 0,
    zones: dynamicZones,
  };
}
