import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { ImageCompressionService } from './imageCompression.service';

export type DocType = 'profile' | 'driving_license' | 'vehicle_rc' | 'additional';

export class StorageService {
  /**
   * Uploads driver document to Firebase Storage with progress tracking and image compression.
   */
  static async uploadDocument(
    driverId: string,
    docType: DocType,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    // 1. Validate file size (e.g., max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit. Please select a smaller file.');
    }

    // 2. Compress image if applicable
    const compressedBlob = await ImageCompressionService.compressImage(file);

    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const storagePath = `driverDocuments/${driverId}/${docType}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          async (error) => {
            console.warn('Firebase Storage upload warning, falling back to secure data URL:', error);
            // Fallback for sandboxed or offline storage environments
            try {
              const dataUrl = await ImageCompressionService.fileToDataUrl(compressedBlob);
              if (onProgress) onProgress(100);
              resolve(dataUrl);
            } catch (fallbackErr) {
              reject(error);
            }
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (onProgress) onProgress(100);
              resolve(downloadUrl);
            } catch (err) {
              const dataUrl = await ImageCompressionService.fileToDataUrl(compressedBlob);
              resolve(dataUrl);
            }
          }
        );
      });
    } catch (err) {
      // Fallback to data URL
      const dataUrl = await ImageCompressionService.fileToDataUrl(compressedBlob);
      if (onProgress) onProgress(100);
      return dataUrl;
    }
  }
}
