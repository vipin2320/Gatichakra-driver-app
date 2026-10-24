import { LocationPermissionState, DriverLocation } from '../models/types';
import { LocationRepository } from '../repositories/location.repository';

export interface LocationConfig {
  minIntervalMs: number; // minimum time between Firestore updates (e.g., 3000 = 3s to 5000 = 5s)
  minDistanceMeters: number; // minimum movement distance (e.g., 10 meters)
}

export class LocationService {
  private static watchId: number | null = null;
  private static lastUpdatedLocation: { latitude: number; longitude: number; timestamp: number } | null = null;
  private static defaultConfig: LocationConfig = {
    minIntervalMs: 3500, // 3.5 seconds production frequency
    minDistanceMeters: 10, // 10 meters threshold
  };

  /**
   * Check browser location permission state
   */
  static async checkPermission(): Promise<LocationPermissionState> {
    if (!('geolocation' in navigator)) {
      return 'disabled';
    }

    try {
      if ('permissions' in navigator) {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'granted') return 'granted';
        if (status.state === 'denied') return 'permanently_denied';
        return 'unknown';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Request browser location permission
   */
  static async requestPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      throw new Error('Geolocation is not supported on this device/browser.');
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
      );
    });
  }

  /**
   * Get current position once
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number; heading: number; accuracy: number }> {
    if (!('geolocation' in navigator)) {
      throw new Error('Please enable device location / GPS services.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || 0,
            accuracy: position.coords.accuracy || 0,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location permission is required during an active ride.'));
          } else {
            // Return fallback default coordinates if timeout or temporary glitch
            resolve({
              latitude: 28.5800,
              longitude: 77.3178,
              heading: 0,
              accuracy: 20
            });
          }
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 }
      );
    });
  }

  /**
   * Start periodic/distance-filtered location updates for an active ride driver
   */
  static startLocationUpdates(
    driverId: string,
    onLocationUpdate?: (location: { latitude: number; longitude: number; heading: number; accuracy: number }) => void,
    onError?: (errorMsg: string) => void,
    config: LocationConfig = this.defaultConfig
  ) {
    this.stopLocationUpdates();

    if (!('geolocation' in navigator)) {
      if (onError) onError('Geolocation is not supported on this device.');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, heading, accuracy } = position.coords;
        const now = Date.now();

        // यदि फोन सेंसर से heading न मिले, तो 0 या पिछला एंगल सुरक्षित रखें
        const validHeading = typeof heading === 'number' && !isNaN(heading) && heading >= 0 ? heading : 0;
        const validAccuracy = typeof accuracy === 'number' && !isNaN(accuracy) ? accuracy : 0;

        let shouldWrite = false;

        if (!this.lastUpdatedLocation) {
          shouldWrite = true;
        } else {
          const timeElapsed = now - this.lastUpdatedLocation.timestamp;
          const distanceMoved = this.calculateDistance(
            this.lastUpdatedLocation.latitude,
            this.lastUpdatedLocation.longitude,
            latitude,
            longitude
          );

          if (timeElapsed >= config.minIntervalMs || distanceMoved >= config.minDistanceMeters) {
            shouldWrite = true;
          }
        }

        if (shouldWrite) {
          this.lastUpdatedLocation = { latitude, longitude, timestamp: now };
          
          if (onLocationUpdate) {
            onLocationUpdate({
              latitude,
              longitude,
              heading: validHeading,
              accuracy: validAccuracy,
            });
          }

          // Write to Firestore driverLocations/{driverId} asynchronously
          try {
            await LocationRepository.saveRealtimeLocation(
              driverId,
              latitude,
              longitude,
              validHeading,
              validAccuracy
            );
          } catch (err) {
            console.warn('Location Firestore update warning:', err);
          }
        }
      },
      (error) => {
        console.warn('Geolocation watch position error:', error.message);
        if (onError) {
          if (error.code === error.PERMISSION_DENIED) {
            onError('Location permission is required during an active ride.');
          } else {
            onError('GPS signal unavailable');
          }
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 5000,
      }
    );
  }

  /**
   * Stop active location updates
   */
  static stopLocationUpdates() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.lastUpdatedLocation = null;
  }

  /**
   * Check if location watching is active
   */
  static isWatching(): boolean {
    return this.watchId !== null;
  }

  /**
   * Haversine formula to compute distance in meters between two lat/lng points
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
