import { initializeApp, getApps, cert, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK singleton.
 * Initializes the Firebase Admin app once and exports Firestore + Auth instances.
 * Guards against re-initialization during Next.js hot-reload in development.
 *
 * All Firebase credentials are server-side only (no NEXT_PUBLIC_ prefix).
 */

function createFirebaseAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '[ArenaOne] Firebase Admin SDK credentials not configured. ' +
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local'
    );
    // Initialize without credentials for development/testing fallback
    return initializeApp({ projectId: projectId || 'arenaone-dev' });
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _adminApp: App | null = null;
let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

/**
 * Returns the Firebase Admin app instance (lazy singleton).
 *
 * @returns Initialized Firebase Admin app.
 */
export function getAdminApp(): App {
  if (!_adminApp) {
    _adminApp = createFirebaseAdminApp();
  }
  return _adminApp;
}

/**
 * Returns the Firestore instance (lazy singleton).
 *
 * @returns Server-side Firestore client.
 */
export function getAdminDb(): Firestore {
  if (!_adminDb) {
    _adminDb = getFirestore(getAdminApp());
  }
  return _adminDb;
}

/**
 * Returns the Firebase Auth instance (lazy singleton).
 *
 * @returns Server-side Firebase Auth client.
 */
export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(getAdminApp());
  }
  return _adminAuth;
}
