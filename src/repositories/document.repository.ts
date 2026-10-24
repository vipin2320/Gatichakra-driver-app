import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { DriverDocuments } from '../models/types';
import { DocType } from '../services/storage.service';

export class DocumentRepository {
  private static collectionName = 'driverDocuments';

  static async getDocuments(driverId: string): Promise<DriverDocuments | null> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as DriverDocuments;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  static async saveDocumentUrl(driverId: string, docType: DocType, url: string): Promise<void> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      const fieldMap: Record<DocType, string> = {
        profile: 'profilePhotoUrl',
        driving_license: 'drivingLicenseUrl',
        vehicle_rc: 'vehicleRcUrl',
        additional: 'additionalDocumentUrl',
      };

      const fieldName = fieldMap[docType];

      await setDoc(
        docRef,
        {
          driverId,
          [fieldName]: url,
          verificationStatus: 'pending',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async submitForVerification(driverId: string, docUrls: {
    profilePhotoUrl?: string;
    drivingLicenseUrl?: string;
    vehicleRcUrl?: string;
    additionalDocumentUrl?: string;
  }): Promise<void> {
    const path = `${this.collectionName}/${driverId}`;
    try {
      const docRef = doc(db, this.collectionName, driverId);
      await setDoc(
        docRef,
        {
          driverId,
          ...docUrls,
          verificationStatus: 'pending',
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}
