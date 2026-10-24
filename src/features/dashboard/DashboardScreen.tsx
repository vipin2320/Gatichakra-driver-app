import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../providers/authProvider';
import { useDriverStore } from '../../providers/driverProvider';
import { useDriverAvailabilityStore } from '../../providers/driverAvailabilityStore';
import { useRideStore } from '../../providers/rideProvider';
import { NetworkService } from '../../services/network.service';
import { Card } from '../../widgets/Card';
import { Button } from '../../widgets/Button';
import { RideRequestCard } from './components/RideRequestCard';
import { AssignedRideCard } from './components/AssignedRideCard';
import {
  Power,
  MapPin,
  Navigation,
  Star,
  TrendingUp,
  LogOut,
  ShieldCheck,
  WifiOff,
  AlertCircle,
  Car,
  User,
  FileText,
  Clock,
  ChevronRight,
  X,
  Settings,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { notificationService } from '../../services/notification.service';
import { cn } from '../../core/utils/cn';
import { LocationRepository } from '../../repositories/location.repository';

// Declare global window type for Mappls
declare global {
  interface Window {
    mappls: any;
  }
}

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { profile, subscribeToProfile, fetchProfile } = useDriverStore();
  const {
    availability,
    isLocationActive,
    currentCoords,
    isNetworkConnected,
    validationError,
    isUpdatingStatus,
    stats,
    initializeAvailability,
    goOnline,
    goOffline,
    fetchStats,
    clearValidationError,
    setNetworkConnected,
    checkNetworkAndLocation,
  } = useDriverAvailabilityStore();

  const { availableRides, activeRide, subscribeToRides } = useRideStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(notificationService.isSoundEnabled());

  // Map references and state
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const directionPluginRef = useRef<any>(null);

  // Simulation state and references
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  const startSimulation = async () => {
    if (!activeRide || !user) return;
    setIsSimulating(true);

    const isRideStarted = activeRide.rideStatus === 'rideStarted';
    const startLat = currentCoords?.latitude || 28.7472;
    const startLng = currentCoords?.longitude || 77.3451;

    const endLat = isRideStarted
      ? (activeRide.destinationLatitude || (activeRide as any).destinationLocation?.latitude)
      : (activeRide.pickupLatitude || (activeRide as any).pickupLocation?.latitude);

    const endLng = isRideStarted
      ? (activeRide.destinationLongitude || (activeRide as any).destinationLocation?.longitude)
      : (activeRide.pickupLongitude || (activeRide as any).pickupLocation?.longitude);

    if (!endLat || !endLng) {
      setIsSimulating(false);
      alert("Coordinates missing for simulation!");
      return;
    }

    // Interpolate 30 steps for a smooth 3D navigation feel
    const steps = 30;
    const path: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = startLat + (endLat - startLat) * t;
      const lng = startLng + (endLng - startLng) * t;
      path.push({ lat, lng });
    }

    let currentStep = 0;
    if (simulationRef.current) clearInterval(simulationRef.current);

    simulationRef.current = setInterval(async () => {
      if (currentStep >= path.length) {
        clearInterval(simulationRef.current);
        setIsSimulating(false);
        return;
      }

      const { lat, lng } = path[currentStep];
      let heading = 0;
      if (currentStep < path.length - 1) {
        const next = path[currentStep + 1];
        heading = Math.atan2(next.lng - lng, next.lat - lat) * (180 / Math.PI);
        if (heading < 0) heading += 360;
      }

      const mockLoc = { latitude: lat, longitude: lng, heading, accuracy: 5 };
      
      // Update store for local map update
      useDriverAvailabilityStore.setState({ currentCoords: mockLoc });

      // Save to Firebase so customer app sees the vehicle move in real-time!
      try {
        await LocationRepository.saveRealtimeLocation(user.uid, lat, lng, heading, 5);
      } catch (err) {
        console.warn('Realtime sim write skipped:', err);
      }

      currentStep++;
    }, 1500); // Glides nicely
  };

  const stopSimulation = () => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
    }
    setIsSimulating(false);
  };

  // 1. Subscribe to profile Firestore changes
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProfile(user.uid);
    fetchStats(user.uid);
    return () => unsubscribe();
  }, [user, subscribeToProfile, fetchStats]);

  // 2. Initialize availability state whenever driver profile updates
  useEffect(() => {
    if (profile) {
      initializeAvailability(profile);
    }
  }, [profile, initializeAvailability]);

  // 3. Real-time Ride Request Listener (attaches when online/approved)
  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeToRides(profile);
    return () => unsub();
  }, [profile, availability, subscribeToRides]);

  // 4. Subscribe to Network Status
  useEffect(() => {
    const unsubNetwork = NetworkService.subscribe((isOnline) => {
      setNetworkConnected(isOnline);
    });
    return () => unsubNetwork();
  }, [setNetworkConnected]);

  // Periodic network and location check
  useEffect(() => {
    checkNetworkAndLocation();
  }, [checkNetworkAndLocation]);

  // 5. Initialize Mappls Web Map
  useEffect(() => {
    if (!mapRef.current) return;

    let checkInterval: any = null;

    const initMap = () => {
      if (typeof window.mappls === 'undefined' || typeof window.mappls.Map === 'undefined') {
        return false;
      }

      // Default to current coordinates if available, otherwise Javli coordinates [28.7472, 77.3451]
      const defaultLat = currentCoords?.latitude || 28.7472;
      const defaultLng = currentCoords?.longitude || 77.3451;

      if (!mapInstanceRef.current && mapRef.current) {
        try {
          const map = new window.mappls.Map(mapRef.current, {
            center: [defaultLat, defaultLng],
            zoom: 15,
            tilt: 45, // 3D navigation look
            heading: 0,
            search: false,
            zoomControl: false,
            hybrid: false,
            location: false,
          });

          map.on('load', () => {
            mapInstanceRef.current = map;

            // Create initial driver car marker
            try {
              if (window.mappls.Marker) {
                const marker = new window.mappls.Marker({
                  map: map,
                  position: { lat: defaultLat, lng: defaultLng },
                  fitbounds: false,
                  icon_url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
                });
                driverMarkerRef.current = marker;
              }
            } catch (err) {
              console.warn('[Mappls] Error creating driver marker:', err);
            }
          });
        } catch (e) {
          console.error('[Mappls] Map initialization error:', e);
        }
      }
      return true;
    };

    if (!initMap()) {
      checkInterval = setInterval(() => {
        if (initMap()) {
          clearInterval(checkInterval);
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (directionPluginRef.current?.remove) {
        try {
          directionPluginRef.current.remove();
        } catch (_) {}
      }
      if (mapInstanceRef.current?.remove) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 6. Update Driver Marker position when currentCoords change
  useEffect(() => {
    if (!currentCoords) return;
    const lat = currentCoords.latitude;
    const lng = currentCoords.longitude;

    if (mapInstanceRef.current) {
      if (driverMarkerRef.current) {
        try {
          if (typeof driverMarkerRef.current.setPosition === 'function') {
            driverMarkerRef.current.setPosition({ lat, lng });
          } else if (driverMarkerRef.current.remove) {
            driverMarkerRef.current.remove();
            if (window.mappls?.Marker) {
              driverMarkerRef.current = new window.mappls.Marker({
                map: mapInstanceRef.current,
                position: { lat, lng },
                fitbounds: false,
                icon_url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
              });
            }
          }
        } catch (err) {
          console.warn('[Mappls] Error updating driver marker:', err);
        }
      }

      // Smooth pan if no active navigation taking full control
      if (!activeRide) {
        try {
          mapInstanceRef.current.setCenter([lat, lng]);
        } catch (_) {}
      }
    }
  }, [currentCoords, activeRide]);

  // 7. Active Ride Routing & Pickup Marker handling
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window.mappls === 'undefined') return;

    // Clean previous pickup marker and direction if any
    if (pickupMarkerRef.current?.remove) {
      try {
        pickupMarkerRef.current.remove();
      } catch (_) {}
      pickupMarkerRef.current = null;
    }
    if (directionPluginRef.current?.remove) {
      try {
        directionPluginRef.current.remove();
      } catch (_) {}
      directionPluginRef.current = null;
    }

    if (activeRide && (activeRide.pickupLatitude || (activeRide as any).pickupLocation?.latitude)) {
      const isRideStarted = activeRide.rideStatus === 'rideStarted';
      
      const targetLat = isRideStarted 
        ? (activeRide.destinationLatitude || (activeRide as any).destinationLocation?.latitude) 
        : (activeRide.pickupLatitude || (activeRide as any).pickupLocation?.latitude);
      
      const targetLng = isRideStarted 
        ? (activeRide.destinationLongitude || (activeRide as any).destinationLocation?.longitude) 
        : (activeRide.pickupLongitude || (activeRide as any).pickupLocation?.longitude);
        
      const targetAddr = isRideStarted 
        ? (activeRide.destinationAddress || 'Destination') 
        : (activeRide.pickupAddress || (activeRide as any).pickupLocation?.address || 'Pickup Location');

      const driverLat = currentCoords?.latitude || 28.7472;
      const driverLng = currentCoords?.longitude || 77.3451;

      // Draw Customer's Marker (Pickup or Drop based on status)
      try {
        if (window.mappls.Marker) {
          const pMarker = new window.mappls.Marker({
            map: mapInstanceRef.current,
            position: { lat: targetLat, lng: targetLng },
            fitbounds: true,
            popupHtml: `<div style="font-family:sans-serif;padding:6px;font-size:12px;font-weight:bold;color:#1e293b;">${isRideStarted ? '🏁 Drop: ' : '📍 Pickup: '} ${targetAddr}</div>`,
          });
          pickupMarkerRef.current = pMarker;
        }
      } catch (err) {
        console.warn('[Mappls] Error creating marker:', err);
      }

      // Draw Bold Navigation Route with strong Polyline Fallbacks (CORS or API key bypass)
      try {
        if (typeof window.mappls.direction === 'function') {
          window.mappls.direction(
            {
              map: mapInstanceRef.current,
              start: `${driverLat},${driverLng}`,
              end: `${targetLat},${targetLng}`,
              strokeColor: isRideStarted ? '#059669' : '#FF3B30',
              strokeWeight: 6,
              fitbounds: true,
              resource: 'route_eta',
              profile: 'driving',
            },
            (data: any) => {
              directionPluginRef.current = data;
            }
          );
        } else if (window.mappls.Polyline) {
          const fallbackLine = new window.mappls.Polyline({
            map: mapInstanceRef.current,
            paths: [{ lat: driverLat, lng: driverLng }, { lat: targetLat, lng: targetLng }],
            strokeColor: isRideStarted ? '#059669' : '#FF3B30',
            strokeOpacity: 0.9,
            strokeWeight: 6,
            fitbounds: true,
          });
          directionPluginRef.current = fallbackLine;
        }
      } catch (err) {
        console.warn('[Mappls] Direction plugin failed, drawing straight fallback polyline:', err);
        try {
          if (window.mappls.Polyline) {
            const fallbackLine = new window.mappls.Polyline({
              map: mapInstanceRef.current,
              paths: [{ lat: driverLat, lng: driverLng }, { lat: targetLat, lng: targetLng }],
              strokeColor: isRideStarted ? '#059669' : '#FF3B30',
              strokeOpacity: 0.9,
              strokeWeight: 6,
              fitbounds: true,
            });
            directionPluginRef.current = fallbackLine;
          }
        } catch (_) {}
      }
    }
  }, [activeRide, currentCoords]);

  const handleToggleOnline = async () => {
    if (!user || !profile) return;

    if (availability === 'online') {
      await goOffline(user.uid);
    } else if (availability === 'offline') {
      await goOnline(user.uid, profile);
    }
  };

  const handleToggleSound = () => {
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    notificationService.setSoundEnabled(nextState);
  };

  const handleLogout = async () => {
    if (user && availability === 'online') {
      await goOffline(user.uid);
    }
    await signOut();
    navigate('/login', { replace: true });
  };

  const formattedVehicleType =
    profile?.vehicleType?.replace('_', ' ').toUpperCase() || 'VEHICLE';

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-900 flex flex-col">
      {/* 3D Mappls Background Map Container */}
      <div className="absolute inset-0 z-0">
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Floating UI Container (pointer-events-none with pointer-events-auto for widgets) */}
      <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
        {/* Network Lost Banner */}
        {!isNetworkConnected && (
          <div className="pointer-events-auto bg-red-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center space-x-2 sticky top-0 z-30 shadow-md">
            <WifiOff size={16} />
            <span>Connection lost — Please check your internet connection.</span>
          </div>
        )}

        {/* Top Header Floating Bar */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-5 py-3 shadow-lg border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-11 w-11 rounded-full bg-slate-200 border-2 border-sky-500 overflow-hidden flex items-center justify-center shadow-sm">
                {profile?.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-slate-600">
                    {profile?.name?.charAt(0) || 'D'}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white',
                  availability === 'online'
                    ? 'bg-emerald-500'
                    : availability === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                )}
              />
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="font-bold text-slate-900 leading-tight text-base">
                  {profile?.name || 'Driver'}
                </h2>
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md tracking-wider">
                  {formattedVehicleType}
                </span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  {profile?.vehicleNumber || 'NO REG'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Quick Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSound}
              className={cn(
                'p-2 rounded-full transition-colors text-xs font-bold flex items-center',
                isSoundOn ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-400'
              )}
              title={isSoundOn ? 'Mute request chime' : 'Enable request chime'}
            >
              {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              aria-label="Open settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Floating Content Body */}
        <div className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col justify-between space-y-4">
          {/* Status & Location Pill Header */}
          <div className="pointer-events-auto flex items-center justify-between">
            {/* Availability Status Indicator */}
            <div
              className={cn(
                'px-3.5 py-1.5 rounded-full font-bold text-xs tracking-wide shadow-md flex items-center border backdrop-blur-md',
                availability === 'online'
                  ? 'bg-emerald-500/90 text-white border-emerald-400'
                  : availability === 'busy'
                  ? 'bg-amber-500/90 text-white border-amber-400'
                  : 'bg-slate-800/90 text-slate-200 border-slate-700'
              )}
            >
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full mr-2',
                  availability === 'online'
                    ? 'bg-white animate-pulse'
                    : availability === 'busy'
                    ? 'bg-white animate-ping'
                    : 'bg-slate-400'
                )}
              />
              {availability === 'online'
                ? 'ONLINE & AVAILABLE'
                : availability === 'busy'
                ? 'ON RIDE (BUSY)'
                : 'OFFLINE'}
            </div>

            {/* Location Active Indicator */}
            <div
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-semibold flex items-center backdrop-blur-md shadow-md',
                isLocationActive
                  ? 'bg-sky-600/90 text-white'
                  : 'bg-slate-800/80 text-slate-300'
              )}
            >
              <MapPin size={12} className="mr-1" />
              {isLocationActive ? 'Location Active' : 'Location Standby'}
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="pointer-events-auto p-4 bg-red-500/95 text-white border border-red-400 rounded-2xl flex items-start justify-between shadow-lg backdrop-blur-md">
              <div className="flex items-start space-x-3">
                <AlertCircle size={20} className="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Cannot Go Online
                  </h4>
                  <p className="text-xs font-medium mt-0.5">
                    {validationError}
                  </p>
                </div>
              </div>
              <button
                onClick={clearValidationError}
                className="p-1 text-white/80 hover:text-white rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Middle Section: Active Ride Card OR Incoming Request Cards */}
          <div className="pointer-events-auto w-full my-auto space-y-3">
            {/* CASE A: DRIVER HAS AN ACTIVE ASSIGNED RIDE */}
            {activeRide ? (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-slate-900 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                    Current Ride
                  </span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
                    Active Assignment
                  </span>
                </div>

                {/* Developer testing simulation widget */}
                <div className="pointer-events-auto bg-gradient-to-r from-indigo-950/95 to-purple-950/95 border border-indigo-500/40 p-4 rounded-2xl shadow-xl backdrop-blur-md flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 text-white">
                    <Sparkles className="text-amber-400 animate-pulse flex-shrink-0" size={16} />
                    <span className="text-[11px] font-black tracking-wider uppercase text-indigo-200">Demo Simulation Panel</span>
                  </div>
                  <p className="text-[10px] leading-snug text-indigo-300">
                    {activeRide.rideStatus === 'rideStarted' 
                      ? "Automatically moves the vehicle smoothly along the route to the Destination!" 
                      : "Automatically moves the vehicle smoothly along the route to the Pickup point!"}
                  </p>
                  <button
                    onClick={isSimulating ? stopSimulation : startSimulation}
                    className={cn(
                      "w-full py-2 rounded-xl font-bold text-xs tracking-wider uppercase shadow-md flex items-center justify-center space-x-2 text-white transition-all transform active:scale-95",
                      isSimulating 
                        ? "bg-rose-600 hover:bg-rose-700 animate-pulse" 
                        : "bg-indigo-600 hover:bg-indigo-700"
                    )}
                  >
                    <span>{isSimulating ? "🛑 STOP SIMULATION" : "🚗 START DEMO RIDE SIMULATION"}</span>
                  </button>
                </div>

                <AssignedRideCard ride={activeRide} />
              </div>
            ) : availability === 'online' ? (
              /* CASE B: ONLINE & AVAILABLE — Display Incoming Requests */
              availableRides.length > 0 ? (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black text-sky-950 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center shadow-sm">
                      <Sparkles size={14} className="mr-1 text-sky-600 animate-spin" />
                      Eligible Ride Requests ({availableRides.length})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-950 bg-emerald-200/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
                      Realtime Stream
                    </span>
                  </div>

                  {availableRides.map((ride) => (
                    <RideRequestCard
                      key={ride.rideId}
                      ride={ride}
                      driver={profile!}
                    />
                  ))}
                </div>
              ) : null
            ) : null}
          </div>

          {/* Bottom Floating Control: Online/Offline Button & Stats Card */}
          <div className="pointer-events-auto space-y-3 pt-2">
            {!activeRide && (
              <div className="flex justify-center py-2">
                <button
                  onClick={handleToggleOnline}
                  disabled={isUpdatingStatus || availability === 'busy'}
                  className={cn(
                    'relative h-20 w-64 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ease-in-out transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed border-2 border-white/40 backdrop-blur-md',
                    availability === 'online'
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-red-500/50 text-white'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-500/50 text-white'
                  )}
                >
                  {availability === 'online' && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400/40 animate-ping pointer-events-none" />
                  )}

                  {isUpdatingStatus ? (
                    <RefreshCw size={26} className="animate-spin mr-3" />
                  ) : (
                    <Power size={26} className="mr-3" strokeWidth={2.5} />
                  )}

                  <span className="font-extrabold text-lg tracking-wider uppercase">
                    {isUpdatingStatus
                      ? 'UPDATING...'
                      : availability === 'online'
                      ? 'GO OFFLINE'
                      : 'GO ONLINE'}
                  </span>

                  {availability === 'busy' && (
                    <span className="text-[10px] font-bold bg-black/30 px-2 py-0.5 rounded-md ml-2">
                      ON RIDE
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Quick Performance Strip */}
            <div className="grid grid-cols-4 gap-2 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-slate-200/80">
              <div className="flex flex-col items-center text-center">
                <TrendingUp size={14} className="text-emerald-500 mb-0.5" />
                <span className="text-xs font-black text-slate-900">
                  ₹{stats?.todayEarnings ?? 0}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Earnings
                </span>
              </div>

              <div className="flex flex-col items-center text-center border-l border-slate-200">
                <Navigation size={14} className="text-sky-500 mb-0.5" />
                <span className="text-xs font-black text-slate-900">
                  {stats?.todayTrips ?? 0}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Today
                </span>
              </div>

              <div className="flex flex-col items-center text-center border-l border-slate-200">
                <Star size={14} className="text-amber-500 fill-current mb-0.5" />
                <span className="text-xs font-black text-slate-900">
                  {(stats?.rating || profile?.rating || 5.0).toFixed(1)}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Rating
                </span>
              </div>

              <div className="flex flex-col items-center text-center border-l border-slate-200">
                <Car size={14} className="text-purple-500 mb-0.5" />
                <span className="text-xs font-black text-slate-900">
                  {stats?.totalTrips || profile?.totalTrips || 0}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer / Shortcuts Sheet */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-xs bg-white h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">Driver Portal</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Brief */}
            <div className="py-4 border-b border-slate-100 flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-slate-200 border border-sky-500 overflow-hidden flex items-center justify-center">
                {profile?.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{profile?.name}</h4>
                <p className="text-xs text-slate-500">{profile?.phone}</p>
                <span className="inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                  Verified Driver
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="py-4 space-y-1 flex-1">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                <span className="flex items-center">
                  <User size={18} className="mr-3 text-sky-500" /> My Profile
                </span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/vehicle');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                <span className="flex items-center">
                  <Car size={18} className="mr-3 text-emerald-500" /> Vehicle Details
                </span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/documents');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                <span className="flex items-center">
                  <FileText size={18} className="mr-3 text-amber-500" /> Verification Documents
                </span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/pending-approval');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                <span className="flex items-center">
                  <Clock size={18} className="mr-3 text-purple-500" /> Verification Status
                </span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
