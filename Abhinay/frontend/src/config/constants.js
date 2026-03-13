export const INDIAN_CITIES = [
  'All Cities',
  'Agartala', 'Agra', 'Ahmedabad', 'Belagavi', 'Bengaluru',
  'Bhopal', 'Chandigarh', 'Chennai', 'Dehradun', 'Erode',
  'Faridabad', 'Gwalior', 'Indore', 'Jabalpur', 'Kakinada',
  'Kanpur', 'Kohima', 'Kota', 'Lucknow', 'Ludhiana',
  'Madurai City', 'Nagpur', 'Pimpri Chinchwad', 'Pune', 'Raipur',
  'Ranchi', 'Rourkela', 'Salem', 'Shillong', 'Shivamogga',
  'Solapur', 'Srinagar', 'Thane', 'Thanjavur', 'Thiruvananthapuram',
  'Tiruchirappalli', 'Tirupati', 'Tiruppur', 'Tumakuru', 'Udaipur',
  'Vadodara', 'Visakhapatnam', 'Warangal',
];

// Keep DISTRICTS for backward compat
export const DISTRICTS = INDIAN_CITIES;

export const MAP_CENTER = { lat: 20.5937, lng: 78.9629 };
export const MAP_ZOOM   = 5;

export const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard',  icon: 'BarChart3'     },
  { path: '/map',         label: 'Map',         icon: 'Map'           },
  { path: '/predictions', label: 'Predictions', icon: 'Sparkles'      },
  { path: '/alerts',      label: 'Alerts',      icon: 'Bell'          },
  { path: '/clusters',    label: 'Clusters',    icon: 'Brain'         },
  { path: '/simulator',   label: 'Simulator',   icon: 'FlaskConical'  },
  { path: '/chat',        label: 'AI Chat',     icon: 'MessageSquare' },
  { path: '/livefeed',    label: 'Live Feed',   icon: 'Radio'         },
];

export const SCENARIOS = [
  'Reduce Traffic',
  'Increase Green Transport',
  'Restrict Industry',
  'Increase EV Adoption',
];
