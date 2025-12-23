import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

let app: App | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let storage: Storage | undefined;

export function getAdminApp(): App {
  if (app) {
    return app;
  }

  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
    return app;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error('Firebase Admin credentials are not set. Check your environment variables.');
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_ADMIN_PROJECT_ID}.appspot.com`;

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket,
  });

  return app;
}

export function getAdminFirestore(): Firestore {
  if (db) {
    return db;
  }
  db = getFirestore(getAdminApp());
  return db;
}

export function getAdminAuth(): Auth {
  if (auth) {
    return auth;
  }
  auth = getAuth(getAdminApp());
  return auth;
}

export function getAdminStorage(): Storage {
  if (storage) {
    return storage;
  }
  storage = getStorage(getAdminApp());
  return storage;
}

