import type { BusinessFields } from '../../db/repositories/UdyamiBusinesses.repository';

/**
 * The first businesses in the directory, added once when a brand new install
 * starts with an empty directory. Only the business itself is listed: its name,
 * place and public contact details. No owner name is stored or shown.
 * Where the pin goes is looked up from the address in the background.
 */
export const STARTER_LISTINGS: BusinessFields[] = [
  {
    name: 'Indian And Nepalese Kitchen',
    category: 'Restaurant',
    community: 'both',
    description: 'Nepalese and Indian restaurant in Oamaru.',
    city: 'Oamaru',
    country: 'New Zealand',
    address: '360A Thames Highway, North Oamaru 9400',
    latitude: null,
    longitude: null,
    phone: '+64 3 437 1414',
    email: null,
    website: 'https://indianandnepalesekitchen.co.nz',
    photo_url: null,
  },
  {
    name: 'Himalayan Fusion Restaurant and Bar, New Lynn',
    category: 'Restaurant',
    community: 'nepali',
    description: 'Nepalese and Indian cuisine, restaurant and bar in New Lynn.',
    city: 'Auckland',
    country: 'New Zealand',
    address: '3055 Great North Road, New Lynn, Auckland 0600',
    latitude: null,
    longitude: null,
    phone: '+64 9 825 0705',
    email: null,
    website: 'https://himalayanfusion.co.nz',
    photo_url: null,
  },
  {
    name: 'Himalayan Fusion Restaurant and Bar, Takapuna',
    category: 'Restaurant',
    community: 'nepali',
    description: 'Nepalese and Indian cuisine, restaurant and bar in Takapuna.',
    city: 'Auckland',
    country: 'New Zealand',
    address: '17 Huron Street, Takapuna, Auckland 0622',
    latitude: null,
    longitude: null,
    phone: '+64 9 489 9911',
    email: null,
    website: 'https://himalayanfusion.co.nz',
    photo_url: null,
  },
];
