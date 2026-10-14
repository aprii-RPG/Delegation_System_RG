/**
 * Firebase Firestore Configuration & Utility Helper
 * 
 * If you configure your Firebase project credentials in .env:
 * VITE_FIREBASE_API_KEY="AIzaSy..."
 * VITE_FIREBASE_PROJECT_ID="your-project"
 * ...
 * This module enables syncing tasks and users to cloud Firestore.
 */

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const getFirebaseConfig = (): FirebaseConfig => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
};

export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId);
};

// Example Firestore REST endpoint helper for extracting/syncing documents
export const syncToFirestoreRest = async (
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> => {
  const config = getFirebaseConfig();
  if (!config.projectId) return false;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${collection}/${docId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: Object.entries(data).reduce((acc, [key, val]) => {
          acc[key] = { stringValue: typeof val === 'object' ? JSON.stringify(val) : String(val) };
          return acc;
        }, {} as Record<string, any>),
      }),
    });
    return response.ok;
  } catch (error) {
    console.warn('Firestore sync failed, fallback to local storage active:', error);
    return false;
  }
};
