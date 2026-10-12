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
  isManualModalOpen: boolean;
  setIsManualModalOpen: (open: boolean) => void;
  openManualModal: () => void;
  requestLocation: (forceFresh?: boolean) => Promise<GeoCoordinates | null>;
  setManualLocation: (coords: GeoCoordinates, name?: string) => void;
}

const STORAGE_KEY = 'community_tracker_gps_coords';
const PLACE_STORAGE_KEY = 'community_tracker_gps_place';
const LOCATION_SOURCE_KEY = 'community_tracker_location_source';

// Default fallback coordinates (Connaught Place, Central Delhi)
export const DEFAULT_FALLBACK_LOCATION: GeoCoordinates = {
  lat: 28.6139,
  lng: 77.2090,
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
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  const openManualModal = useCallback(() => {
    setIsManualModalOpen(true);
  }, []);

  const setManualLocation = useCallback((newCoords: GeoCoordinates, name?: string) => {
    setCoords(newCoords);
    setStatus('granted');
    setError(null);
    setIsManualModalOpen(false);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));
      localStorage.setItem(LOCATION_SOURCE_KEY, 'manual');
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
        // Flash manual entry modal
        setIsManualModalOpen(true);
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
            setIsManualModalOpen(false);

            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));
              localStorage.setItem(LOCATION_SOURCE_KEY, 'gps');
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
            console.warn('[Geolocation] Device location error / denied:', err.message);
            setIsLocating(false);

            if (err.code === 1) {
              // PERMISSION_DENIED: Flash modal for manual entry!
              setStatus('denied');
              setError('Location permission was denied. Please enter your neighborhood manually.');
              setIsManualModalOpen(true);
            } else if (err.code === 2) {
              setStatus('unavailable');
              setError('Position unavailable. Please enter your neighborhood manually.');
              setIsManualModalOpen(true);
            } else {
              setStatus('error');
              setError('Location request timed out. Please enter your neighborhood manually.');
              setIsManualModalOpen(true);
            }

            // Fallback so that coordinates are never completely null
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

  // Automatically request on site visit
  useEffect(() => {
    // Check if we already have saved manual location or if we should probe GPS
    const savedSource = localStorage.getItem(LOCATION_SOURCE_KEY);

    if (navigator.geolocation) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((result) => {
            if (result.state === 'granted') {
              requestLocation(false);
            } else if (result.state === 'prompt') {
              // Trigger browser permission prompt on visit
              requestLocation(false);
            } else if (result.state === 'denied') {
              setStatus('denied');
              if (!coords) {
                setCoords(DEFAULT_FALLBACK_LOCATION);
                setPlaceName('Civic Center Hub');
              }
              // If denied, flash popup for manual entry
              setIsManualModalOpen(true);
            }
          })
          .catch(() => {
            requestLocation(false);
          });
      } else {
        requestLocation(false);
      }
    } else {
      // Geolocation not supported at all -> Flash manual popup
      setIsManualModalOpen(true);
    }
  }, []);

  return {
    coords,
    status,
    placeName,
    error,
    isLocating,
    isManualModalOpen,
    setIsManualModalOpen,
    openManualModal,
    requestLocation,
    setManualLocation,
  };
}
