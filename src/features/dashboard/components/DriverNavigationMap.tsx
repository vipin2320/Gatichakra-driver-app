import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { LatLng } from '../../../services/mappls.service';
import { useNavigationStore } from '../../../providers/navigationProvider';
import {
  Navigation2,
  MapPin,
  Compass,
  AlertCircle,
  RefreshCw,
  Maximize2,
  CheckCircle,
  Radio,
} from 'lucide-react';
import { cn } from '../../../core/utils/cn';

interface DriverNavigationMapProps {
  driverLocation: LatLng | null;
  driverHeading?: number;
  pickupLocation: LatLng | null;
  pickupAddress: string;
  className?: string;
}

export function DriverNavigationMap({
  driverLocation,
  driverHeading = 0,
  pickupLocation,
  pickupAddress,
  className,
}: DriverNavigationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [initialBoundsSet, setInitialBoundsSet] = useState(false);

  const {
    routeGeometry,
    formattedDistance,
    formattedEta,
    routeStatus,
    errorMessage,
    isRecalculating,
    isNearPickup,
    isOffRoute,
    recalculateRoute,
  } = useNavigationStore();

  // Create custom Driver Marker icon with heading rotation
  const createDriverIcon = useCallback((heading: number = 0) => {
    return L.divIcon({
      className: 'custom-driver-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.25); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
          <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #059669 0%, #047857 100%); border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.3s ease-out;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2" fill="white"></polygon>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }, []);

  // Create custom Pickup Marker icon
  const createPickupIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-pickup-marker',
      html: `
        <div style="position: relative; width: 36px; height: 44px; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #2563eb; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div style="width: 4px; height: 8px; background: #1d4ed8; border-radius: 2px;"></div>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 42],
    });
  }, []);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = driverLocation?.latitude || pickupLocation?.latitude || 28.6139;
    const initialLng = driverLocation?.longitude || pickupLocation?.longitude || 77.209;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Standard high-performance map tile layer with attribution & fallback handling
    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      }
    );
    tileLayer.on('tileerror', () => {});
    tileLayer.addTo(map);

    // Add zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Track user drag/zoom interaction
    map.on('dragstart zoomstart', () => {
      setHasUserInteracted(true);
    });

    mapInstanceRef.current = map;

    // Resize listener
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Driver Marker on live GPS update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !driverLocation) return;

    const { latitude: targetLat, longitude: targetLng } = driverLocation;
    if (isNaN(targetLat) || isNaN(targetLng)) return;

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([targetLat, targetLng], {
        icon: createDriverIcon(driverHeading),
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      // Smooth interpolation animation
      const oldLatLng = driverMarkerRef.current.getLatLng();
      const startLat = oldLatLng.lat;
      const startLng = oldLatLng.lng;
      const startTime = performance.now();
      const duration = 500; // ms

      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentLat = startLat + (targetLat - startLat) * progress;
        const currentLng = startLng + (targetLng - startLng) * progress;
        
        driverMarkerRef.current?.setLatLng([currentLat, currentLng]);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      driverMarkerRef.current.setIcon(createDriverIcon(driverHeading));
    }
  }, [driverLocation, driverHeading, createDriverIcon]);

  // 3. Update Pickup Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !pickupLocation) return;

    const { latitude, longitude } = pickupLocation;
    if (isNaN(latitude) || isNaN(longitude)) return;

    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = L.marker([latitude, longitude], {
        icon: createPickupIcon(),
        zIndexOffset: 900,
      }).addTo(map);
      pickupMarkerRef.current.bindPopup(
        `<div style="font-size:12px; font-weight:bold; color:#1e293b; padding:2px;">
          <div style="color:#2563eb; font-size:10px; text-transform:uppercase; font-weight:800;">Pickup Location</div>
          ${pickupAddress || 'Customer Pickup'}
        </div>`,
        { closeButton: false }
      );
    } else {
      pickupMarkerRef.current.setLatLng([latitude, longitude]);
    }
  }, [pickupLocation, pickupAddress, createPickupIcon]);

  // 4. Render Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (routeGeometry && routeGeometry.length > 1) {
      // Create new polyline with glowing casing and main line
      polylineRef.current = L.polyline(routeGeometry, {
        color: '#059669', // Emerald driving route
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Fit map bounds to show whole route initially or when recalculated if user hasn't actively zoomed elsewhere
      if (!initialBoundsSet || !hasUserInteracted) {
        const bounds = L.latLngBounds(routeGeometry);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        setInitialBoundsSet(true);
      }
    }
  }, [routeGeometry, initialBoundsSet, hasUserInteracted]);

  // Center on Driver action
  const handleCenterOnDriver = () => {
    const map = mapInstanceRef.current;
    if (!map || !driverLocation) return;

    map.setView([driverLocation.latitude, driverLocation.longitude], 16, {
      animate: true,
      duration: 0.5,
    });
    setHasUserInteracted(false);
  };

  // Center on Full Route Bounds action
  const handleFitRouteBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeGeometry && routeGeometry.length > 1) {
      const bounds = L.latLngBounds(routeGeometry);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
    } else if (driverLocation && pickupLocation) {
      const bounds = L.latLngBounds([
        [driverLocation.latitude, driverLocation.longitude],
        [pickupLocation.latitude, pickupLocation.longitude],
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
    }
    setHasUserInteracted(false);
  };

  return (
    <div className={cn('relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 bg-slate-100 flex flex-col', className)}>
      {/* Interactive Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[220px]" />

      {/* Floating Status & Overlay Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-[400]">
        {/* Left Badge: Live ETA & Distance HUD */}
        {formattedDistance && formattedEta ? (
          <div className="bg-slate-950/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 pointer-events-auto flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black text-emerald-400">
                {formattedDistance}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <span className="text-xs font-bold text-slate-200">
              {formattedEta}
            </span>
          </div>
        ) : routeStatus === 'loading' ? (
          <div className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 pointer-events-auto flex items-center space-x-2 text-xs font-semibold">
            <RefreshCw size={13} className="animate-spin text-sky-400" />
            <span>Calculating Route...</span>
          </div>
        ) : null}

        {/* Right Badge: Recalculating or Near Pickup */}
        <div className="flex flex-col items-end space-y-1.5 pointer-events-auto">
          {isNearPickup && (
            <div className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-md flex items-center space-x-1 animate-bounce">
              <CheckCircle size={13} />
              <span>Near Pickup (≤100m)</span>
            </div>
          )}

          {isRecalculating && (
            <div className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow flex items-center space-x-1">
              <RefreshCw size={11} className="animate-spin" />
              <span>{isOffRoute ? 'Off-route • Recalculating' : 'Updating Route'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Map Controls (Center on Driver / Fit Route) */}
      <div className="absolute bottom-3 right-3 flex flex-col space-y-2 pointer-events-auto z-[400]">
        <button
          type="button"
          onClick={handleFitRouteBounds}
          title="Fit entire route"
          className="h-10 w-10 bg-white/95 text-slate-700 hover:text-slate-900 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-transform active:scale-95"
        >
          <Maximize2 size={16} />
        </button>

        <button
          type="button"
          onClick={handleCenterOnDriver}
          title="Center on Driver"
          className="h-10 w-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-transform active:scale-95"
        >
          <Navigation2 size={18} />
        </button>
      </div>

      {/* Error / Retry Banner */}
      {routeStatus === 'error' && (
        <div className="absolute inset-x-3 bottom-3 bg-red-950/90 text-white backdrop-blur-md p-3 rounded-xl shadow-xl border border-red-800/60 flex items-center justify-between pointer-events-auto z-[400]">
          <div className="flex items-center space-x-2 text-xs font-semibold text-red-200">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span className="truncate">{errorMessage || 'Unable to calculate route.'}</span>
          </div>
          <button
            type="button"
            onClick={recalculateRoute}
            className="ml-2 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 flex-shrink-0"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
}
