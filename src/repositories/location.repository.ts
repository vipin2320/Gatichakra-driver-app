import { doc, setDoc, updateDoc, serverTimestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { DriverLocation } from '../models/types';

export class LocationRepository {
  private static collectionName = 'driverLocations';

  /**
   * Saves realtime location coordinates to driverLocations collection and driver document
   */
  static async saveRealtimeLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    heading: number = 0,
    accuracy: number = 0
  ): Promise<void> {
    // Validate GPS coordinates
    if (
      typeof latitude !== 'number' ||
      isNaN(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== 'number' ||
      isNaN(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      typeof accuracy !== 'number' ||
      isNaN(accuracy) ||
      accuracy < 0
    ) {
      console.warn('Invalid GPS coordinates discarded:', { latitude, longitude, accuracy });
      return;
    }

    const locPath = `${this.collectionName}/${driverId}`;
    try {
      // 1. Update driverLocations collection
      const locRef = doc(db, this.collectionName, driverId);
      const isoTimestamp = new Date().toISOString();
      await setDoc(
        locRef,
        {
          driverId,
          latitude,
          longitude,
          heading: typeof heading === 'number' && !isNaN(heading) ? heading : 0,
          accuracy: typeof accuracy === 'number' && !isNaN(accuracy) ? accuracy : 0,
          updatedAt: isoTimestamp,
        },
        { merge: true }
      );

      // 2. Also update lat/lng on drivers collection with merge
      const driverRef = doc(db, 'drivers', driverId);
      await setDoc(
        driverRef,
        {
          latitude,
          longitude,
          heading: typeof heading === 'number' && !isNaN(heading) ? heading : 0,
          locationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, locPath);
    }
  }

  /**
   * Subscribes to a driver's realtime location
   */
  static listenToDriverLocation(
    driverId: string,
    onUpdate: (location: DriverLocation | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const locRef = doc(db, this.collectionName, driverId);
    return onSnapshot(
      locRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          onUpdate(null);
          return;
        }
        const data = docSnap.data();
        onUpdate({
          driverId: data.driverId,
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          accuracy: data.accuracy,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        });
      },
      (error) => {
        console.error('Error listening to driver location:', error);
        if (onError) onError(error);
      }
    );
  }
}
