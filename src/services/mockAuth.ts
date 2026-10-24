export interface MockUser {
  uid: string;
  email: string;
  displayName?: string;
}

const MOCK_STORAGE_KEY = 'gatichakra_mock_user_session';

export class MockAuthService {
  /**
   * Retrieves active mock user session from localStorage
   */
  static getStoredUser(): MockUser | null {
    try {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read mock user session from localStorage:', e);
    }
    return null;
  }

  /**
   * Simulates client-side mock authentication for driver email
   */
  static login(email: string = 'driver@example.com'): MockUser {
    const cleanEmail = email.trim().toLowerCase() || 'driver@example.com';
    const sanitized = cleanEmail.replace(/[^a-z0-9]/g, '_');
    const mockUser: MockUser = {
      uid: `driver_${sanitized}`,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
    };

    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    } catch (e) {
      console.warn('Failed to store mock user session in localStorage:', e);
    }

    return mockUser;
  }

  /**
   * Clears mock user session
   */
  static logout(): void {
    try {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear mock user session from localStorage:', e);
    }
  }
}
