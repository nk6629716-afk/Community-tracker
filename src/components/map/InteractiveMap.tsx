import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Issue, IssueSeverity } from '../../types';
import { SEVERITY_INFO, STATUS_INFO, CATEGORY_LABELS } from '../../utils/priority';
import { calculateDistanceKm, formatDistance, GeoCoordinates } from '../../utils/geo';
import { Crosshair, Navigation, LocateFixed } from 'lucide-react';

interface InteractiveMapProps {
  issues?: Issue[];
  selectedIssueId?: string;
  onSelectIssue?: (issue: Issue) => void;
  // Selection mode for reporting an issue
  isPickerMode?: boolean;
  selectedCoordinates?: { lat: number; lng: number };
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  showControls?: boolean;
  userLocation?: GeoCoordinates | null;
  proximityRadiusKm?: number | null;
  onLocateMe?: () => void;
  autoFitUserAndIssues?: boolean;
}

// Create a custom SVG marker pin based on severity color
function createColoredIcon(severity: IssueSeverity, isSelected: boolean = false): L.DivIcon {
  const color = SEVERITY_INFO[severity]?.dotColor || '#2F6F8F';
  const size = isSelected ? 38 : 30;
  const pulseClass = severity === 'critical' ? 'animate-ping' : '';

  const svgHtml = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-115">
      ${
        severity === 'critical' || isSelected
          ? `<span class="absolute w-8 h-8 rounded-full opacity-40 ${pulseClass}" style="background-color: ${color}"></span>`
          : ''
      }
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="12" cy="9" r="3.5" fill="#FFFFFF"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-civic-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function createPickerIcon(): L.DivIcon {
  const svgHtml = `
    <div class="relative flex items-center justify-center cursor-move">
      <span class="absolute w-10 h-10 rounded-full bg-[#123B5D]/30 animate-ping"></span>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#123B5D" stroke="#FFFFFF" stroke-width="2.5"/>
        <circle cx="12" cy="9" r="4" fill="#FFFFFF"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'picker-pin',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

// User device GPS location marker with futuristic radar pulse
function createUserGpsIcon(): L.DivIcon {
  const svgHtml = `
    <div class="relative flex items-center justify-center pointer-events-auto select-none">
      <div class="absolute w-12 h-12 rounded-full bg-cyan-400/25 animate-ping"></div>
      <div class="absolute w-7 h-7 rounded-full bg-cyan-500/40 animate-pulse"></div>
      <div class="relative w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_12px_rgba(6,182,212,0.9)] flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'user-gps-pin',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -18],
  });
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  issues = [],
  selectedIssueId,
  onSelectIssue,
  isPickerMode = false,
  selectedCoordinates,
  onCoordinatesChange,
  center = [37.7749, -122.4194],
  zoom = 14,
  className = 'h-[420px] w-full',
  userLocation,
  proximityRadiusKm,
  onLocateMe,
  autoFitUserAndIssues = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userGpsLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = userLocation
      ? ([userLocation.lat, userLocation.lng] as L.LatLngTuple)
      : (center as L.LatLngTuple);

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: true,
      scrollWheelZoom: !isPickerMode,
    });

    // Clean, high-contrast OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const userGpsLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    userGpsLayerRef.current = userGpsLayer;
    mapInstanceRef.current = map;

    // Handle map click in picker mode
    if (isPickerMode && onCoordinatesChange) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onCoordinatesChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    // Leaflet container resize observer
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when prop changes (if not in custom fit mode)
  useEffect(() => {
    if (mapInstanceRef.current && center && !userLocation) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Handle User GPS Beacon & Proximity Radius Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !userGpsLayerRef.current) return;

    userGpsLayerRef.current.clearLayers();

    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserGpsIcon(),
        zIndexOffset: 1000,
      });

      const popupContent = `
        <div class="p-1 font-sans text-xs text-center space-y-1">
          <div class="font-black text-cyan-700 uppercase tracking-wider text-[10px]">📍 Your Device GPS</div>
          <div class="font-bold text-slate-900">Current Live Position</div>
          <div class="text-[10px] text-slate-500 font-mono">${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°</div>
          ${userLocation.accuracy ? `<div class="text-[10px] text-emerald-600 font-medium">Accuracy ±${Math.round(userLocation.accuracy)}m</div>` : ''}
        </div>
      `;
      userMarker.bindPopup(popupContent, { closeButton: false });
      userGpsLayerRef.current.addLayer(userMarker);

      // Add accuracy circle if precision is known
      if (userLocation.accuracy && userLocation.accuracy < 500) {
        const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: userLocation.accuracy,
          color: '#06b6d4',
          weight: 1,
          opacity: 0.4,
          fillColor: '#06b6d4',
          fillOpacity: 0.08,
          interactive: false,
        });
        userGpsLayerRef.current.addLayer(accuracyCircle);
      }

      // Add Proximity Radius circle if requested
      if (proximityRadiusKm && proximityRadiusKm > 0) {
        if (radiusCircleRef.current) {
          radiusCircleRef.current.remove();
        }
        const radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: proximityRadiusKm * 1000,
          color: '#8b5cf6',
          weight: 1.5,
          dashArray: '6, 6',
          opacity: 0.6,
          fillColor: '#8b5cf6',
          fillOpacity: 0.05,
          interactive: false,
        }).addTo(userGpsLayerRef.current);
        radiusCircleRef.current = radiusCircle;
      }
    }
  }, [userLocation?.lat, userLocation?.lng, userLocation?.accuracy, proximityRadiusKm]);

  // Update Markers when issues change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || isPickerMode) return;

    markersLayerRef.current.clearLayers();

    issues.forEach((issue) => {
      const isSelected = issue.id === selectedIssueId;
      const icon = createColoredIcon(issue.severity, isSelected);
      const marker = L.marker([issue.latitude, issue.longitude], { icon });

      const catLabel = CATEGORY_LABELS[issue.category] || issue.category;
      const sevInfo = SEVERITY_INFO[issue.severity];
      const statusInfo = STATUS_INFO[issue.status];

      // Calculate distance if user location is available
      let distanceBadge = '';
      if (userLocation && typeof userLocation.lat === 'number') {
        const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, issue.latitude, issue.longitude);
        const formattedDist = formatDistance(distKm);
        distanceBadge = `
          <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-bold">
            <span>📍 ${formattedDist}</span>
          </div>
        `;
      }

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-xs';
      popupContent.innerHTML = `
        <div class="space-y-1.5 min-w-[220px]">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-semibold tracking-wider uppercase text-slate-500">${catLabel}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-medium border ${sevInfo.border} ${sevInfo.bg} ${sevInfo.color}">
              ${sevInfo.label}
            </span>
          </div>
          <h4 class="font-bold text-slate-900 text-sm leading-tight">${issue.title}</h4>
          <p class="text-slate-600 line-clamp-2 text-[11px]">${issue.description}</p>
          
          ${distanceBadge ? `<div class="pt-0.5">${distanceBadge}</div>` : ''}

          <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
            <span class="font-medium text-slate-700">▲ ${issue.upvotes} affected</span>
            <span class="font-medium ${statusInfo.color}">● ${statusInfo.label}</span>
          </div>
          <button id="view-btn-${issue.id}" class="mt-2 w-full py-1.5 px-3 bg-[#123B5D] hover:bg-[#0B263D] text-white font-medium rounded text-center transition-colors">
            View Issue &rarr;
          </button>
        </div>
      `;

      // Attach event listener to the button inside popup
      marker.bindPopup(popupContent, { maxWidth: 290, closeButton: false });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-btn-${issue.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectIssue) onSelectIssue(issue);
          };
        }
      });

      marker.on('click', () => {
        if (onSelectIssue) onSelectIssue(issue);
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Auto-fit bounds if requested and we have valid points
    if (autoFitUserAndIssues && mapInstanceRef.current && issues.length > 0) {
      const boundsPoints: [number, number][] = issues.map((i) => [i.latitude, i.longitude]);
      if (userLocation) {
        boundsPoints.push([userLocation.lat, userLocation.lng]);
      }
      if (boundsPoints.length > 0) {
        const bounds = L.latLngBounds(boundsPoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [issues, selectedIssueId, isPickerMode, userLocation?.lat, userLocation?.lng, autoFitUserAndIssues]);

  // Picker Mode Marker
  useEffect(() => {
    if (!isPickerMode || !mapInstanceRef.current) return;

    if (selectedCoordinates) {
      if (!pickerMarkerRef.current) {
        const marker = L.marker([selectedCoordinates.lat, selectedCoordinates.lng], {
          icon: createPickerIcon(),
          draggable: true,
        }).addTo(mapInstanceRef.current);

        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          if (onCoordinatesChange) {
            onCoordinatesChange({ lat: pos.lat, lng: pos.lng });
          }
        });

        pickerMarkerRef.current = marker;
      } else {
        pickerMarkerRef.current.setLatLng([selectedCoordinates.lat, selectedCoordinates.lng]);
      }
    }
  }, [selectedCoordinates?.lat, selectedCoordinates?.lng, isPickerMode]);

  // Pan to user location handler
  const handleFlyToUser = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, {
        duration: 1.2,
      });
    }
    if (onLocateMe) {
      onLocateMe();
    }
  };

  return (
    <div className={`relative isolate rounded-xl overflow-hidden border border-white/10 shadow-xs ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Floating GPS / Locate Me Control Button */}
      {!isPickerMode && userLocation && (
        <button
          onClick={handleFlyToUser}
          title="Re-center map to my GPS location"
          className="absolute top-3 right-3 z-10 p-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 shadow-xl transition-all cursor-pointer group flex items-center gap-2 backdrop-blur-md"
        >
          <LocateFixed className="w-4 h-4 group-hover:scale-110 transition-transform text-cyan-400" />
          <span className="text-[11px] font-bold pr-1 hidden sm:inline text-white">
            My GPS
          </span>
        </button>
      )}

      {/* Legend overlay */}
      {!isPickerMode && (
        <div className="absolute bottom-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 shadow-xl text-xs space-y-1 pointer-events-auto select-none">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              Severity Legend
            </div>
            {userLocation && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Live GPS Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 pt-0.5">
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> Low
            </span>
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_6px_rgba(245,158,11,0.5)]" /> Medium
            </span>
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shadow-[0_0_6px_rgba(249,115,22,0.5)]" /> High
            </span>
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.5)]" /> Critical
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
