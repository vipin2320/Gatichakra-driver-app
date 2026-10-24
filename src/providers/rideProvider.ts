import { create } from 'zustand';
import { Ride, Driver, VehicleType, RideStatus } from '../models/types';
import { RideRepository } from '../repositories/ride.repository';
import { LocationService } from '../services/location.service';
import { notificationService } from '../services/notification.service';
import { useDriverAvailabilityStore } from './driverAvailabilityStore';
import { useNavigationStore } from './navigationProvider';
import { Unsubscribe } from 'firebase/firestore';

interface RideState {
  availableRides: Ride[];
  activeRide: Ride | null;
  declinedRideIds: string[];
  isAccepting: boolean;
  acceptError: string | null;
  selectedRide: Ride | null;
  isSubscribed: boolean;
  locationError: string | null;
  isGpsTracking: boolean;

  // Actions
  subscribeToRides: (driver: Driver | null) => () => void;
  acceptRide: (rideId: string, driver: Driver) => Promise<boolean>;
  updateRideStatus: (rideId: string, driverId: string, currentStatus: RideStatus, newStatus: RideStatus) => Promise<boolean>;
  declineRide: (rideId: string) => void;
  selectRide: (ride: Ride | null) => void;
  clearAcceptError: () => void;
  clearLocationError: () => void;
}

let availableRidesUnsub: Unsubscribe | null = null;
let activeRideUnsub: Unsubscribe | null = null;
let previousRideIds: Set<string> = new Set();
let visibilityHandler: (() => void) | null = null;

const ACTIVE_RIDE_STATUSES = [
  RideStatus.DRIVER_ASSIGNED,
  RideStatus.DRIVER_ARRIVING,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.RIDE_STARTED,
];

export const useRideStore = create<RideState>((set, get) => ({
  availableRides: [],
  activeRide: null,
  declinedRideIds: [],
  isAccepting: false,
  acceptError: null,
  selectedRide: null,
  isSubscribed: false,
  locationError: null,
  isGpsTracking: false,

  subscribeToRides: (driver: Driver | null) => {
    // Unsubscribe existing listeners
    if (availableRidesUnsub) {
      availableRidesUnsub();
      availableRidesUnsub = null;
    }
    if (activeRideUnsub) {
      activeRideUnsub();
      activeRideUnsub = null;
    }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }

    if (!driver || !driver.driverId || !driver.isApproved || !driver.isOnline) {
      LocationService.stopLocationUpdates();
      useNavigationStore.getState().clearNavigation();
      set({
        availableRides: [],
        activeRide: null,
        isSubscribed: false,
        isGpsTracking: false,
        locationError: null,
      });
      return () => {};
    }

    const currentDriverId = driver.driverId;

    // Helper to start/resume GPS tracking during active rides
    const ensureGpsTracking = () => {
      const state = get();
      if (
        state.activeRide &&
        ACTIVE_RIDE_STATUSES.includes(state.activeRide.rideStatus as RideStatus)
      ) {
        LocationService.startLocationUpdates(
          currentDriverId,
          (loc) => {
            set({ isGpsTracking: true, locationError: null });
            useDriverAvailabilityStore.setState({ currentCoords: loc });
            useNavigationStore.getState().updateDriverPosition(loc);
          },
          (err) => {
            set({ locationError: err, isGpsTracking: false });
          }
        );
      }
    };

    // 1. Listen to active assigned ride for this driver
    activeRideUnsub = RideRepository.listenToActiveDriverRide(
      currentDriverId,
      (activeRide) => {
        set({ activeRide });

        if (
          activeRide &&
          ACTIVE_RIDE_STATUSES.includes(activeRide.rideStatus as RideStatus)
        ) {
          // Driver has an active assigned ride: sync busy availability and ensure GPS tracking is running
          useDriverAvailabilityStore.setState({ availability: 'busy' });
          LocationService.startLocationUpdates(
            currentDriverId,
            (loc) => {
              set({ isGpsTracking: true, locationError: null });
              useDriverAvailabilityStore.setState({ currentCoords: loc });
              useNavigationStore.getState().updateDriverPosition(loc);
            },
            (err) => {
              set({ locationError: err, isGpsTracking: false });
            }
          );

          // If in assigned/arriving status or rideStarted status, initialize/recover navigation
          if (
            activeRide.rideStatus === RideStatus.DRIVER_ASSIGNED ||
            activeRide.rideStatus === RideStatus.DRIVER_ARRIVING ||
            activeRide.rideStatus === RideStatus.RIDE_STARTED
          ) {
            const coords = useDriverAvailabilityStore.getState().currentCoords;
            useNavigationStore.getState().initNavigationForRide(activeRide, coords);
          } else {
            // driverArrived or other states - stop navigation
            useNavigationStore.getState().clearNavigation();
          }
        } else {
          // No active ride: stop GPS location updates and clear navigation
          LocationService.stopLocationUpdates();
          useNavigationStore.getState().clearNavigation();
          set({ isGpsTracking: false, locationError: null });
          if (driver.isOnline) {
            useDriverAvailabilityStore.setState({ availability: 'online' });
          }
        }
      }
    );

    // 2. Listen to searching rides if driver is available and has vehicleType
    if (driver.isAvailable && driver.vehicleType) {
      availableRidesUnsub = RideRepository.listenToAvailableRides(
        driver.vehicleType,
        (rides) => {
          const declined = get().declinedRideIds;
          // Filter out declined rides
          const eligibleRides = rides.filter((r) => !declined.includes(r.rideId));

          // Check if a brand new ride arrived to play subtle chime
          const currentIds = new Set(eligibleRides.map((r) => r.rideId));
          let hasNewRide = false;
          currentIds.forEach((id) => {
            if (!previousRideIds.has(id)) {
              hasNewRide = true;
            }
          });
          previousRideIds = currentIds;

          if (hasNewRide && eligibleRides.length > 0) {
            notificationService.playNewRequestChime();
          }

          set({ availableRides: eligibleRides, isSubscribed: true });
        }
      );
    } else {
      set({ availableRides: [] });
    }

    // 3. Handle App Foreground / Background transitions to resume GPS
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        ensureGpsTracking();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      if (availableRidesUnsub) availableRidesUnsub();
      if (activeRideUnsub) activeRideUnsub();
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
      }
      availableRidesUnsub = null;
      activeRideUnsub = null;
    };
  },

  acceptRide: async (rideId: string, driver: Driver) => {
    set({ isAccepting: true, acceptError: null });

    const response = await RideRepository.acceptRide(rideId, driver);

    if (response.success && response.ride) {
      const acceptedRide = response.ride;
      set({
        activeRide: acceptedRide,
        availableRides: get().availableRides.filter((r) => r.rideId !== rideId),
        isAccepting: false,
        acceptError: null,
      });

      // Update availability store locally
      useDriverAvailabilityStore.setState({ availability: 'busy' });

      // Start GPS location updates immediately upon acceptance
      LocationService.startLocationUpdates(
        driver.driverId,
        (_loc) => {
          set({ isGpsTracking: true, locationError: null });
        },
        (err) => {
          set({ locationError: err, isGpsTracking: false });
        }
      );

      return true;
    } else {
      // Acceptance failed
      const errorMsg = response.message || 'Unable to accept ride. Please try again.';
      set({
        acceptError: errorMsg,
        isAccepting: false,
        availableRides: get().availableRides.filter((r) => r.rideId !== rideId),
      });
      return false;
    }
  },

  updateRideStatus: async (
    rideId: string,
    driverId: string,
    currentStatus: RideStatus,
    newStatus: RideStatus
  ) => {
    set({ isAccepting: true, acceptError: null });

    const response = await RideRepository.updateRideStatus(
      rideId,
      driverId,
      currentStatus,
      newStatus
    );

    if (response.success) {
      set({ isAccepting: false, acceptError: null });

      // If ride is completed or cancelled by driver, stop GPS updates and reset active ride
      if (
        newStatus === RideStatus.RIDE_COMPLETED ||
        newStatus === RideStatus.CANCELLED_BY_DRIVER
      ) {
        LocationService.stopLocationUpdates();
        set({
          activeRide: null,
          isGpsTracking: false,
          locationError: null,
        });
        useDriverAvailabilityStore.setState({ availability: 'online' });
      }
      return true;
    } else {
      set({
        isAccepting: false,
        acceptError: response.message || 'Failed to update status',
      });
      return false;
    }
  },

  declineRide: (rideId: string) => {
    set((state) => ({
      declinedRideIds: [...state.declinedRideIds, rideId],
      availableRides: state.availableRides.filter((r) => r.rideId !== rideId),
      selectedRide: state.selectedRide?.rideId === rideId ? null : state.selectedRide,
    }));
  },

  selectRide: (ride: Ride | null) => set({ selectedRide: ride }),

  clearAcceptError: () => set({ acceptError: null }),

  clearLocationError: () => set({ locationError: null }),
}));
