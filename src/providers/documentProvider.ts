import { create } from 'zustand';
import { DriverDocuments } from '../models/types';
import { DocumentRepository } from '../repositories/document.repository';
import { StorageService, DocType } from '../services/storage.service';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface DocumentState {
  documents: DriverDocuments | null;
  isLoading: boolean;
  uploadProgress: Record<DocType, number>;
  isUploading: Record<DocType, boolean>;
  uploadError: Record<DocType, string | null>;
  generalError: string | null;

  fetchDocuments: (driverId: string) => Promise<void>;
  subscribeToDocuments: (driverId: string) => () => void;
  uploadDocument: (driverId: string, docType: DocType, file: File) => Promise<string | null>;
  clearError: (docType: DocType) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: null,
  isLoading: false,
  uploadProgress: {
    profile: 0,
    driving_license: 0,
    vehicle_rc: 0,
    additional: 0,
  },
  isUploading: {
    profile: false,
    driving_license: false,
    vehicle_rc: false,
    additional: false,
  },
  uploadError: {
    profile: null,
    driving_license: null,
    vehicle_rc: null,
    additional: null,
  },
  generalError: null,

  fetchDocuments: async (driverId: string) => {
    set({ isLoading: true, generalError: null });
    try {
      const docs = await DocumentRepository.getDocuments(driverId);
      set({ documents: docs, isLoading: false });
    } catch (err: any) {
      set({ generalError: err.message, isLoading: false });
    }
  },

  subscribeToDocuments: (driverId: string) => {
    set({ isLoading: true });
    const docRef = doc(db, 'driverDocuments', driverId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          set({ documents: snapshot.data() as DriverDocuments, isLoading: false });
        } else {
          set({ documents: null, isLoading: false });
        }
      },
      (error) => {
        set({ generalError: error.message, isLoading: false });
      }
    );
    return unsubscribe;
  },

  uploadDocument: async (driverId: string, docType: DocType, file: File) => {
    set((state) => ({
      isUploading: { ...state.isUploading, [docType]: true },
      uploadProgress: { ...state.uploadProgress, [docType]: 0 },
      uploadError: { ...state.uploadError, [docType]: null },
    }));

    try {
      const url = await StorageService.uploadDocument(driverId, docType, file, (progress) => {
        set((state) => ({
          uploadProgress: { ...state.uploadProgress, [docType]: progress },
        }));
      });

      await DocumentRepository.saveDocumentUrl(driverId, docType, url);

      set((state) => ({
        isUploading: { ...state.isUploading, [docType]: false },
        uploadProgress: { ...state.uploadProgress, [docType]: 100 },
      }));

      return url;
    } catch (err: any) {
      set((state) => ({
        isUploading: { ...state.isUploading, [docType]: false },
        uploadError: { ...state.uploadError, [docType]: err.message || 'Upload failed. Please retry.' },
      }));
      return null;
    }
  },

  clearError: (docType: DocType) => {
    set((state) => ({
      uploadError: { ...state.uploadError, [docType]: null },
    }));
  },
}));
