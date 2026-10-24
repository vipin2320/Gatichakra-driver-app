import { create } from 'zustand';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { MockAuthService, MockUser } from '../services/mockAuth';

interface AuthState {
  user: User | MockUser | any;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: any) => void;
  signInMock: (email?: string) => void;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  signInMock: (email: string = 'driver@example.com') => {
    const mockUser = MockAuthService.login(email);
    set({ user: mockUser, isAuthenticated: true, isLoading: false });
  },

  signOut: async () => {
    MockAuthService.logout();
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore firebase auth signout errors in mock mode
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    // 1. Check for stored mock user session first
    const storedMock = MockAuthService.getStoredUser();
    if (storedMock) {
      set({ user: storedMock, isAuthenticated: true, isLoading: false });
    }

    // 2. Listen to real Firebase auth state changes
    try {
      onAuthStateChanged(auth, (firebaseUser) => {
        const currentMock = MockAuthService.getStoredUser();
        if (firebaseUser) {
          set({ user: firebaseUser, isAuthenticated: true, isLoading: false });
        } else if (currentMock) {
          set({ user: currentMock, isAuthenticated: true, isLoading: false });
        } else if (!storedMock) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      });
    } catch (e) {
      console.warn('Firebase auth listener error:', e);
      if (!storedMock) {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
}));
