import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  type Firestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import config from '../../firebase-applet-config.json';

const app = initializeApp(config);

export const auth = getAuth(app);

// Initialize Firestore with robust connection and offline cache support
const isBrowser = typeof window !== 'undefined';
let dbInstance: Firestore;

try {
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalAutoDetectLongPolling: true
    },
    config.firestoreDatabaseId || undefined
  );
} catch (e) {
  try {
    dbInstance = initializeFirestore(
      app,
      {
        localCache: memoryLocalCache(),
        experimentalAutoDetectLongPolling: true
      },
      config.firestoreDatabaseId || undefined
    );
  } catch (err2) {
    dbInstance = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);
  }
}

export const defaultDb = dbInstance;
export const namedDb = dbInstance;
export const db = dbInstance;
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  if (errMessage.includes('unavailable') || errMessage.includes('offline') || errMessage.includes('Failed to get document')) {
    console.warn('Firestore offline / network unavailable warning:', errMessage);
    return; // Don't throw fatal error on intermittent network unavailability
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

