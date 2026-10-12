// Geospatial utility functions for Community-tracker
import { Issue } from '../types';

export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface LocationSearchResult {
  name: string;
  lat: number;
  lng: number;
  type?: string;
}

// Haversine formula to calculate distance between two coordinates in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance cleanly (e.g. "150 m", "1.2 km", "24 km")
export function formatDistance(km: number | undefined | null): string {
  if (km === undefined || km === null || isNaN(km)) return '';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m away`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km away`;
  }
  return `${Math.round(km)} km away`;
}

// Reverse geocoding helper using OpenStreetMap Nominatim with graceful fallback
export async function reverseGeocodeAddress(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CommunityTracker/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const parts = [
          addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
          addr.city_district || addr.district || addr.city || addr.town || addr.village,
          addr.state,
        ].filter(Boolean);

        if (parts.length > 0) {
          return parts.join(', ');
        }
        return data.display_name.split(',').slice(0, 3).join(', ');
      }
    }
  } catch (err) {
    // Non-fatal, fallback to coordinate string
  }

  return `GPS (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
}

// Search location address using Nominatim geocoding API
export async function searchLocationAddress(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CommunityTracker/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results)) {
        return results.map((item) => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type || item.class,
        }));
      }
    }
  } catch (err) {
    // Graceful fallback to search failure
  }

  return [];
}

// Popular community presets for instant selection across Delhi NCR
export const COMMUNITY_LOCATION_PRESETS: LocationSearchResult[] = [
  { name: 'Connaught Place & Rajiv Chowk', lat: 28.6315, lng: 77.2167, type: 'Central Delhi' },
  { name: 'Chandni Chowk & Old Delhi Bazaar', lat: 28.6506, lng: 77.2303, type: 'North Delhi' },
  { name: 'Lajpat Nagar & Central Market', lat: 28.5677, lng: 77.2433, type: 'South Delhi' },
  { name: 'Rohini Sector 14 & Outer Ring Road', lat: 28.7159, lng: 77.1189, type: 'North West Delhi' },
  { name: 'Dwarka Sector 12 City Centre', lat: 28.5921, lng: 77.0460, type: 'South West Delhi' },
  { name: 'Vikas Marg & Laxmi Nagar', lat: 28.6304, lng: 77.2773, type: 'East Delhi' },
  { name: 'Sanjay Lake & Mayur Vihar Phase II', lat: 28.6180, lng: 77.3060, type: 'East Delhi' },
  { name: 'Ghazipur Border & Anand Vihar Transit', lat: 28.6258, lng: 77.3326, type: 'East Delhi' },
  { name: 'Vasant Kunj & Mehrauli Ridge', lat: 28.5355, lng: 77.1620, type: 'South Delhi' },
  { name: 'Minto Road Underpass & Civic Centre', lat: 28.6366, lng: 77.2289, type: 'New Delhi' },
];

// Generate dynamic community issues around user's active coordinates with real Delhi civic problems
export function generateLocalizedCommunityIssues(
  coords: GeoCoordinates,
  placeName?: string | null
): Issue[] {
  const area = placeName ? placeName.split(',')[0].trim() : 'Delhi Ward';
  const fullLoc = placeName ? placeName.split(',').slice(0, 2).join(', ').trim() : 'Delhi NCR';
  const now = new Date();

  return [
    {
      id: `delhi-crater-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-7491',
      title: `Dangerous Road Crater & Asphalt Collapse near ${area}`,
      description: `Extensive road collapse exceeding 1.2m diameter and 15cm depth on the main carriageway. Police barricade placed as temporary caution, but vehicles and two-wheelers face severe accident risks, particularly after dusk.`,
      category: 'road_damage',
      severity: 'critical',
      ai_summary: `Deep structural road crater and foundation subsidence detected near ${area}. Poses immediate collision danger.`,
      ai_severity: 'critical',
      ai_confidence: 96,
      ai_reason: 'Severe asphalt subsidence on high-speed arterial stretch with compromised structural sub-base.',
      recommended_action: 'Urgent deployment of PWD rapid road response crew for cold-mix bitumen packing and permanent resurfacing.',
      latitude: coords.lat + 0.0028,
      longitude: coords.lng - 0.0021,
      address: `Outer Ring Road near ${fullLoc}`,
      photo_url: '/problems/OIP.webp',
      status: 'reported',
      is_anonymous: false,
      created_by: 'Naveen Sharma (Resident)',
      created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      upvotes: 84,
      priority_score: 96,
    },
    {
      id: `delhi-pothole-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-5823',
      title: `Deep Waterlogged Pothole & Traffic Bottleneck near ${area}`,
      description: `Sunken road section inundated with dirty stagnant water occupying nearly half the carriageway. Commuters and auto-rickshaws face chronic delays and severe skidding hazards.`,
      category: 'road_damage',
      severity: 'high',
      ai_summary: `Large inundated road cavity obstructing vehicle movement near ${area}. Water stagnation aggravating asphalt erosion.`,
      ai_severity: 'high',
      ai_confidence: 92,
      ai_reason: 'Stagnant water layer obscuring depth and causing frequent two-wheeler skids in heavy traffic.',
      recommended_action: 'Dewater localized ponding and fill with crushed aggregate and asphalt layer within 24 hours.',
      latitude: coords.lat - 0.0033,
      longitude: coords.lng + 0.0026,
      address: `Vikas Marg Corridor, ${fullLoc}`,
      photo_url: '/problems/OIP (1).webp',
      status: 'in_progress',
      is_anonymous: false,
      created_by: 'Ananya Gupta (Daily Commuter)',
      created_at: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      upvotes: 63,
      priority_score: 88,
    },
    {
      id: `delhi-cables-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-9104',
      title: `Hazardous Hanging High-Voltage Electric Wire Cluster in ${area}`,
      description: `Overhead power distribution lines have sagged dangerously low (under 7 feet) across the market walkway, with an exposed cluster of entangled cables sparking during rainfall.`,
      category: 'electricity',
      severity: 'critical',
      ai_summary: `Life-threatening electrical hazard: low-hanging overhead power lines and tangled cabling bundle in ${area}.`,
      ai_severity: 'critical',
      ai_confidence: 98,
      ai_reason: 'High risk of electrocution and commercial fire outbreak in congested pedestrian bazaar.',
      recommended_action: 'Dispatch BSES / NDPL emergency electrical squad to isolate power, de-tangle, and re-tension overhead lines.',
      latitude: coords.lat + 0.0042,
      longitude: coords.lng + 0.0038,
      address: `Nai Sarak Market Lane, ${fullLoc}`,
      photo_url: '/problems/OIP (2).webp',
      status: 'reported',
      is_anonymous: false,
      created_by: 'Market Traders Association',
      created_at: new Date(now.getTime() - 140 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 140 * 60 * 1000).toISOString(),
      upvotes: 91,
      priority_score: 98,
    },
    {
      id: `delhi-garbage-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-3912',
      title: `Massive Municipal Garbage Overflow Spilling onto Roadway near ${area}`,
      description: `Uncollected municipal solid waste dump exceeding bin perimeter by over 300%. Rotten food, plastic packaging, and construction debris spilling across the transit lane causing foul odor and cattle blockage.`,
      category: 'garbage',
      severity: 'critical',
      ai_summary: `Severe municipal waste backlog and open dump overflow spreading into active traffic lane near ${area}.`,
      ai_severity: 'critical',
      ai_confidence: 95,
      ai_reason: 'Major sanitation hazard, vector disease vector risk, and blockage of public transport corridor.',
      recommended_action: 'Direct MCD mechanical loaders and compactors for priority waste evacuation and disinfectant spraying.',
      latitude: coords.lat - 0.0048,
      longitude: coords.lng - 0.0035,
      address: `Ghazipur Border Main Road, ${fullLoc}`,
      photo_url: '/problems/OIP (3).webp',
      status: 'in_progress',
      is_anonymous: true,
      created_by: 'Concerned Citizen',
      created_at: new Date(now.getTime() - 210 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
      upvotes: 77,
      priority_score: 92,
    },
    {
      id: `delhi-plastic-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-2045',
      title: `Illegal Commercial Plastic & Debris Dumping Along Forest Ridge in ${area}`,
      description: `Repeated night-time dumping of commercial plastics, discarded crates, and non-biodegradable waste along the green belt reserve border. Threatens surrounding flora and fauna.`,
      category: 'public_space',
      severity: 'medium',
      ai_summary: `Unauthorized dumping of plastic scrap and solid debris in protected forest verge near ${area}.`,
      ai_severity: 'medium',
      ai_confidence: 88,
      ai_reason: 'Non-biodegradable pollutant accumulation threatening Delhi Ridge conservation zone.',
      recommended_action: 'Dispatch forest sanitation squad and install solar CCTV surveillance to penalize nighttime dumpers.',
      latitude: coords.lat + 0.0055,
      longitude: coords.lng - 0.0046,
      address: `Aruna Asaf Ali Marg Ridge Path, ${fullLoc}`,
      photo_url: '/problems/OIP (4).webp',
      status: 'reported',
      is_anonymous: false,
      created_by: 'Eco Watch Group',
      created_at: new Date(now.getTime() - 360 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 360 * 60 * 1000).toISOString(),
      upvotes: 38,
      priority_score: 68,
    },
    {
      id: `delhi-manhole-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-8190',
      title: `Uncovered 12-Foot Deep Sewer Manhole on Pedestrian Footpath in ${area}`,
      description: `Heavy concrete manhole lid displaced and cracked, leaving an open underground sewer pit on a frequently used pedestrian walkway. High danger of fatal fall for pedestrians and school students.`,
      category: 'drainage',
      severity: 'critical',
      ai_summary: `Missing manhole cover over deep trunk sewer on pedestrian walkway in ${area}. Critical fall hazard.`,
      ai_severity: 'critical',
      ai_confidence: 99,
      ai_reason: 'Completely unshielded deep cavity located directly on school transit route.',
      recommended_action: 'Emergency placement of high-visibility barricade and installation of heavy-duty ductile iron cover within 4 hours.',
      latitude: coords.lat - 0.0019,
      longitude: coords.lng + 0.0051,
      address: `Sector 12 Main Sector Footpath, ${fullLoc}`,
      photo_url: '/problems/OIP (5).webp',
      status: 'reported',
      is_anonymous: false,
      created_by: 'Dwarka Resident Welfare Association',
      created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      upvotes: 112,
      priority_score: 99,
    },
    {
      id: `delhi-waterbody-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-6301',
      title: `Toxic Water Contamination & Floating Plastic Scum in Sanjay Lake near ${area}`,
      description: `Greenish chemical foam, decomposing garbage, and plastic bottles choking the waterfront. Foul smell spreading across residential colonies and causing fish mortality.`,
      category: 'public_space',
      severity: 'high',
      ai_summary: `Severe ecological degradation and chemical algal bloom detected in public waterbody near ${area}.`,
      ai_severity: 'high',
      ai_confidence: 91,
      ai_reason: 'Untreated surface runoff and plastic refuse accumulating in natural aquifer recharge zone.',
      recommended_action: 'Deploy floating trash skimmer and activate aeration fountains to restore dissolved oxygen levels.',
      latitude: coords.lat + 0.0068,
      longitude: coords.lng + 0.0019,
      address: `Sanjay Lake Promenade, ${fullLoc}`,
      photo_url: '/problems/download.webp',
      status: 'reported',
      is_anonymous: false,
      created_by: 'Mayur Vihar Citizens Forum',
      created_at: new Date(now.getTime() - 480 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 480 * 60 * 1000).toISOString(),
      upvotes: 54,
      priority_score: 81,
    },
    {
      id: `delhi-culvert-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-4720',
      title: `Broken Storm Drain Slabs & Open Culvert Pit on Footpath near ${area}`,
      description: `Series of reinforced drain slabs have caved in, leaving jagged concrete blocks and open drains directly on the sidewalk. Discarded plastic food trays and debris choking drain mouth.`,
      category: 'infrastructure',
      severity: 'high',
      ai_summary: `Structural failure of roadside stormwater drain covers creating hazardous open trench near ${area}.`,
      ai_severity: 'high',
      ai_confidence: 93,
      ai_reason: 'Pedestrians forced to step onto high-traffic highway due to obstructed and broken footpath.',
      recommended_action: 'Cast-in-place precast slab replacement and clear clogged drain inlet before monsoon flow.',
      latitude: coords.lat - 0.0052,
      longitude: coords.lng - 0.0017,
      address: `Ring Road Footpath, ${fullLoc}`,
      photo_url: '/problems/download (1).webp',
      status: 'in_progress',
      is_anonymous: false,
      created_by: 'Mohit Rawat (Local Shopkeeper)',
      created_at: new Date(now.getTime() - 540 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      upvotes: 49,
      priority_score: 84,
    },
    {
      id: `delhi-underpass-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'DL-1109',
      title: `Severe Inundation & Submerged Traffic at Railway Underpass near ${area}`,
      description: `Persistent waterlogging exceeding 3.5 feet height under the railway underpass after rainfall. Vehicles stranded, arterial traffic paralyzed, and storm pump failure observed.`,
      category: 'drainage',
      severity: 'critical',
      ai_summary: `Critical road underpass submersion paralyzing vehicular transit between districts near ${area}.`,
      ai_severity: 'critical',
      ai_confidence: 97,
      ai_reason: 'Pumping station electrical failure and inadequate gravity discharge causing rapid inundation.',
      recommended_action: 'Deploy emergency diesel de-watering pumps and install high-water automated traffic barrier.',
      latitude: coords.lat + 0.0014,
      longitude: coords.lng + 0.0044,
      address: `Minto Road Railway Underpass, ${fullLoc}`,
      photo_url: '/problems/download (2).webp',
      status: 'resolved',
      is_anonymous: false,
      created_by: 'Delhi Traffic Police Support Desk',
      created_at: new Date(now.getTime() - 860 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 120 * 60 * 1000).toISOString(),
      upvotes: 128,
      priority_score: 95,
    },
  ];
}
