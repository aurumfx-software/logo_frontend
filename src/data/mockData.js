// Mock data for the admin dashboard

export const dashboardStats = {
  totalUsers: 24850,
  totalMerchants: 3420,
  totalSearches: 185600,
  totalRevenue: 48500,
  userGrowth: '+12.5%',
  merchantGrowth: '+8.3%',
  searchGrowth: '+22.1%',
  revenueGrowth: '+15.7%',
};

export const platformGrowthData = [
  { month: 'Jan', users: 12000, merchants: 1800, searches: 85000 },
  { month: 'Feb', users: 14200, merchants: 2100, searches: 95000 },
  { month: 'Mar', users: 15800, merchants: 2350, searches: 110000 },
  { month: 'Apr', users: 17500, merchants: 2600, searches: 125000 },
  { month: 'May', users: 19200, merchants: 2800, searches: 142000 },
  { month: 'Jun', users: 21000, merchants: 3050, searches: 158000 },
  { month: 'Jul', users: 22800, merchants: 3200, searches: 170000 },
  { month: 'Aug', users: 24850, merchants: 3420, searches: 185600 },
];

export const categoryDistribution = [
  { name: 'Shopping', value: 850, color: '#FF6B6B' },
  { name: 'Food & Dining', value: 620, color: '#FFB946' },
  { name: 'Health', value: 480, color: '#3B82F6' },
  { name: 'Education', value: 390, color: '#9C27B0' },
  { name: 'Services', value: 560, color: '#FF9800' },
  { name: 'Banking', value: 320, color: '#10B981' },
  { name: 'Government', value: 200, color: '#607D8B' },
];

export const recentActivity = [
  { id: 1, type: 'registration', text: '<strong>Metro Supermarket</strong> submitted a registration request', time: '2 minutes ago', color: '#6C63FF', bgColor: '#F0EFFF' },
  { id: 2, type: 'approval', text: '<strong>City Pharmacy</strong> was approved by Admin', time: '15 minutes ago', color: '#10B981', bgColor: '#D1FAE5' },
  { id: 3, type: 'complaint', text: 'New complaint from <strong>User #4521</strong> regarding <strong>Quick Fix Repairs</strong>', time: '32 minutes ago', color: '#EF4444', bgColor: '#FEE2E2' },
  { id: 4, type: 'user', text: '<strong>25 new users</strong> registered today', time: '1 hour ago', color: '#3B82F6', bgColor: '#DBEAFE' },
  { id: 5, type: 'promotion', text: '<strong>Summer Sale Banner</strong> was activated', time: '2 hours ago', color: '#FFB946', bgColor: '#FEF3C7' },
  { id: 6, type: 'suspension', text: '<strong>ABC Electronics</strong> was suspended for policy violation', time: '3 hours ago', color: '#EF4444', bgColor: '#FEE2E2' },
];

export const registrationRequests = [
  { id: 'REG-001', name: 'Metro Supermarket', category: 'Shopping', email: 'contact@metrosuper.com', phone: '+91 98765 43210', date: '2024-09-14', status: 'pending', city: 'Mumbai' },
  { id: 'REG-002', name: 'Fresh Bites Kitchen', category: 'Food & Dining', email: 'info@freshbites.in', phone: '+91 87654 32109', date: '2024-09-14', status: 'pending', city: 'Bangalore' },
  { id: 'REG-003', name: 'City Eye Hospital', category: 'Health', email: 'admin@cityeye.com', phone: '+91 76543 21098', date: '2024-09-13', status: 'approved', city: 'Delhi' },
  { id: 'REG-004', name: 'Quick Fix Repairs', category: 'Services', email: 'help@quickfix.com', phone: '+91 65432 10987', date: '2024-09-13', status: 'approved', city: 'Chennai' },
  { id: 'REG-005', name: 'Green Grocers', category: 'Shopping', email: 'orders@greengrocers.in', phone: '+91 54321 09876', date: '2024-09-12', status: 'rejected', city: 'Hyderabad' },
  { id: 'REG-006', name: 'Smart Learn Academy', category: 'Education', email: 'info@smartlearn.com', phone: '+91 43210 98765', date: '2024-09-12', status: 'pending', city: 'Pune' },
  { id: 'REG-007', name: 'Royal Jewellers', category: 'Shopping', email: 'shop@royaljewel.com', phone: '+91 32109 87654', date: '2024-09-11', status: 'pending', city: 'Jaipur' },
  { id: 'REG-008', name: 'Fitness Zone Gym', category: 'Health', email: 'join@fitnesszone.in', phone: '+91 21098 76543', date: '2024-09-11', status: 'approved', city: 'Mumbai' },
  { id: 'REG-009', name: 'Pet Paradise', category: 'Services', email: 'hello@petparadise.com', phone: '+91 10987 65432', date: '2024-09-10', status: 'pending', city: 'Bangalore' },
  { id: 'REG-010', name: 'Book Haven', category: 'Education', email: 'info@bookhaven.in', phone: '+91 98712 34567', date: '2024-09-10', status: 'rejected', city: 'Kolkata' },
  { id: 'REG-011', name: 'Spice Route Restaurant', category: 'Food & Dining', email: 'dine@spiceroute.com', phone: '+91 87612 34567', date: '2024-09-09', status: 'pending', city: 'Kochi' },
  { id: 'REG-012', name: 'Urban Threads Boutique', category: 'Shopping', email: 'shop@urbanthreads.com', phone: '+91 76512 34567', date: '2024-09-09', status: 'pending', city: 'Goa' },
];

export const categories = [
  {
    id: 'cat-1', name: 'Shopping', icon: '🛍️', count: 850, status: 'active',
    subcategories: ['Grocery', 'Electronics', 'Fashion', 'Jewellery', 'Home & Furniture', 'Books & Stationery'],
  },
  {
    id: 'cat-2', name: 'Food & Dining', icon: '🍽️', count: 620, status: 'active',
    subcategories: ['Restaurants', 'Cafes', 'Bakeries', 'Street Food', 'Cloud Kitchen', 'Catering'],
  },
  {
    id: 'cat-3', name: 'Health & Wellness', icon: '🏥', count: 480, status: 'active',
    subcategories: ['Hospitals', 'Clinics', 'Pharmacy', 'Gym & Fitness', 'Yoga & Meditation', 'Dental'],
  },
  {
    id: 'cat-4', name: 'Education', icon: '🎓', count: 390, status: 'active',
    subcategories: ['Schools', 'Colleges', 'Coaching', 'Libraries', 'Online Courses', 'Skill Training'],
  },
  {
    id: 'cat-5', name: 'Services', icon: '🔧', count: 560, status: 'active',
    subcategories: ['Plumbing', 'Electrical', 'Cleaning', 'Salon & Spa', 'Car Service', 'Courier'],
  },
  {
    id: 'cat-6', name: 'Banking & Finance', icon: '🏦', count: 320, status: 'active',
    subcategories: ['Banks', 'ATMs', 'Insurance', 'Mutual Funds', 'Loan Services', 'CA & Tax'],
  },
  {
    id: 'cat-7', name: 'Government', icon: '🏛️', count: 200, status: 'active',
    subcategories: ['Post Office', 'Passport Office', 'Courts', 'Police Station', 'RTO', 'Municipality'],
  },
  {
    id: 'cat-8', name: 'Travel & Transport', icon: '✈️', count: 180, status: 'inactive',
    subcategories: ['Hotels', 'Travel Agency', 'Car Rental', 'Bus Station', 'Railway Station', 'Airport'],
  },
];

export const merchants = [
  { id: 'MER-001', name: 'Metro Supermarket', category: 'Shopping', city: 'Mumbai', status: 'active', rating: 4.5, reviews: 328, joined: '2024-01-15' },
  { id: 'MER-002', name: 'Fresh Bites Kitchen', category: 'Food & Dining', city: 'Bangalore', status: 'active', rating: 4.8, reviews: 512, joined: '2024-02-20' },
  { id: 'MER-003', name: 'City Eye Hospital', category: 'Health', city: 'Delhi', status: 'active', rating: 4.3, reviews: 186, joined: '2024-03-10' },
  { id: 'MER-004', name: 'Quick Fix Repairs', category: 'Services', city: 'Chennai', status: 'suspended', rating: 3.2, reviews: 94, joined: '2024-04-05' },
  { id: 'MER-005', name: 'Green Grocers', category: 'Shopping', city: 'Hyderabad', status: 'inactive', rating: 4.1, reviews: 245, joined: '2024-01-28' },
  { id: 'MER-006', name: 'Smart Learn Academy', category: 'Education', city: 'Pune', status: 'active', rating: 4.6, reviews: 389, joined: '2024-05-12' },
  { id: 'MER-007', name: 'Royal Jewellers', category: 'Shopping', city: 'Jaipur', status: 'active', rating: 4.9, reviews: 621, joined: '2024-02-01' },
  { id: 'MER-008', name: 'Fitness Zone Gym', category: 'Health', city: 'Mumbai', status: 'active', rating: 4.4, reviews: 278, joined: '2024-06-18' },
  { id: 'MER-009', name: 'Pet Paradise', category: 'Services', city: 'Bangalore', status: 'active', rating: 4.7, reviews: 156, joined: '2024-07-22' },
  { id: 'MER-010', name: 'Book Haven', category: 'Education', city: 'Kolkata', status: 'suspended', rating: 3.8, reviews: 112, joined: '2024-03-30' },
  { id: 'MER-011', name: 'Spice Route Restaurant', category: 'Food & Dining', city: 'Kochi', status: 'active', rating: 4.5, reviews: 445, joined: '2024-04-15' },
  { id: 'MER-012', name: 'Urban Threads Boutique', category: 'Shopping', city: 'Goa', status: 'active', rating: 4.2, reviews: 203, joined: '2024-08-01' },
];

export const users = [
  { id: 'USR-001', name: 'Rahul Sharma', email: 'rahul@email.com', city: 'Mumbai', status: 'active', joined: '2024-01-10', searches: 145, lastActive: '2024-09-14' },
  { id: 'USR-002', name: 'Priya Patel', email: 'priya@email.com', city: 'Bangalore', status: 'active', joined: '2024-02-15', searches: 289, lastActive: '2024-09-14' },
  { id: 'USR-003', name: 'Amit Kumar', email: 'amit@email.com', city: 'Delhi', status: 'active', joined: '2024-03-20', searches: 178, lastActive: '2024-09-13' },
  { id: 'USR-004', name: 'Sneha Reddy', email: 'sneha@email.com', city: 'Hyderabad', status: 'suspended', joined: '2024-04-05', searches: 56, lastActive: '2024-08-20' },
  { id: 'USR-005', name: 'Vivek Joshi', email: 'vivek@email.com', city: 'Pune', status: 'active', joined: '2024-05-12', searches: 234, lastActive: '2024-09-14' },
  { id: 'USR-006', name: 'Anjali Singh', email: 'anjali@email.com', city: 'Chennai', status: 'active', joined: '2024-06-18', searches: 312, lastActive: '2024-09-13' },
  { id: 'USR-007', name: 'Karthik Nair', email: 'karthik@email.com', city: 'Kochi', status: 'active', joined: '2024-07-01', searches: 189, lastActive: '2024-09-12' },
  { id: 'USR-008', name: 'Meera Gupta', email: 'meera@email.com', city: 'Kolkata', status: 'inactive', joined: '2024-02-28', searches: 23, lastActive: '2024-07-15' },
  { id: 'USR-009', name: 'Arjun Menon', email: 'arjun@email.com', city: 'Bangalore', status: 'active', joined: '2024-08-10', searches: 98, lastActive: '2024-09-14' },
  { id: 'USR-010', name: 'Divya Sharma', email: 'divya@email.com', city: 'Jaipur', status: 'active', joined: '2024-03-15', searches: 267, lastActive: '2024-09-13' },
];

export const promotions = [
  { id: 'BNR-001', title: 'Summer Sale 2024', type: 'Banner', placement: 'Home Top', startDate: '2024-09-01', endDate: '2024-09-30', status: 'active', impressions: 45200, clicks: 3240 },
  { id: 'BNR-002', title: 'New Restaurant Week', type: 'Featured', placement: 'Food Category', startDate: '2024-09-10', endDate: '2024-09-17', status: 'active', impressions: 28100, clicks: 2180 },
  { id: 'BNR-003', title: 'Diwali Special Offers', type: 'Banner', placement: 'Home Top', startDate: '2024-10-15', endDate: '2024-11-05', status: 'pending', impressions: 0, clicks: 0 },
  { id: 'BNR-004', title: 'Health Check Camp', type: 'Promotion', placement: 'Health Category', startDate: '2024-08-15', endDate: '2024-08-31', status: 'inactive', impressions: 35600, clicks: 2890 },
  { id: 'BNR-005', title: 'Back to School', type: 'Featured', placement: 'Education Category', startDate: '2024-06-01', endDate: '2024-06-30', status: 'inactive', impressions: 42300, clicks: 3560 },
  { id: 'BNR-006', title: 'Weekend Dining Deals', type: 'Promotion', placement: 'Home Middle', startDate: '2024-09-13', endDate: '2024-09-15', status: 'active', impressions: 8900, clicks: 720 },
];

export const complaints = [
  { id: 'CMP-001', user: 'Rahul Sharma', merchant: 'Quick Fix Repairs', subject: 'Poor service quality', priority: 'high', status: 'open', date: '2024-09-14', category: 'Service Quality' },
  { id: 'CMP-002', user: 'Priya Patel', merchant: 'Green Grocers', subject: 'Wrong items delivered', priority: 'medium', status: 'in-progress', date: '2024-09-13', category: 'Order Issue' },
  { id: 'CMP-003', user: 'Amit Kumar', merchant: 'Book Haven', subject: 'Refund not processed', priority: 'high', status: 'open', date: '2024-09-13', category: 'Payment' },
  { id: 'CMP-004', user: 'Sneha Reddy', merchant: 'Metro Supermarket', subject: 'Misleading listing info', priority: 'low', status: 'resolved', date: '2024-09-12', category: 'Listing Accuracy' },
  { id: 'CMP-005', user: 'Vivek Joshi', merchant: 'City Eye Hospital', subject: 'Appointment scheduling issue', priority: 'medium', status: 'in-progress', date: '2024-09-12', category: 'Service Quality' },
  { id: 'CMP-006', user: 'Anjali Singh', merchant: 'Fitness Zone Gym', subject: 'Membership charge dispute', priority: 'high', status: 'open', date: '2024-09-11', category: 'Payment' },
  { id: 'CMP-007', user: 'Karthik Nair', merchant: 'Royal Jewellers', subject: 'Product authenticity concern', priority: 'high', status: 'open', date: '2024-09-11', category: 'Product Quality' },
  { id: 'CMP-008', user: 'Meera Gupta', merchant: 'Smart Learn Academy', subject: 'Course content not as described', priority: 'medium', status: 'resolved', date: '2024-09-10', category: 'Listing Accuracy' },
];

export const geographyData = [
  { id: 'GEO-001', city: 'Mumbai', state: 'Maharashtra', zones: 12, merchants: 820, users: 5400, status: 'active' },
  { id: 'GEO-002', city: 'Bangalore', state: 'Karnataka', zones: 10, merchants: 650, users: 4200, status: 'active' },
  { id: 'GEO-003', city: 'Delhi', state: 'Delhi', zones: 8, merchants: 580, users: 3800, status: 'active' },
  { id: 'GEO-004', city: 'Chennai', state: 'Tamil Nadu', zones: 7, merchants: 420, users: 2900, status: 'active' },
  { id: 'GEO-005', city: 'Hyderabad', state: 'Telangana', zones: 6, merchants: 380, users: 2600, status: 'active' },
  { id: 'GEO-006', city: 'Pune', state: 'Maharashtra', zones: 5, merchants: 310, users: 2100, status: 'active' },
  { id: 'GEO-007', city: 'Kolkata', state: 'West Bengal', zones: 4, merchants: 180, users: 1200, status: 'active' },
  { id: 'GEO-008', city: 'Jaipur', state: 'Rajasthan', zones: 3, merchants: 120, users: 800, status: 'active' },
  { id: 'GEO-009', city: 'Kochi', state: 'Kerala', zones: 3, merchants: 95, users: 650, status: 'active' },
  { id: 'GEO-010', city: 'Goa', state: 'Goa', zones: 2, merchants: 65, users: 400, status: 'pending' },
  { id: 'GEO-011', city: 'Lucknow', state: 'Uttar Pradesh', zones: 0, merchants: 0, users: 0, status: 'pending' },
  { id: 'GEO-012', city: 'Ahmedabad', state: 'Gujarat', zones: 0, merchants: 0, users: 0, status: 'inactive' },
];
