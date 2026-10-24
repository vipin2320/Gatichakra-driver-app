import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export class FCMService {
  private static messaging: any = null;

  static initMessaging() {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        this.messaging = getMessaging();
      }
    } catch (e) {
      console.warn("FCM not supported or initialized:", e);
    }
  }

  static async requestPermissionAndGetToken(driverId: string): Promise<string | null> {
    try {
      if (!this.messaging) {
        this.initMessaging();
      }
      if (!this.messaging) return null;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const currentToken = await getToken(this.messaging, {
          vapidKey: 'BEl42iUYgUivsdk-89237498234798234uiasdfjkhasdf789234789' // Standard placeholder VAPID or auto configured
        }).catch(() => null);

        if (currentToken) {
          // Store token in driver document securely
          const driverRef = doc(db, 'drivers', driverId);
          await updateDoc(driverRef, {
            fcmToken: currentToken,
            fcmUpdatedAt: new Date().toISOString()
          }).catch(err => console.warn("Error updating FCM token in Firestore:", err));
          
          return currentToken;
        }
      }
      return null;
    } catch (e) {
      console.warn("Error requesting FCM permission:", e);
      return null;
    }
  }

  static onMessageListener() {
    return new Promise((resolve) => {
      if (!this.messaging) {
        this.initMessaging();
      }
      if (!this.messaging) return;
      onMessage(this.messaging, (payload) => {
        resolve(payload);
      });
    });
  }
}
