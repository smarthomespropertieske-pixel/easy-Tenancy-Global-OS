import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');

// Cache the access token in memory.
export let cachedAccessToken: string | null = null;
export const getAccessToken = () => cachedAccessToken;

// Safely initialize Firestore instance
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, (firebaseConfig as any).firestoreDatabaseId);

// Connection verification helper (per Firebase Skill)
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline or unreachable.');
    }
  }
}
testFirestoreConnection().catch(() => {});

// Operation error logger & JSON thrower per skill spec
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
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

let activeSignInPromise: Promise<User | null> | null = null;

export const signInWithGoogle = async (): Promise<User | null> => {
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  activeSignInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
      const user = result.user;
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Could not sync user profile to Firestore:', dbErr);
        }
      }
      return user;
    } catch (error: any) {
      const errorCode = error?.code || '';
      const errorMessage = error?.message || String(error);

      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        console.info('Google sign-in popup was closed or cancelled by the user.');
        return null;
      }

      if (
        errorCode === 'auth/popup-blocked' ||
        errorMessage.includes('popup-blocked')
      ) {
        console.warn('Google sign-in popup was blocked by the browser.');
        return null;
      }

      if (
        errorMessage.includes('INTERNAL ASSERTION FAILED') ||
        errorMessage.includes('Pending promise was never set') ||
        errorMessage.includes('Database is closing') ||
        errorMessage.includes('hidden')
      ) {
        console.warn('Firebase Auth internal state or IndexedDB issue (often in iframes).');
        return null;
      }

      console.error('Error signing in with Google:', error);
      return null;
    } finally {
      activeSignInPromise = null;
    }
  })();

  return activeSignInPromise;
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export { onAuthStateChanged, type User };
