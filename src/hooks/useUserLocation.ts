import { useState, useEffect, useCallback } from 'react';
import { GeoCoordinates, reverseGeocodeAddress } from '../utils/geo';

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface UserLocationState {
  coords: GeoCoordinates | null;
  status: GeolocationStatus;
  placeName: string | null;
  error: string | null;
  isLocating: boolean;
  requestLocation: (forceFresh?: boolean) => Promise<GeoCoordinates | null>;
  setManualLocation: (coords: GeoCoordinates, name?: string) => void;
}

const STORAGE_KEY = 'community_tracker_gps_coords';
const PLACE_STORAGE_KEY = 'community_tracker_gps_place';

// Default fallback coordinates (San Francisco Civic Center seed)
export const DEFAULT_FALLBACK_LOCATION: GeoCoordinates = {
  lat: 37.7749,
  lng: -122.4194,
  accuracy: 25,
};

export function useUserLocation(): UserLocationState {
  const [coords, setCoords] = useState<GeoCoordinates | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [placeName, setPlaceName] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PLACE_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [status, setStatus] = useState<GeolocationStatus>(coords ? 'granted' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const setManualLocation = useCallback((newCoords: GeoCoordinates, name?: string) => {
    setCoords(newCoords);
    setStatus('granted');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));
    } catch {
      // ignore
    }

    if (name) {
      setPlaceName(name);
      try {
        localStorage.setItem(PLACE_STORAGE_KEY, name);
      } catch {
        // ignore
      }
    } else {
      reverseGeocodeAddress(newCoords.lat, newCoords.lng).then((resolvedName) => {
        setPlaceName(resolvedName);
        try {
          localStorage.setItem(PLACE_STORAGE_KEY, resolvedName);
        } catch {
          // ignore
        }
      });
    }
  }, []);

  const requestLocation = useCallback(
    async (forceFresh = false): Promise<GeoCoordinates | null> => {
      if (!navigator.geolocation) {
        setStatus('unavailable');
        setError('Geolocation is not supported by your browser or device.');
        return null;
      }

      setIsLocating(true);
      setStatus('requesting');
      setError(null);

      return new Promise<GeoCoordinates | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const newCoords: GeoCoordinates = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };

            setCoords(newCoords);
            setStatus('granted');
            setIsLocating(false);

            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));
            } catch {
              // ignore
            }

            resolve(newCoords);

            // Fetch human readable place name in background
            try {
              const name = await reverseGeocodeAddress(newCoords.lat, newCoords.lng);
              setPlaceName(name);
              localStorage.setItem(PLACE_STORAGE_KEY, name);
            } catch {
              setPlaceName(`GPS: ${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}`);
            }
          },
          (err) => {
            console.warn('[Geolocation] Device location error:', err.message);
            setIsLocating(false);

            if (err.code === 1) {
              setStatus('denied');
              setError('Location permission was denied. You can manually pick a location or enable GPS in browser permissions.');
            } else if (err.code === 2) {
              setStatus('unavailable');
              setError('Position unavailable. Using approximate community center.');
            } else {
              setStatus('error');
              setError('Location request timed out.');
            }

            // If we don't already have saved coords, provide default fallback so the map is never broken
            if (!coords) {
              setCoords(DEFAULT_FALLBACK_LOCATION);
              setPlaceName('Civic Center Hub');
            }

            resolve(coords || DEFAULT_FALLBACK_LOCATION);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: forceFresh ? 0 : 60000,
          }
        );
      });
    },
    [coords]
  );

  // Automatically request on mount if not yet denied
  useEffect(() => {
    if (!coords && navigator.geolocation) {
      // Probe permission state if available
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((result) => {
            if (result.state === 'granted') {
              requestLocation(false);
            } else if (result.state === 'prompt') {
              // Smooth initial prompt
              requestLocation(false);
            } else {
              // denied
              setStatus('denied');
              if (!coords) {
                setCoords(DEFAULT_FALLBACK_LOCATION);
                setPlaceName('Civic Center Hub');
              }
            }
          })
          .catch(() => {
            requestLocation(false);
          });
      } else {
        requestLocation(false);
      }
    }
  }, []);

  return {
    coords,
    status,
    placeName,
    error,
    isLocating,
    requestLocation,
    setManualLocation,
  };
}
