export const STATE_ZONES = {
  'South': ['Kerala', 'Tamil Nadu', 'Karnataka', 'Telangana', 'Andhra Pradesh', 'Puducherry', 'Lakshadweep'],
  'North': ['Delhi', 'Punjab', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Ladakh', 'Uttar Pradesh', 'Uttarakhand', 'Chandigarh'],
  'West': ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa', 'Dadra and Nagar Haveli and Daman and Diu'],
  'East': ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
  'Central & NE': ['Madhya Pradesh', 'Chhattisgarh', 'Assam', 'Sikkim', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland', 'Tripura', 'Arunachal Pradesh', 'Andaman and Nicobar Islands']
};

export const STATE_DISTRICT_REGIONS = {
  'Kerala': {
    'Kannur': ['Payyanur', 'Kannur City', 'Taliparamba', 'Iritty', 'Thaliparamba', 'Sreekandapuram', 'Kuthuparamba', 'Mattannur', 'Panoor', 'Anthoor'],
    'Kozhikode': ['Kozhikode City', 'Calicut', 'Vadakara', 'Koyilandy', 'Ramanattukara', 'Feroke', 'Perambra', 'Quilandy'],
    'Ernakulam': ['Kochi', 'Aluva', 'Perumbavoor', 'Angamaly', 'Kothamangalam', 'Muvattupuzha', 'Thrippunithura', 'North Paravur'],
    'Thrissur': ['Thrissur City', 'Chalakudy', 'Kodungallur', 'Guruvayur', 'Kunnamkulam', 'Irinjalakuda'],
    'Malappuram': ['Malappuram City', 'Tirur', 'Manjeri', 'Perinthalmanna', 'Nilambur', 'Ponnani', 'Kondotty'],
    'Palakkad': ['Palakkad City', 'Ottapalam', 'Shoranur', 'Mannarkkad', 'Alathur', 'Chittur'],
    'Thiruvananthapuram': ['Thiruvananthapuram City', 'Neyyattinkara', 'Nedumangad', 'Varkala', 'Attingal'],
    'Kollam': ['Kollam City', 'Karunagappally', 'Kottarakkara', 'Punalur', 'Chavara'],
    'Alappuzha': ['Alappuzha City', 'Cherthala', 'Kayamkulam', 'Haripad', 'Chengannur'],
    'Kottayam': ['Kottayam City', 'Pala', 'Changanacherry', 'Vaikom', 'Ettumanoor'],
    'Idukki': ['Munnar', 'Thodupuzha', 'Adimali', 'Nedumkandam', 'Kumily'],
    'Wayanad': ['Kalpetta', 'Mananthavady', 'Sulthan Bathery', 'Vythiri'],
    'Kasaragod': ['Kasaragod City', 'Kanhangad', 'Hosdurg', 'Bekal', 'Nileshwar'],
    'Pathanamthitta': ['Pathanamthitta City', 'Thiruvalla', 'Adoor', 'Pandalam', 'Ranny'],
  },
  'Tamil Nadu': {
    'Chennai': ['Chennai Central', 'Adyar', 'T. Nagar', 'Velachery', 'Anna Nagar', 'Mylapore', 'Tambaram'],
    'Coimbatore': ['Coimbatore City', 'Pollachi', 'Mettupalayam', 'Udumalaipettai'],
    'Madurai': ['Madurai City', 'Melur', 'Tirumangalam'],
    'Salem': ['Salem City', 'Attur', 'Mettur'],
    'Tiruchirappalli': ['Trichy City', 'Srirangam', 'Lalgudi'],
    'Tirunelveli': ['Tirunelveli City', 'Palayamkottai', 'Ambasamudram'],
    'Vellore': ['Vellore City', 'Katpadi', 'Gudiyatham'],
    'Erode': ['Erode City', 'Gobichettipalayam', 'Bhavani'],
    'Kanchipuram': ['Kanchipuram City', 'Sriperumbudur'],
    'Tiruppur': ['Tiruppur City', 'Avinashi'],
  },
  'Karnataka': {
    'Bengaluru': ['Bengaluru Urban', 'Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar', 'HSR Layout'],
    'Mysuru': ['Mysuru City', 'Hunsur', 'Nanjangud'],
    'Dakshina Kannada': ['Mangaluru City', 'Uptown Mangalore', 'Bantwal', 'Puttur'],
    'Hubballi-Dharwad': ['Hubballi City', 'Dharwad'],
    'Belagavi': ['Belagavi City', 'Gokak', 'Chikkodi'],
    'Udupi': ['Udupi City', 'Manipal', 'Kundapura'],
    'Shivamogga': ['Shivamogga City', 'Bhadravathi'],
    'Tumakuru': ['Tumakuru City', 'Tiptur'],
  },
  'Maharashtra': {
    'Mumbai': ['South Mumbai', 'Andheri', 'Bandra', 'Borivali', 'Thane', 'Navi Mumbai'],
    'Pune': ['Pune City', 'Pimpri-Chinchwad', 'Kothrud', 'Hinjewadi'],
    'Nagpur': ['Nagpur City', 'Kamptee'],
    'Nashik': ['Nashik City', 'Deolali', 'Malegaon'],
    'Aurangabad': ['Aurangabad City', 'Paithan'],
    'Solapur': ['Solapur City', 'Pandharpur'],
    'Kolhapur': ['Kolhapur City', 'Ichalkaranji'],
  },
  'Delhi': {
    'Central Delhi': ['Connaught Place', 'Karol Bagh'],
    'South Delhi': ['Hauz Khas', 'Saket', 'Vasant Kunj'],
    'North Delhi': ['Civil Lines', 'Pitampura'],
    'East Delhi': ['Laxmi Nagar', 'Mayur Vihar'],
    'West Delhi': ['Rajouri Garden', 'Janakpuri'],
    'New Delhi': ['Chanakyapuri', 'Lodi Road'],
  },
  'Telangana': {
    'Hyderabad': ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Secunderabad'],
    'Warangal': ['Warangal City', 'Hanamkonda', 'Kazipet'],
    'Nizamabad': ['Nizamabad City', 'Armoor'],
    'Karimnagar': ['Karimnagar City', 'Ramagundam'],
    'Khammam': ['Khammam City', 'Palwancha'],
  },
  'Andhra Pradesh': {
    'Visakhapatnam': ['Vizag City', 'Gajuwaka', 'Anakapalle'],
    'Vijayawada': ['Vijayawada City', 'Gannavaram', 'Mangalagiri'],
    'Guntur': ['Guntur City', 'Tenali'],
    'Tirupati': ['Tirupati City', 'Chittoor'],
    'Kurnool': ['Kurnool City', 'Nandyal'],
    'Nellore': ['Nellore City', 'Gudur'],
  },
  'Gujarat': {
    'Ahmedabad': ['Navrangpura', 'Satellite', 'SG Highway', 'Maninagar'],
    'Surat': ['Adajan', 'Varachha', 'Vesu'],
    'Vadodara': ['Alkapuri', 'Sayajigunj', 'Gotri'],
    'Rajkot': ['Kalawad Road', 'Race Course'],
    'Bhavnagar': ['Bhavnagar City', 'Mahuva'],
    'Gandhinagar': ['Gandhinagar City', 'Kalol'],
  },
  'Rajasthan': {
    'Jaipur': ['Pink City', 'Malviya Nagar', 'Vaishali Nagar'],
    'Jodhpur': ['Jodhpur City', 'Ratanada'],
    'Udaipur': ['Udaipur City', 'Fatehpura'],
    'Kota': ['Kota City', 'Vigyan Nagar'],
    'Ajmer': ['Ajmer City', 'Pushkar'],
  },
  'West Bengal': {
    'Kolkata': ['Park Street', 'Salt Lake', 'New Town', 'Ballygunge'],
    'Howrah': ['Howrah Station', 'Shibpur'],
    'Siliguri': ['Siliguri City', 'Matigara'],
    'Durgapur': ['Durgapur City', 'City Centre'],
    'Asansol': ['Asansol City', 'Raniganj'],
  },
  'Uttar Pradesh': {
    'Lucknow': ['Hazratganj', 'Gomti Nagar', 'Alambagh'],
    'Kanpur': ['Civil Lines', 'Swaroop Nagar'],
    'Noida': ['Sector 18', 'Sector 62', 'Greater Noida'],
    'Varanasi': ['Varanasi City', 'Sarnath'],
    'Agra': ['Taj Ganj', 'Sanjay Place'],
    'Ghaziabad': ['Indirapuram', 'Raj Nagar'],
    'Prayagraj': ['Civil Lines', 'Katral'],
  },
  'Madhya Pradesh': {
    'Bhopal': ['Arera Colony', 'MP Nagar'],
    'Indore': ['Vijay Nagar', 'Palasia'],
    'Gwalior': ['Gwalior Fort Area', 'Lashkar'],
    'Jabalpur': ['Civil Lines', 'Wright Town'],
  },
  'Bihar': {
    'Patna': ['Boring Road', 'Kankerbagh'],
    'Gaya': ['Gaya City', 'Bodh Gaya'],
    'Bhagalpur': ['Bhagalpur City', 'Nathnagar'],
    'Muzaffarpur': ['Muzaffarpur City', 'Kanti'],
  },
  'Odisha': {
    'Bhubaneswar': ['Saheed Nagar', 'Patia'],
    'Cuttack': ['Badambadi', 'CDS Bidanasi'],
    'Rourkela': ['Civil Township', 'Sector 5'],
    'Puri': ['Grand Road', 'Swargadwar'],
  },
  'Chhattisgarh': {
    'Raipur': ['Pandri', 'Civil Lines'],
    'Bhilai': ['Sector 6', 'Durg'],
    'Bilaspur': ['Vyapar Vihar', 'Link Road'],
  },
  'Punjab': {
    'Ludhiana': ['Sarabha Nagar', 'Model Town'],
    'Amritsar': ['Golden Temple Area', 'Ranjit Avenue'],
    'Jalandhar': ['Model Town', 'Civil Lines'],
    'Mohali': ['Phase 7', 'Phase 3B2'],
  },
  'Haryana': {
    'Gurugram': ['DLF Phase 1-5', 'Cyber Hub', 'Golf Course Road'],
    'Faridabad': ['Sector 15', 'NIT Faridabad'],
    'Panipat': ['GT Road', 'Model Town'],
    'Ambala': ['Ambala Cantt', 'Ambala City'],
  },
  'Goa': {
    'North Goa': ['Panaji', 'Calangute', 'Candolim', 'Mapusa'],
    'South Goa': ['Margao', 'Vasco da Gama', 'Colva'],
  },
  'Assam': {
    'Guwahati': ['GS Road', 'Dispur', 'Zoo Road'],
    'Silchar': ['Silchar City', 'Tarapur'],
    'Dibrugarh': ['Dibrugarh Town', 'Chowkidinghee'],
  },
  'Himachal Pradesh': {
    'Shimla': ['Mall Road', 'Chotta Shimla'],
    'Dharamshala': ['McLeod Ganj', 'Kotwali Bazar'],
    'Manali': ['Mall Road', 'Old Manali'],
  },
  'Jammu & Kashmir': {
    'Srinagar': ['Lal Chowk', 'Rajbagh'],
    'Jammu': ['Gandhi Nagar', 'Trikuta Nagar'],
  },
  'Uttarakhand': {
    'Dehradun': ['Rajpur Road', 'Clock Tower'],
    'Haridwar': ['Har Ki Pauri', 'Kankhal'],
    'Rishikesh': ['Triveni Ghat', 'Tapovan'],
  },
  'Jharkhand': {
    'Ranchi': ['Main Road', 'Kanke Road'],
    'Jamshedpur': ['Bistupur', 'Sakchi'],
    'Dhanbad': ['Bank More', 'Saraidhela'],
  },
  'Puducherry': {
    'Puducherry': ['White Town', 'Heritage Town'],
    'Karaikal': ['Karaikal Port Area'],
  },
  'Chandigarh': {
    'Chandigarh': ['Sector 17', 'Sector 35', 'Elante Area'],
  },
  'Tripura': {
    'Agartala': ['Agartala Town', 'Banamalipur'],
  },
  'Meghalaya': {
    'Shillong': ['Police Bazar', 'Laitumkhrah'],
  },
  'Manipur': {
    'Imphal': ['Thangal Bazar', 'Paona Bazar'],
  },
  'Nagaland': {
    'Kohima': ['Kohima Town', 'PR Hill'],
    'Dimapur': ['Commercial Area', 'Hong Kong Market'],
  },
  'Mizoram': {
    'Aizawl': ['Zarkawt', 'Chanmari'],
  },
  'Arunachal Pradesh': {
    'Itanagar': ['Itanagar Market', 'Ganga'],
  },
  'Sikkim': {
    'Gangtok': ['MG Marg', 'Deorali'],
  },
  'Ladakh': {
    'Leh': ['Leh Main Market', 'Changspa'],
  },
  'Andaman and Nicobar Islands': {
    'Port Blair': ['Aberdeen Bazaar', 'Haddo'],
  },
  'Dadra and Nagar Haveli and Daman and Diu': {
    'Daman': ['Nani Daman', 'Moti Daman'],
    'Silvassa': ['Silvassa City', 'Amli'],
  },
  'Lakshadweep': {
    'Kavaratti': ['Kavaratti Island'],
  }
};

export const DEFAULT_STATE = 'Kerala';
export const DEFAULT_DISTRICT = 'Kannur';

export const getStateForDistrict = (district, defaultState = DEFAULT_STATE) => {
  if (!district) return defaultState;
  for (const [state, districts] of Object.entries(STATE_DISTRICT_REGIONS)) {
    if (districts[district]) return state;
  }
  return defaultState;
};

export const getStatesList = () => Object.keys(STATE_DISTRICT_REGIONS);

export const getDistrictsForState = (state) => {
  const stateObj = STATE_DISTRICT_REGIONS[state] || STATE_DISTRICT_REGIONS[DEFAULT_STATE] || {};
  return Object.keys(stateObj);
};

export const getCitiesForDistrict = (state, district) => {
  const stateObj = STATE_DISTRICT_REGIONS[state] || STATE_DISTRICT_REGIONS[DEFAULT_STATE] || {};
  return stateObj[district] || [];
};

export const getDistrictsForStates = (statesArray = []) => {
  const effectiveStates = Array.isArray(statesArray) && statesArray.length > 0
    ? statesArray
    : Object.keys(STATE_DISTRICT_REGIONS);

  const districtsSet = new Set();
  effectiveStates.forEach((st) => {
    const districtsMap = STATE_DISTRICT_REGIONS[st] || {};
    Object.keys(districtsMap).forEach((d) => districtsSet.add(d));
  });
  return Array.from(districtsSet);
};

export const getCitiesForDistricts = (statesArray = [], districtsArray = []) => {
  const effectiveStates = Array.isArray(statesArray) && statesArray.length > 0
    ? statesArray
    : Object.keys(STATE_DISTRICT_REGIONS);

  const districtsSet = Array.isArray(districtsArray) && districtsArray.length > 0
    ? new Set(districtsArray)
    : null;

  const citiesSet = new Set();
  effectiveStates.forEach((st) => {
    const districtsMap = STATE_DISTRICT_REGIONS[st] || {};
    Object.entries(districtsMap).forEach(([distName, cities]) => {
      if (!districtsSet || districtsSet.has(distName)) {
        cities.forEach((c) => citiesSet.add(c));
      }
    });
  });

  return Array.from(citiesSet);
};
