import { create } from 'zustand';
import {
  DriverAvailability,
  DriverStats,
  LocationPermissionState,
  Driver,
} from '../models/types';
import { DriverRepository } from '../repositories/driver.repository';
import { LocationService } from '../services/location.service';
import { NetworkService } from '../services/network.service';

interface DriverAvailabilityState {
  availability: DriverAvailability;
  locationPermission: LocationPermissionState;
  isLocationActive: boolean;
  currentCoords: { latitude: number; longitude: number; heading: number } | null;
  isNetworkConnected: boolean;
  validationError: string | null;
  isUpdatingStatus: boolean;
  stats: DriverStats | null;
  isLoadingStats: boolean;

  // Actions
  initializeAvailability: (driver: Driver | null) => Promise<void>;
  checkNetworkAndLocation: () => Promise<void>;
  goOnline: (userUid: string, profile: Driver | null) => Promise<boolean>;
  goOffline: (userUid: string) => Promise<boolean>;
  fetchStats: (driverId: string) => Promise<void>;
  clearValidationError: () => void;
  setNetworkConnected: (isConnected: boolean) => void;
}

export const useDriverAvailabilityStore = create<DriverAvailabilityState>((set, get) => ({
  availability: 'offline',
  locationPermission: 'unknown',
  isLocationActive: false,
  currentCoords: null,
  isNetworkConnected: NetworkService.isOnline(),
  validationError: null,
  isUpdatingStatus: false,
  stats: null,
  isLoadingStats: false,

  initializeAvailability: async (driver: Driver | null) => {
    if (!driver) {
      set({ availability: 'offline', isLocationActive: false });
      LocationService.stopLocationUpdates();
      return;
    }

    // Determine initial availability from backend
    if (!driver.isApproved || driver.approvalStatus !== 'approved') {
      set({ availability: 'offline', isLocationActive: false });
      LocationService.stopLocationUpdates();
      return;
    }

    if (driver.isOnline && !driver.isAvailable) {
      set({ availability: 'busy' });
    } else if (driver.isOnline) {
      // Driver was marked online in backend. Validate if device can maintain session
      const networkOk = NetworkService.isOnline();
      if (!networkOk) {
        set({
          availability: 'offline',
          isLocationActive: false,
          validationError: 'Internet connection is unavailable.',
        });
        await DriverRepository.updateOnlineStatus(driver.driverId, false, false);
        return;
      }

      try {
        const coords = await LocationService.getCurrentLocation();
        set({
          availability: 'online',
          currentCoords: coords,
          isLocationActive: true,
          locationPermission: 'granted',
        });
      } catch (err: any) {
        // Location failed, safely set offline in backend
        set({
          availability: 'offline',
          isLocationActive: false,
          validationError: 'Device location is unavailable. Set offline.',
        });
        await DriverRepository.updateOnlineStatus(driver.driverId, false, false);
      }
    } else {
      set({ availability: 'offline', isLocationActive: false });
      LocationService.stopLocationUpdates();
    }
  },

  checkNetworkAndLocation: async () => {
    const isOnline = NetworkService.isOnline();
    set({ isNetworkConnected: isOnline });

    const perm = await LocationService.checkPermission();
    set({ locationPermission: perm });
  },

  goOnline: async (userUid: string, profile: Driver | null) => {
    set({ isUpdatingStatus: true, validationError: null });

    // 1. Check Network
    if (!NetworkService.isOnline()) {
      set({
        isUpdatingStatus: false,
        validationError: 'Internet connection is unavailable.',
      });
      return false;
    }

    // 2. Check Profile Existence
    if (!profile) {
      set({
        isUpdatingStatus: false,
        validationError: 'Driver profile not found. Please complete profile.',
      });
      return false;
    }

    // 3. Check Approval Status
    if (!profile.isApproved || profile.approvalStatus !== 'approved') {
      set({
        isUpdatingStatus: false,
        validationError: 'Your account is not approved yet.',
      });
      return false;
    }

    // 4. Check Vehicle Details
    if (!profile.vehicleType || !profile.vehicleNumber || profile.vehicleNumber.trim().length < 4) {
      set({
        isUpdatingStatus: false,
        validationError: 'Please complete vehicle details before going online.',
      });
      return false;
    }

    // 5. Check Location Permission
    try {
      const permGranted = await LocationService.requestPermission();
      if (!permGranted) {
        set({
          isUpdatingStatus: false,
          locationPermission: 'denied',
          validationError: 'Location permission is required to accept ride requests.',
        });
        return false;
      }
      set({ locationPermission: 'granted' });
    } catch (err: any) {
      set({
        isUpdatingStatus: false,
        locationPermission: 'denied',
        validationError: err.message || 'Location permission is required.',
      });
      return false;
    }

    // 6. Get Device Location
    let coords: { latitude: number; longitude: number; heading: number; accuracy: number };
    try {
      coords = await LocationService.getCurrentLocation();
      set({ currentCoords: coords });
    } catch (err: any) {
      set({
        isUpdatingStatus: false,
        validationError: err.message || 'Please enable device location (GPS).',
      });
      return false;
    }

    // 7. Atomic Firestore Update
    try {
      await DriverRepository.updateOnlineStatus(userUid, true, true);

      set({
        availability: 'online',
        isLocationActive: true,
        isUpdatingStatus: false,
        validationError: null,
      });
      return true;
    } catch (err: any) {
      set({
        availability: 'offline',
        isLocationActive: false,
        isUpdatingStatus: false,
        validationError: 'Failed to update online status. Please retry.',
      });
      return false;
    }
  },

  goOffline: async (userUid: string) => {
    set({ isUpdatingStatus: true, validationError: null });

    try {
      // Stop location updates first
      LocationService.stopLocationUpdates();

      // Atomic Firestore Update
      await DriverRepository.updateOnlineStatus(userUid, false, false);

      set({
        availability: 'offline',
        isLocationActive: false,
        isUpdatingStatus: false,
      });
      return true;
    } catch (err: any) {
      set({
        isUpdatingStatus: false,
        validationError: 'Failed to set offline status. Please retry.',
      });
      return false;
    }
  },

  fetchStats: async (driverId: string) => {
    set({ isLoadingStats: true });
    try {
      const stats = await DriverRepository.getDriverStats(driverId);
      set({ stats, isLoadingStats: false });
    } catch {
      set({ isLoadingStats: false });
    }
  },

  clearValidationError: () => set({ validationError: null }),

  setNetworkConnected: (isConnected: boolean) => {
    set((state) => {
      // If connection drops while online, notify driver without corrupting state
      const updates: Partial<DriverAvailabilityState> = { isNetworkConnected: isConnected };
      if (!isConnected && state.availability === 'online') {
        updates.validationError = 'Connection lost. Operating in offline reconnect mode.';
      }
      return updates;
    });
  },
}));
