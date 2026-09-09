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

// Popular community presets for instant selection
export const COMMUNITY_LOCATION_PRESETS: LocationSearchResult[] = [
  { name: 'Civic Center & Central Hub', lat: 37.7749, lng: -122.4194, type: 'Downtown' },
  { name: 'Market District & Commercial Corridor', lat: 37.7785, lng: -122.4150, type: 'Commercial' },
  { name: 'University Campus & Student Quarter', lat: 37.7710, lng: -122.4230, type: 'Campus' },
  { name: 'North Ward Transit Station', lat: 37.7812, lng: -122.4105, type: 'Transit' },
  { name: 'Industrial & Logistics Park', lat: 37.7680, lng: -122.4120, type: 'Industrial' },
  { name: 'Mission Green Park & Gardens', lat: 37.7695, lng: -122.4265, type: 'Recreation' },
];

// Generate dynamic community issues around user's active coordinates
export function generateLocalizedCommunityIssues(
  coords: GeoCoordinates,
  placeName?: string | null
): Issue[] {
  const area = placeName ? placeName.split(',')[0].trim() : 'Local Ward';
  const fullLoc = placeName ? placeName.split(',').slice(0, 2).join(', ').trim() : 'Community Zone';
  const now = new Date();

  return [
    {
      id: `loc-pothole-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'CP-4821',
      title: `Deep Potholes & Hazardous Asphalt Wear near ${area}`,
      description: `Heavy vehicular movement has created severe potholes and surface subsidence across the roadway near ${area}. Motorists and two-wheelers are experiencing severe skidding risks.`,
      category: 'road_damage',
      severity: 'critical',
      ai_summary: `Severe road surface degradation identified near ${area}. Potholes exceed 12cm depth posing critical vehicular safety hazard.`,
      ai_severity: 'critical',
      ai_confidence: 94,
      ai_reason: 'High traffic density and road surface degradation create immediate accident probability.',
      recommended_action: 'Dispatch urgent road maintenance crew for cold-mix bitumen patching within 12 hours.',
      latitude: coords.lat + 0.0024,
      longitude: coords.lng - 0.0019,
      address: `Main Road near ${fullLoc}`,
      photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
      status: 'reported',
      is_anonymous: false,
      created_by: 'Resident Citizen',
      created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      upvotes: 42,
      priority_score: 91,
    },
    {
      id: `loc-light-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'CP-7319',
      title: `Non-functional Streetlights Creating Dark Corridor in ${area}`,
      description: `A sequence of 4 consecutive LED streetlights have failed, plunging this pedestrian walkway and crossing into complete darkness after 7:30 PM.`,
      category: 'streetlight',
      severity: 'high',
      ai_summary: `Illumination outage detected over a 120-meter segment in ${area}, reducing pedestrian security and transit visibility.`,
      ai_severity: 'high',
      ai_confidence: 91,
      ai_reason: 'Consecutive lighting failure in high pedestrian transit area elevates safety and crime vulnerability.',
      recommended_action: 'Electrical department team to inspect breaker switch and replace LED drivers.',
      latitude: coords.lat - 0.0031,
      longitude: coords.lng + 0.0028,
      address: `Commercial Avenue, ${fullLoc}`,
      photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
      status: 'in_progress',
      is_anonymous: false,
      created_by: 'Community Watch',
      created_at: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      upvotes: 29,
      priority_score: 79,
    },
    {
      id: `loc-garbage-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'CP-5612',
      title: `Overflowing Waste Dumps & Garbage Spillage near ${area}`,
      description: `Community garbage bins are overflowing onto the footpath and side street. Stray animals are scattering plastic waste causing foul odor and sanitary risks.`,
      category: 'garbage',
      severity: 'medium',
      ai_summary: `Uncollected municipal solid waste accumulation exceeding bin capacity by approx 200%. Sanitation hazard.`,
      ai_severity: 'medium',
      ai_confidence: 89,
      ai_reason: 'Organic and commercial packaging spillage obstructing walkway and creating public health nuisance.',
      recommended_action: 'Assign sanitation tipper truck for immediate clearance and placement of secondary bin.',
      latitude: coords.lat + 0.0045,
      longitude: coords.lng + 0.0036,
      address: `Market Crossing, ${fullLoc}`,
      photo_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&q=80&w=800',
      status: 'reported',
      is_anonymous: true,
      created_by: 'Anonymous Citizen',
      created_at: new Date(now.getTime() - 180 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 180 * 60 * 1000).toISOString(),
      upvotes: 18,
      priority_score: 65,
    },
    {
      id: `loc-water-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'CP-8924',
      title: `Subsurface Water Pipeline Leak Gushing onto Roadway in ${area}`,
      description: `Clean treated water is continuously gushing from a fractured supply joint underneath the asphalt, eroding the foundation and flooding local shops.`,
      category: 'water_leakage',
      severity: 'critical',
      ai_summary: `High-pressure distribution main fracture estimated at 80-100 liters/minute water loss and road undercutting.`,
      ai_severity: 'critical',
      ai_confidence: 96,
      ai_reason: 'Potable water resource depletion and progressive road substructure erosion.',
      recommended_action: 'Depute emergency water works valve isolation team and excavate pipe sleeve.',
      latitude: coords.lat - 0.0018,
      longitude: coords.lng - 0.0041,
      address: `Water Pipeline Sector, ${fullLoc}`,
      photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80&w=800',
      status: 'in_progress',
      is_anonymous: false,
      created_by: 'Local Merchant Association',
      created_at: new Date(now.getTime() - 320 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      upvotes: 67,
      priority_score: 95,
    },
    {
      id: `loc-drain-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'CP-6140',
      title: `Blocked Storm Drainage & Missing Grate Cover near ${area}`,
      description: `The main street storm catch basin is choked with construction debris and silt. The iron drain grate is displaced, creating an open 4-foot deep hazard.`,
      category: 'drainage',
      severity: 'high',
      ai_summary: `Critical drainage obstruction and missing pit cover in ${area} presenting immediate fall risk.`,
      ai_severity: 'high',
      ai_confidence: 93,
      ai_reason: 'Exposed manhole/grate defect in pedestrian zone with impending flood risk.',
      recommended_action: 'Install safety barricade immediately and dispatch desilting suction crew with replacement grating.',
      latitude: coords.lat + 0.0058,
      longitude: coords.lng - 0.0032,
      address: `Transit Circle & Drainage Way, ${fullLoc}`,
      photo_url: 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&q=80&w=800',
      status: 'reported',
      is_anonymous: false,
      created_by: 'Ward Volunteer',
      created_at: new Date(now.getTime() - 410 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 410 * 60 * 1000).toISOString(),
      upvotes: 35,
      priority_score: 84,
    },
    {
      id: `loc-infra-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'CP-3291',
      title: `Collapsed Footpath Pavement & Damaged Pedestrian Curb in ${area}`,
      description: `Interlocking paver tiles have caved in along a 15-meter stretch near the school gate, forcing senior citizens and children to walk in heavy road traffic.`,
      category: 'infrastructure',
      severity: 'medium',
      ai_summary: `Pedestrian walkway structural collapse impeding accessibility near ${area}.`,
      ai_severity: 'medium',
      ai_confidence: 88,
      ai_reason: 'Substandard soil compaction resulting in pavement subsidence in school transit zone.',
      recommended_action: 'Civil engineering team to restabilize base gravel and relay interlocking pavement pavers.',
      latitude: coords.lat - 0.0048,
      longitude: coords.lng - 0.0022,
      address: `School Zone Footpath, ${fullLoc}`,
      photo_url: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?auto=format&fit=crop&q=80&w=800',
      status: 'resolved',
      is_anonymous: false,
      created_by: 'Parent Teacher Association',
      created_at: new Date(now.getTime() - 720 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      upvotes: 53,
      priority_score: 72,
    },
    {
      id: `loc-power-${Math.round(coords.lat * 1000)}`,
      ticket_id: 'CP-9014',
      title: `Low-Hanging Electrical Cables & Exposed Junction Box in ${area}`,
      description: `Overhead power supply lines have loosened and are hanging dangerously low (under 7 feet) across the street corner, with an open junction box exposed to rain.`,
      category: 'electricity',
      severity: 'critical',
      ai_summary: `Electrocution hazard from low overhead distribution lines and unsealed junction enclosure in ${area}.`,
      ai_severity: 'critical',
      ai_confidence: 97,
      ai_reason: 'Direct contact risk for trucks and pedestrians with energized conductors.',
      recommended_action: 'Immediate power shutdown authorization and cable tensioning by electric utility emergency team.',
      latitude: coords.lat + 0.0076,
      longitude: coords.lng + 0.0054,
      address: `Junction Pole #14, ${fullLoc}`,
      photo_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800',
      status: 'reported',
      is_anonymous: false,
      created_by: 'Area Resident',
      created_at: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
      upvotes: 81,
      priority_score: 98,
    },
  ];
}
