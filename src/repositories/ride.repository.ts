import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ride, RideStatus, Driver, VehicleType } from '../models/types';

export class RideRepository {
  /**
   * Listen in real-time to searching rides matching driver's vehicle type
   */
  public static listenToAvailableRides(
    vehicleType: VehicleType | string,
    onUpdate: (rides: Ride[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const ridesRef = collection(db, 'rides');
    const q = query(
      ridesRef,
      where('rideStatus', '==', RideStatus.SEARCHING),
      where('vehicleType', '==', vehicleType)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const rides: Ride[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          rides.push({
            rideId: docSnap.id,
            ...data,
            // Fallback for createdAt timestamp formatting
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          } as Ride);
        });

        // Sort: Newest eligible request first
        rides.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        onUpdate(rides);
      },
      (error) => {
        console.error('Error listening to available rides:', error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Listen in real-time to active ride assigned to current driver
   */
  public static listenToActiveDriverRide(
    driverId: string,
    onUpdate: (activeRide: Ride | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const ridesRef = collection(db, 'rides');
    const activeStatuses = [
      RideStatus.DRIVER_ASSIGNED,
      RideStatus.DRIVER_ARRIVING,
      RideStatus.DRIVER_ARRIVED,
      RideStatus.RIDE_STARTED,
    ];

    const q = query(
      ridesRef,
      where('driverId', '==', driverId),
      where('rideStatus', 'in', activeStatuses)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
          return;
        }

        const activeDoc = snapshot.docs[0];
        const data = activeDoc.data();
        const ride = {
          rideId: activeDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          acceptedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate().toISOString() : data.acceptedAt,
          arrivedAt: data.arrivedAt?.toDate ? data.arrivedAt.toDate().toISOString() : data.arrivedAt,
          startedAt: data.startedAt?.toDate ? data.startedAt.toDate().toISOString() : data.startedAt,
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate().toISOString() : data.completedAt,
          cancelledAt: data.cancelledAt?.toDate ? data.cancelledAt.toDate().toISOString() : data.cancelledAt,
        } as Ride;
        onUpdate(ride);
      },
      (error) => {
        console.error('Error listening to active driver ride:', error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Safe Atomic / Transactional Acceptance Operation
   * Guarantees only one driver can accept the ride and updates driver availability.
   */
  public static async acceptRide(
    rideId: string,
    driver: Driver
  ): Promise<{ success: boolean; message?: string; ride?: Ride }> {
    const rideRef = doc(db, 'rides', rideId);
    const driverRef = doc(db, 'drivers', driver.driverId);

    try {
      const resultRide = await runTransaction(db, async (transaction) => {
        const rideSnap = await transaction.get(rideRef);
        if (!rideSnap.exists()) {
          throw new Error('RIDE_NOT_FOUND');
        }

        const rideData = rideSnap.data() as Ride;

        // Verify ride status is still searching
        if (rideData.rideStatus !== RideStatus.SEARCHING) {
          throw new Error('RIDE_ALREADY_ACCEPTED');
        }

        // Verify driverId is empty
        if (rideData.driverId && rideData.driverId.trim() !== '') {
          throw new Error('RIDE_ALREADY_ACCEPTED');
        }

        // Verify vehicle type matches
        if (driver.vehicleType && rideData.vehicleType !== driver.vehicleType) {
          throw new Error('VEHICLE_MISMATCH');
        }

        // Verify driver document status
        const driverSnap = await transaction.get(driverRef);
        if (driverSnap.exists()) {
          const freshDriver = driverSnap.data() as Driver;
          if (!freshDriver.isApproved || !freshDriver.isOnline) {
            throw new Error('DRIVER_NOT_AVAILABLE');
          }
        }

        // 1. Assign ride to driver with server timestamp & driver details
        transaction.update(rideRef, {
          driverId: driver.driverId,
          driverName: driver.name,
          driverPhone: driver.phone,
          driverVehicleType: driver.vehicleType || '',
          driverVehicleNumber: driver.vehicleNumber || '',
          rideStatus: RideStatus.DRIVER_ASSIGNED,
          acceptedAt: serverTimestamp(),
        });

        // 2. Mark driver as unavailable (busy)
        transaction.update(driverRef, {
          isAvailable: false,
          updatedAt: serverTimestamp(),
        });

        return {
          ...rideData,
          rideId,
          driverId: driver.driverId,
          driverName: driver.name,
          driverPhone: driver.phone,
          driverVehicleType: driver.vehicleType || '',
          driverVehicleNumber: driver.vehicleNumber || '',
          rideStatus: RideStatus.DRIVER_ASSIGNED,
          acceptedAt: new Date().toISOString(),
        };
      });

      return { success: true, ride: resultRide };
    } catch (err: any) {
      if (
        err.message === 'RIDE_ALREADY_ACCEPTED' ||
        err.message === 'RIDE_NOT_FOUND'
      ) {
        return {
          success: false,
          message: 'Ride is no longer available.',
        };
      }
      if (err.message === 'VEHICLE_MISMATCH') {
        return {
          success: false,
          message: 'This ride request is for a different vehicle category.',
        };
      }
      if (err.message === 'DRIVER_NOT_AVAILABLE') {
        return {
          success: false,
          message: 'You must be approved and online to accept ride requests.',
        };
      }

      console.error('Failed to accept ride transaction:', err);
      return {
        success: false,
        message: 'Unable to accept ride. Please try again.',
      };
    }
  }

  /**
   * CUSTOMER: Check for existing active ride for customer (Duplicate Ride Protection & Recovery)
   */
  public static async getActiveCustomerRide(customerId: string): Promise<Ride | null> {
    try {
      const ridesRef = collection(db, 'rides');
      const activeStatuses = [
        RideStatus.SEARCHING,
        RideStatus.DRIVER_ASSIGNED,
        RideStatus.DRIVER_ARRIVING,
        RideStatus.DRIVER_ARRIVED,
        RideStatus.RIDE_STARTED,
      ];

      const q = query(
        ridesRef,
        where('customerId', '==', customerId),
        where('rideStatus', 'in', activeStatuses)
      );

      const snap = await getDocs(q);
      if (snap.empty) return null;

      const activeDoc = snap.docs[0];
      const data = activeDoc.data();
      return {
        rideId: activeDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      } as Ride;
    } catch (e) {
      console.error('Error fetching active customer ride:', e);
      return null;
    }
  }

  /**
   * CUSTOMER: Create new ride request in Firestore
   */
  public static async createCustomerRide(rideData: Partial<Ride>): Promise<{
    success: boolean;
    rideId?: string;
    message?: string;
    existingRide?: Ride;
  }> {
    if (!rideData.customerId) {
      return { success: false, message: 'Customer ID is required.' };
    }

    // Duplicate protection check
    const existing = await this.getActiveCustomerRide(rideData.customerId);
    if (existing) {
      return {
        success: false,
        message: 'You already have an active ride.',
        existingRide: existing,
      };
    }

    const newRideRef = doc(collection(db, 'rides'));
    const rideId = newRideRef.id;

    const fullRide = {
      rideId,
      customerId: rideData.customerId,
      customerName: rideData.customerName || 'Customer',
      customerPhone: rideData.customerPhone || '9876543210',

      pickupAddress: rideData.pickupAddress || '',
      pickupLatitude: rideData.pickupLatitude || 28.6315,
      pickupLongitude: rideData.pickupLongitude || 77.2167,

      destinationAddress: rideData.destinationAddress || '',
      destinationLatitude: rideData.destinationLatitude || 28.5562,
      destinationLongitude: rideData.destinationLongitude || 77.100,

      vehicleType: rideData.vehicleType || VehicleType.CITY_CAB,

      distanceKm: rideData.distanceKm || 10,
      estimatedDurationMinutes: rideData.estimatedDurationMinutes || 25,

      baseFare: rideData.baseFare || 50,
      distanceCharge: rideData.distanceCharge || 150,
      waitingCharge: rideData.waitingCharge || 0,
      estimatedFare: rideData.estimatedFare || 200,

      paymentMethod: rideData.paymentMethod || 'UPI / Cash',
      paymentStatus: 'pending',

      rideStatus: RideStatus.SEARCHING,

      driverId: null,
      driverName: null,
      driverPhone: null,
      driverVehicleType: null,
      driverVehicleNumber: null,

      createdAt: serverTimestamp(),
    };

    await setDoc(newRideRef, fullRide);

    return { success: true, rideId };
  }

  /**
   * CUSTOMER: Real-time listener for customer's ride document
   */
  public static listenToRide(
    rideId: string,
    onUpdate: (ride: Ride | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const rideRef = doc(db, 'rides', rideId);

    return onSnapshot(
      rideRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          onUpdate(null);
          return;
        }

        const data = docSnap.data();
        const ride = {
          rideId: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          acceptedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate().toISOString() : data.acceptedAt,
          cancelledAt: data.cancelledAt?.toDate ? data.cancelledAt.toDate().toISOString() : data.cancelledAt,
        } as Ride;

        onUpdate(ride);
      },
      (error) => {
        console.error('Error watching customer ride:', error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * CUSTOMER: Cancel Ride while status is searching
   */
  public static async cancelCustomerRide(rideId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const rideRef = doc(db, 'rides', rideId);
      const snap = await getDoc(rideRef);

      if (!snap.exists()) {
        return { success: false, message: 'Ride not found.' };
      }

      const rideData = snap.data() as Ride;
      if (rideData.rideStatus !== RideStatus.SEARCHING) {
        return {
          success: false,
          message: 'Ride cannot be cancelled once driver has been assigned.',
        };
      }

      await updateDoc(rideRef, {
        rideStatus: RideStatus.CANCELLED_BY_CUSTOMER,
        cancelledAt: serverTimestamp(),
      });

      return { success: true };
    } catch (e: any) {
      console.error('Error cancelling ride:', e);
      return { success: false, message: e.message || 'Failed to cancel ride.' };
    }
  }

  /**
   * Driver updates ride status with strict lifecycle transitions and transactional protection
   */
  public static async updateRideStatus(
    rideId: string,
    driverId: string,
    currentStatus: RideStatus,
    newStatus: RideStatus
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const rideRef = doc(db, 'rides', rideId);
      
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(rideRef);
        if (!snap.exists()) throw new Error('RIDE_NOT_FOUND');
        
        const data = snap.data() as Ride;
        if (data.driverId !== driverId) throw new Error('UNAUTHORIZED');
        if (data.rideStatus !== currentStatus) throw new Error('INVALID_STATE');
        
        let isValidTransition = false;
        const updateData: any = { rideStatus: newStatus };

        // 1. driverAssigned -> driverArriving
        if (currentStatus === RideStatus.DRIVER_ASSIGNED && newStatus === RideStatus.DRIVER_ARRIVING) {
          isValidTransition = true;
        }
        // 2. driverArriving -> driverArrived
        else if (currentStatus === RideStatus.DRIVER_ARRIVING && newStatus === RideStatus.DRIVER_ARRIVED) {
          isValidTransition = true;
          updateData.arrivedAt = serverTimestamp();
        }
        // 3. driverArrived -> rideStarted
        else if (currentStatus === RideStatus.DRIVER_ARRIVED && newStatus === RideStatus.RIDE_STARTED) {
          isValidTransition = true;
          updateData.startedAt = serverTimestamp();
        }
        // 4. rideStarted -> rideCompleted
        else if (currentStatus === RideStatus.RIDE_STARTED && newStatus === RideStatus.RIDE_COMPLETED) {
          isValidTransition = true;
          updateData.completedAt = serverTimestamp();
        }
        // 5. Driver cancellation during arrival
        else if (
          (currentStatus === RideStatus.DRIVER_ASSIGNED || currentStatus === RideStatus.DRIVER_ARRIVING) &&
          newStatus === RideStatus.CANCELLED_BY_DRIVER
        ) {
          isValidTransition = true;
          updateData.cancelledAt = serverTimestamp();
        }

        if (!isValidTransition) {
          throw new Error('INVALID_TRANSITION');
        }

        transaction.update(rideRef, updateData);
        
        // If completed or cancelled, release driver and set available
        if (newStatus === RideStatus.RIDE_COMPLETED || newStatus === RideStatus.CANCELLED_BY_DRIVER) {
           const driverRef = doc(db, 'drivers', driverId);
           transaction.update(driverRef, {
             isAvailable: true,
             updatedAt: serverTimestamp()
           });
        }
        return true;
      });
      
      return { success: true };
    } catch (err: any) {
      console.error('Error updating ride status:', err);
      let message = 'Failed to update ride status.';
      if (err.message === 'UNAUTHORIZED') message = 'You are not authorized to update this ride.';
      if (err.message === 'INVALID_STATE' || err.message === 'INVALID_TRANSITION') {
        message = 'Invalid ride status transition.';
      }
      return { success: false, message };
    }
  }

  /**
   * Fetch single ride by ID
   */
  public static async getRideById(rideId: string): Promise<Ride | null> {
    try {
      const rideRef = doc(db, 'rides', rideId);
      const snap = await getDoc(rideRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          rideId: snap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        } as Ride;
      }
      return null;
    } catch (e) {
      console.error('Error fetching ride:', e);
      return null;
    }
  }
}
