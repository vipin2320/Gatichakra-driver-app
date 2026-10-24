import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';

export interface AdminNotification {
  driverId: string;
  driverName: string;
  driverPhone: string;
  message: string;
  type: 'missing_details' | 'approval_request' | 'general';
  createdAt?: any;
}

export class AdminNotificationRepository {
  private static collectionName = 'adminNotifications';

  static async sendNotification(
    driverId: string,
    driverName: string,
    driverPhone: string,
    message: string,
    type: 'missing_details' | 'approval_request' | 'general' = 'approval_request'
  ): Promise<boolean> {
    try {
      const colRef = collection(db, this.collectionName);
      await addDoc(colRef, {
        driverId,
        driverName,
        driverPhone,
        message,
        type,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, this.collectionName);
      return false;
    }
  }
}
