import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Issue, IssueSeverity } from '../../types';
import { SEVERITY_INFO, STATUS_INFO, CATEGORY_LABELS } from '../../utils/priority';

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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center as L.LatLngTuple,
      zoom,
      zoomControl: true,
      scrollWheelZoom: !isPickerMode,
    });

    // Add clean, high-contrast OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
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

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

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

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-xs';
      popupContent.innerHTML = `
        <div class="space-y-1.5 min-w-[210px]">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-semibold tracking-wider uppercase text-slate-500">${catLabel}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-medium border ${sevInfo.border} ${sevInfo.bg} ${sevInfo.color}">
              ${sevInfo.label}
            </span>
          </div>
          <h4 class="font-bold text-slate-900 text-sm leading-tight">${issue.title}</h4>
          <p class="text-slate-600 line-clamp-2 text-[11px]">${issue.description}</p>
          <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
            <span class="font-medium text-slate-700">▲ ${issue.upvotes} votes</span>
            <span class="font-medium ${statusInfo.color}">● ${statusInfo.label}</span>
          </div>
          <button id="view-btn-${issue.id}" class="mt-2 w-full py-1.5 px-3 bg-[#123B5D] hover:bg-[#0B263D] text-white font-medium rounded text-center transition-colors">
            View Issue &rarr;
          </button>
        </div>
      `;

      // Attach event listener to the button inside popup
      marker.bindPopup(popupContent, { maxWidth: 280, closeButton: false });

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
  }, [issues, selectedIssueId, isPickerMode]);

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

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#E4E7EC] shadow-xs ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full z-0" />
      
      {/* Legend overlay */}
      {!isPickerMode && (
        <div className="absolute bottom-3 right-3 z-1000 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-[#E4E7EC] shadow-sm text-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Severity Legend
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E8B57]" /> Low
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D69E2E]" /> Medium
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DD6B20]" /> High
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D64545]" /> Critical
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
