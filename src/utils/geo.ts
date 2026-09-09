// Geospatial utility functions for Community-tracker

export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
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
