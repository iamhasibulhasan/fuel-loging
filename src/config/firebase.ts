/**
 * Firebase settings for login (email/password + Google).
 *
 * 1. Firebase console → Project settings → Your apps → Add app → Web.
 *    Copy the `firebaseConfig` values below.
 * 2. Authentication → Sign-in method → enable "Email/Password" and "Google".
 * 3. For Google: Authentication → Sign-in method → Google → "Web SDK configuration"
 *    → copy the **Web client ID** into GOOGLE_WEB_CLIENT_ID.
 * 4. Project settings → Your apps → Add app → Android, package `com.renosiatech.fuelburn`,
 *    and add the SHA-1 fingerprint printed by the GitHub "Build Android APK" workflow.
 *
 * These values are not secret (they identify the project, they don't grant access),
 * so it's fine to commit them. Until they are filled in, the app runs in guest-only mode.
 */
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('YOUR_');
export const isGoogleConfigured = isFirebaseConfigured && !GOOGLE_WEB_CLIENT_ID.startsWith('YOUR_');
