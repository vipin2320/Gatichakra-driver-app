import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Driver, VehicleType, DriverStats } from '../models/types';

export class DriverRepository {
  private static collectionName = 'drivers';

  static async getDriver(driverId: string): Promise<Driver | null> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Driver;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  static async createDriverProfile(
    driverId: string,
    phone: string,
    name: string,
    profilePhotoUrl?: string
  ): Promise<void> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();

      const existingData = await this.getDriver(driverId);

      await setDoc(
        docRef,
        {
          driverId,
          name: trimmedName,
          phone: trimmedPhone,
          profilePhotoUrl: profilePhotoUrl || existingData?.profilePhotoUrl || '',
          isApproved: existingData?.isApproved ?? false,
          approvalStatus: existingData?.approvalStatus || 'pending',
          isOnline: false,
          isAvailable: false,
          rating: existingData?.rating ?? 5.0,
          totalTrips: existingData?.totalTrips ?? 0,
          createdAt: existingData?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async updateVehicleDetails(
    driverId: string,
    vehicleType: VehicleType,
    vehicleNumber: string,
    vehicleModel?: string,
    vehicleColor?: string,
    manufacturingYear?: string
  ): Promise<void> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      const normalizedNumber = vehicleNumber.trim().toUpperCase();

      const updatePayload: Record<string, any> = {
        vehicleType,
        vehicleNumber: normalizedNumber,
        updatedAt: serverTimestamp(),
      };

      if (vehicleModel?.trim()) updatePayload.vehicleModel = vehicleModel.trim();
      if (vehicleColor?.trim()) updatePayload.vehicleColor = vehicleColor.trim();
      if (manufacturingYear?.trim()) updatePayload.manufacturingYear = manufacturingYear.trim();

      await setDoc(docRef, updatePayload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async submitVerification(driverId: string): Promise<void> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      await setDoc(
        docRef,
        {
          approvalStatus: 'pending',
          isApproved: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async approveDriverForDemo(driverId: string): Promise<void> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      await setDoc(
        docRef,
        {
          isApproved: true,
          approvalStatus: 'approved',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async updateOnlineStatus(driverId: string, isOnline: boolean, isAvailable: boolean): Promise<void> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      await updateDoc(docRef, {
        isOnline,
        isAvailable,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  }

  static async updateLocation(driverId: string, latitude: number, longitude: number, heading: number): Promise<void> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      await updateDoc(docRef, {
        latitude,
        longitude,
        heading,
        locationUpdatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async getDriverStats(driverId: string): Promise<DriverStats> {
    const path = `driverStats/${driverId}`;
    try {
      const docRef = doc(db, 'driverStats', driverId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          driverId,
          todayTrips: data.todayTrips ?? 0,
          todayEarnings: data.todayEarnings ?? 0,
          rating: data.rating ?? 5.0,
          totalTrips: data.totalTrips ?? 0,
        };
      }

      // Fallback from driver document stats or default zeroes
      const driver = await this.getDriver(driverId);
      return {
        driverId,
        todayTrips: 0,
        todayEarnings: 0,
        rating: driver?.rating ?? 5.0,
        totalTrips: driver?.totalTrips ?? 0,
      };
    } catch (error) {
      // Return clean empty stats on initial fetch
      return {
        driverId,
        todayTrips: 0,
        todayEarnings: 0,
        rating: 5.0,
        totalTrips: 0,
      };
    }
  }
}
