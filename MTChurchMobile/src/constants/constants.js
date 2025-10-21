// User Roles
export const USER_ROLES = {
  ADMIN: 'Admin',
  FINANCE: 'Finance',
  SUPPORT: 'Support',
  VIEW: 'View',
};

// Attendance Types
export const ATTENDANCE_TYPES = ['Adult', 'Children'];

// Collection Types
export const COLLECTION_TYPES = [
  'Total Offering',
  'Annual Harvest',
  'Sunday Collection',
  'Tithe Collection',
  'Building Fund',
  'Mission Fund',
  'Special Events'
];

// Currencies
export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'GHS', symbol: 'GH₵' }
];

// Ghana Regions
export const GHANA_REGIONS = [
  'Ahafo Region', 'Ashanti Region', 'Bono East Region', 'Bono Region',
  'Central Region', 'Eastern Region', 'Greater Accra Region', 'North East Region',
  'Northern Region', 'Oti Region', 'Savannah Region', 'Upper East Region',
  'Upper West Region', 'Volta Region', 'Western North Region', 'Western Region'
];

// Organizations
export const ORGANIZATIONS = [
  'Mens Fellowship', 'Choir', 'Christ Little Band', 'Singing Band',
  'Guild', 'Girls Fellowship', 'Youth Fellowship', 'Gospel Band',
  'Women\'s Fellowship', 'Brigade', 'Digital Team'
];

// Event Types
export const EVENT_TYPES = [
  'Sunday Service', 'Bible Study', 'Prayer Meeting', 'Youth Service',
  'Women\'s Fellowship', 'Men\'s Fellowship', 'Church Conference',
  'Baptism', 'Wedding', 'Funeral', 'Community Outreach', 'Special Event'
];

// Membership Types
export const MEMBERSHIP_TYPES = [
  'Catechumens', 'Full Member', 'Distance', 'Invalid'
];

// Titles
export const TITLES = [
  'Mr.', 'Mrs.', 'Miss', 'Dr.', 'Rev.', 'Prof.', 'Madam', 'Nana'
];

// Employment Status
export const EMPLOYMENT_STATUSES = [
  'Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired'
];

// Class Options
export const CLASS_OPTIONS = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'
];

// Child Class Options
export const CHILD_CLASS_OPTIONS = [
  'Beginners', 'Primary', 'Timothy'
];

// Child Organizations
export const CHILD_ORGANIZATIONS = [
  'MYF', 'MGF', 'Bridge', 'Junior Choir'
];

// Priority Levels
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' }
];

// Bible Verses for Dashboard
export const BIBLE_VERSES = [
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.", reference: "Jeremiah 29:11" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
  { text: "The Lord is my shepherd, I lack nothing.", reference: "Psalm 23:1" },
  { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
  { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13" },
  { text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.", reference: "Numbers 6:24-25" }
];
