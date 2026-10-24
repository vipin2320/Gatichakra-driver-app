import { create } from 'zustand';
import { Ride, RideStatus } from '../models/types';
import { MapplsService, LatLng, RouteResult } from '../services/mappls.service';
import { NavigationRepository } from '../repositories/navigation.repository';

export interface NavigationState {
  // Route Data
  activeRideId: string | null;
  pickupLocation: LatLng | null;
  pickupAddress: string;
  routeGeometry: [number, number][];
  distanceKm: number | null;
  durationMinutes: number | null;
  formattedDistance: string;
  formattedEta: string;

  // Status & Flags
  routeStatus: 'idle' | 'loading' | 'active' | 'error';
  errorMessage: string | null;
  isRecalculating: boolean;
  isNearPickup: boolean;
  isOffRoute: boolean;
  driverHeading: number;

  // Internal Throttling Trackers
  lastCalculatedOrigin: LatLng | null;
  lastCalculatedTimestamp: number;

  // Actions
  initNavigationForRide: (ride: Ride, driverLocation: LatLng | null) => Promise<void>;
  updateDriverPosition: (driverLocation: LatLng & { heading?: number }) => Promise<void>;
  recalculateRoute: () => Promise<void>;
  clearNavigation: () => void;
  clearError: () => void;
}

// Configurable constants
const MIN_RECALCULATION_DISTANCE_METERS = 60; // 60 meters movement threshold
const MIN_RECALCULATION_INTERVAL_MS = 15000; // 15 seconds cooldown between API routing calls
const OFF_ROUTE_THRESHOLD_METERS = 80; // 80 meters away from polyline triggers off-route recalculation
const NEAR_PICKUP_THRESHOLD_METERS = 100; // 100 meters proximity to pickup

export const useNavigationStore = create<NavigationState>((set, get) => ({
  activeRideId: null,
  pickupLocation: null,
  pickupAddress: '',
  routeGeometry: [],
  distanceKm: null,
  durationMinutes: null,
  formattedDistance: '',
  formattedEta: '',

  routeStatus: 'idle',
  errorMessage: null,
  isRecalculating: false,
  isNearPickup: false,
  isOffRoute: false,
  driverHeading: 0,

  lastCalculatedOrigin: null,
  lastCalculatedTimestamp: 0,

  initNavigationForRide: async (ride: Ride, driverLocation: LatLng | null) => {
    // Only navigate during driverAssigned, driverArriving, or rideStarted
    if (
      ride.rideStatus !== RideStatus.DRIVER_ASSIGNED &&
      ride.rideStatus !== RideStatus.DRIVER_ARRIVING &&
      ride.rideStatus !== RideStatus.RIDE_STARTED
    ) {
      get().clearNavigation();
      return;
    }

    const isGoingToDestination = ride.rideStatus === RideStatus.RIDE_STARTED;
    const r = ride as any;

    // Use robust fallbacks for pickup & destination latitude/longitude keys from customer app
    const targetLat = isGoingToDestination
      ? (r.destinationLatitude ?? r.destinationLat ?? r.destLat ?? r.dropLat ?? r.destinationLocation?.latitude)
      : (r.pickupLatitude ?? r.pickupLat ?? r.pickupLocation?.latitude);

    const targetLng = isGoingToDestination
      ? (r.destinationLongitude ?? r.destinationLng ?? r.destLng ?? r.dropLng ?? r.destinationLocation?.longitude)
      : (r.pickupLongitude ?? r.pickupLng ?? r.pickupLocation?.longitude);

    const targetAddress = isGoingToDestination
      ? (ride.destinationAddress ?? 'Destination')
      : (ride.pickupAddress ?? 'Pickup Location');

    if (!targetLat || !targetLng || isNaN(Number(targetLat)) || isNaN(Number(targetLng))) {
      set({
        activeRideId: ride.rideId,
        pickupAddress: targetAddress,
        pickupLocation: null,
        routeStatus: 'error',
        errorMessage: isGoingToDestination
          ? 'Destination coordinates not available on ride document.'
          : 'Pickup coordinates not available on ride document.',
      });
      return;
    }

    const targetCoords: LatLng = { latitude: Number(targetLat), longitude: Number(targetLng) };

    // If already navigating this ride to same target and have route, don't re-init from scratch
    if (
      get().activeRideId === ride.rideId &&
      get().pickupLocation?.latitude === targetCoords.latitude &&
      get().pickupLocation?.longitude === targetCoords.longitude &&
      get().routeGeometry.length > 0 &&
      get().routeStatus === 'active'
    ) {
      return;
    }

    set({
      activeRideId: ride.rideId,
      pickupLocation: targetCoords,
      pickupAddress: targetAddress,
      routeStatus: 'loading',
      errorMessage: null,
    });

    const effectiveDriverLocation = (!driverLocation || isNaN(driverLocation.latitude) || isNaN(driverLocation.longitude))
      ? { latitude: 28.7472, longitude: 77.3451 }
      : driverLocation;

    try {
      const route = await NavigationRepository.getRouteToPickup(
        ride.rideId,
        effectiveDriverLocation,
        targetCoords,
        true
      );

      const nearPickup = MapplsService.isNearPickup(
        driverLocation || effectiveDriverLocation,
        targetCoords,
        NEAR_PICKUP_THRESHOLD_METERS
      );

      set({
        routeGeometry: route.geometry,
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
        formattedDistance: route.formattedDistance,
        formattedEta: route.formattedDuration,
        routeStatus: 'active',
        errorMessage: null,
        isNearPickup: nearPickup,
        isOffRoute: false,
        lastCalculatedOrigin: driverLocation || effectiveDriverLocation,
        lastCalculatedTimestamp: Date.now(),
      });
    } catch (err: any) {
      console.warn('Navigation route init failed:', err.message);
      set({
        routeStatus: 'error',
        errorMessage: err.message || 'Unable to calculate route. Retry.',
      });
    }
  },

  updateDriverPosition: async (driverLocation: LatLng & { heading?: number }) => {
    const state = get();
    if (!state.activeRideId || !state.pickupLocation) {
      return;
    }

    // Always update heading
    if (typeof driverLocation.heading === 'number' && !isNaN(driverLocation.heading)) {
      set({ driverHeading: driverLocation.heading });
    }

    // Check proximity to pickup
    const nearPickup = MapplsService.isNearPickup(
      driverLocation,
      state.pickupLocation,
      NEAR_PICKUP_THRESHOLD_METERS
    );
    if (nearPickup !== state.isNearPickup) {
      set({ isNearPickup: nearPickup });
    }

    // If we have no route yet (e.g. driver GPS was acquired after init)
    if (state.routeStatus === 'idle' || (state.routeStatus === 'loading' && state.routeGeometry.length === 0)) {
      set({ routeStatus: 'loading' });
      try {
        const route = await NavigationRepository.getRouteToPickup(
          state.activeRideId,
          driverLocation,
          state.pickupLocation
        );
        set({
          routeGeometry: route.geometry,
          distanceKm: route.distanceKm,
          durationMinutes: route.durationMinutes,
          formattedDistance: route.formattedDistance,
          formattedEta: route.formattedDuration,
          routeStatus: 'active',
          errorMessage: null,
          lastCalculatedOrigin: driverLocation,
          lastCalculatedTimestamp: Date.now(),
          isOffRoute: false,
        });
      } catch (err: any) {
        set({
          routeStatus: 'error',
          errorMessage: err.message || 'Unable to calculate route. Retry.',
        });
      }
      return;
    }

    if (state.routeStatus !== 'active' || state.isRecalculating) {
      return;
    }

    // Check if off-route
    const offRoute = MapplsService.isOffRoute(
      driverLocation,
      state.routeGeometry,
      OFF_ROUTE_THRESHOLD_METERS
    );

    const now = Date.now();
    const timeSinceLastCalc = now - state.lastCalculatedTimestamp;

    let distSinceLastCalc = 0;
    if (state.lastCalculatedOrigin) {
      distSinceLastCalc = MapplsService.calculateDistanceMeters(
        driverLocation.latitude,
        driverLocation.longitude,
        state.lastCalculatedOrigin.latitude,
        state.lastCalculatedOrigin.longitude
      );
    }

    // Recalculation triggers:
    // 1. Driver is off-route AND at least 10 seconds since last calculation
    // 2. Driver has moved > 60m AND at least 15 seconds since last calculation
    const shouldRecalculate =
      (offRoute && timeSinceLastCalc >= 10000) ||
      (distSinceLastCalc >= MIN_RECALCULATION_DISTANCE_METERS &&
        timeSinceLastCalc >= MIN_RECALCULATION_INTERVAL_MS);

    if (shouldRecalculate) {
      set({ isRecalculating: true, isOffRoute: offRoute });
      try {
        const route = await NavigationRepository.getRouteToPickup(
          state.activeRideId,
          driverLocation,
          state.pickupLocation,
          true
        );

        set({
          routeGeometry: route.geometry,
          distanceKm: route.distanceKm,
          durationMinutes: route.durationMinutes,
          formattedDistance: route.formattedDistance,
          formattedEta: route.formattedDuration,
          routeStatus: 'active',
          errorMessage: null,
          isRecalculating: false,
          isOffRoute: false,
          lastCalculatedOrigin: driverLocation,
          lastCalculatedTimestamp: now,
        });
      } catch (err) {
        console.warn('Background route recalculation failed, keeping current route.');
        set({ isRecalculating: false });
      }
    }
  },

  recalculateRoute: async () => {
    const state = get();
    if (!state.activeRideId || !state.pickupLocation) return;

    // Use last known origin or wait for position
    if (!state.lastCalculatedOrigin) return;

    set({ routeStatus: 'loading', errorMessage: null, isRecalculating: true });
    try {
      const route = await NavigationRepository.getRouteToPickup(
        state.activeRideId,
        state.lastCalculatedOrigin,
        state.pickupLocation,
        true
      );

      set({
        routeGeometry: route.geometry,
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
        formattedDistance: route.formattedDistance,
        formattedEta: route.formattedDuration,
        routeStatus: 'active',
        errorMessage: null,
        isRecalculating: false,
        isOffRoute: false,
        lastCalculatedTimestamp: Date.now(),
      });
    } catch (err: any) {
      set({
        routeStatus: 'error',
        errorMessage: err.message || 'Unable to calculate route. Retry.',
        isRecalculating: false,
      });
    }
  },

  clearNavigation: () => {
    NavigationRepository.clearCache();
    set({
      activeRideId: null,
      pickupLocation: null,
      pickupAddress: '',
      routeGeometry: [],
      distanceKm: null,
      durationMinutes: null,
      formattedDistance: '',
      formattedEta: '',
      routeStatus: 'idle',
      errorMessage: null,
      isRecalculating: false,
      isNearPickup: false,
      isOffRoute: false,
      lastCalculatedOrigin: null,
      lastCalculatedTimestamp: 0,
    });
  },

  clearError: () => set({ errorMessage: null }),
}));
