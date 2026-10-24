import { create } from 'zustand';
import { Driver } from '../models/types';
import { DriverRepository } from '../repositories/driver.repository';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface DriverState {
  profile: Driver | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: (driverId: string) => Promise<void>;
  subscribeToProfile: (driverId: string) => () => void;
  setOnlineStatus: (driverId: string, isOnline: boolean, isAvailable?: boolean) => Promise<void>;
  approveForDemo: (driverId: string) => Promise<void>;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  profile: null,
  isLoading: true,
  error: null,
  fetchProfile: async (driverId: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await DriverRepository.getDriver(driverId);
      set({ profile, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  subscribeToProfile: (driverId: string) => {
    set({ isLoading: true });
    const docRef = doc(db, 'drivers', driverId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        set({ profile: doc.data() as Driver, isLoading: false });
      } else {
        set({ profile: null, isLoading: false });
      }
    }, (error) => {
      set({ error: error.message, isLoading: false });
    });
    return unsubscribe;
  },
  setOnlineStatus: async (driverId: string, isOnline: boolean, isAvailable?: boolean) => {
    try {
      await DriverRepository.updateOnlineStatus(driverId, isOnline, isAvailable ?? isOnline);
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  approveForDemo: async (driverId: string) => {
    try {
      await DriverRepository.approveDriverForDemo(driverId);
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
