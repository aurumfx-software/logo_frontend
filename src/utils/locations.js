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
  },
  'Karnataka': {
    'Bengaluru': ['Bengaluru Urban', 'Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar', 'HSR Layout'],
    'Mysuru': ['Mysuru City', 'Hunsur', 'Nanjangud'],
    'Dakshina Kannada': ['Mangaluru City', 'Uptown Mangalore', 'Bantwal', 'Puttur'],
    'Hubballi-Dharwad': ['Hubballi City', 'Dharwad'],
  },
  'Maharashtra': {
    'Mumbai': ['South Mumbai', 'Andheri', 'Bandra', 'Borivali', 'Thane', 'Navi Mumbai'],
    'Pune': ['Pune City', 'Pimpri-Chinchwad', 'Kothrud', 'Hinjewadi'],
    'Nagpur': ['Nagpur City', 'Kamptee'],
  },
  'Delhi': {
    'Central Delhi': ['Connaught Place', 'Karol Bagh'],
    'South Delhi': ['Hauz Khas', 'Saket', 'Vasant Kunj'],
    'North Delhi': ['Civil Lines', 'Pitampura'],
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
