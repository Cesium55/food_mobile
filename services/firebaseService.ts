/**
 * Firebase сервис для работы с FCM токенами и уведомлениями
 */

import { env } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import * as Notifications from 'expo-notifications';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, Messaging } from 'firebase/messaging';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCyHpMqQwYy629vbbXPLm7HJAg7KGFmztQ',
  projectId: 'foodlink-123',
  storageBucket: 'foodlink-123.firebasestorage.app',
  messagingSenderId: '1060526840384',
  appId: '1:1060526840384:android:1c8100dc8449a2ee4d9da5',
};

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function initializeFirebase(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
      return firebaseApp;
    }

    firebaseApp = initializeApp(firebaseConfig);
    return firebaseApp;
  } catch (error) {
    throw error;
  }
}

export async function configureNotifications(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }
  } catch (error) {
    throw error;
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    if (Platform.OS === 'web') {
      try {
        if (!messaging) {
          messaging = getMessaging(firebaseApp!);
        }

        const token = await getToken(messaging, {
          vapidKey: undefined,
        });
        
        if (token) {
          return token;
        }
      } catch (error) {
        // Fallback to mobile token
      }
    }

    try {
      const token = await Notifications.getDevicePushTokenAsync();

      if (token?.data) {
        if (token.data.startsWith('ExponentPushToken[')) {
          return null;
        }

        return token.data;
      }
    } catch (error) {
      return null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function sendFCMTokenToServer(token: string): Promise<boolean> {
  try {
    const url = `${env.API_BASE_URL}/auth/firebase-token`;

    try {
      const response = await authFetch(url, {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (fetchError) {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export async function initializeAndSendToken(): Promise<void> {
  try {
    initializeFirebase();
    await configureNotifications();

    const token = await getFCMToken();

    if (!token) {
      return;
    }

    await sendFCMTokenToServer(token);
  } catch (error) {
    // Silent fail
  }
}

export async function sendTokenAfterAuth(): Promise<void> {
  try {
    if (!firebaseApp) {
      initializeFirebase();
      await configureNotifications();
    }

    const token = await getFCMToken();

    if (!token) {
      return;
    }

    await sendFCMTokenToServer(token);
  } catch (error) {
    // Silent fail
  }
}
