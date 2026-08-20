import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { GoogleUser } from '../types.js';

// Firebase configuration from environment / provisioned config
const firebaseConfig = {
  projectId: "project-0a3b434d-2b1f-41d7-b88",
  appId: "1:799679881919:web:886222e8818f87a2191c0a",
  apiKey: "AIzaSyB5tfPC81rbRpDATxBiJ843pP4Vl-9VB0Y",
  authDomain: "project-0a3b434d-2b1f-41d7-b88.firebaseapp.com",
  storageBucket: "project-0a3b434d-2b1f-41d7-b88.firebasestorage.app",
  messagingSenderId: "799679881919",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.setCustomParameters({
  prompt: 'select_account',
});

const STORAGE_KEY = 'chatgpr_google_user';
let cachedAccessToken: string | null = null;

export function getStoredUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user: GoogleUser = JSON.parse(raw);
    if (user && (user.email || user.isGuest)) {
      if (user.accessToken) {
        cachedAccessToken = user.accessToken;
      }
      return user;
    }
    return null;
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveUserSession(user: GoogleUser) {
  cachedAccessToken = user.accessToken || null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUserSession() {
  cachedAccessToken = null;
  localStorage.removeItem(STORAGE_KEY);
  signOut(auth).catch(() => {});
}

/**
 * Quick Guest Login (No Google Account Required)
 */
export function loginAsGuest(): GoogleUser {
  const guestUser: GoogleUser = {
    id: `guest_${Date.now()}`,
    email: 'guest@chatgpr.ai',
    name: 'ភ្ញៀវ (Guest)',
    accessToken: '',
    isGuest: true,
  };
  saveUserSession(guestUser);
  return guestUser;
}

/**
 * Initialize auth listener to keep session alive and handle state changes
 */
export function initAuthListener(
  onSuccess: (user: GoogleUser) => void,
  onSignedOut: () => void
) {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const stored = getStoredUser();
      if (stored) {
        onSuccess(stored);
      } else {
        const minimalUser: GoogleUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Google User',
          picture: firebaseUser.photoURL || undefined,
          accessToken: cachedAccessToken || '',
        };
        saveUserSession(minimalUser);
        onSuccess(minimalUser);
      }
    } else {
      onSignedOut();
    }
  });
}

/**
 * Trigger official Google Sign In via standard popup
 */
export async function loginWithGoogleOAuth(): Promise<GoogleUser> {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';

    const googleUser: GoogleUser = {
      id: result.user.uid,
      email: result.user.email || '',
      name: result.user.displayName || 'Google User',
      picture: result.user.photoURL || undefined,
      accessToken,
    };

    saveUserSession(googleUser);
    return googleUser;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('អ្នកបានបិទផ្ទាំង Google Sign-In មុនពេលបញ្ចប់។');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('ការស្នើសុំត្រូវបានលុបចោល។');
    }
    throw new Error(error.message || 'មិនអាចចូលគណនី Google បានទេ។ សូមព្យាយាមម្តងទៀត។');
  }
}
