/**
 * Firebase сервис для работы с FCM токенами и уведомлениями
 */

import { env, log } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import * as Notifications from 'expo-notifications';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, Messaging } from 'firebase/messaging';
import { Platform } from 'react-native';

// Конфигурация Firebase из google-services.json
const firebaseConfig = {
  apiKey: 'AIzaSyCyHpMqQwYy629vbbXPLm7HJAg7KGFmztQ',
  projectId: 'foodlink-123',
  storageBucket: 'foodlink-123.firebasestorage.app',
  messagingSenderId: '1060526840384',
  appId: '1:1060526840384:android:1c8100dc8449a2ee4d9da5',
};

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Инициализирует Firebase приложение
 */
export function initializeFirebase(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Проверяем, не инициализировано ли уже
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
      log('info', 'Firebase уже инициализирован');
      return firebaseApp;
    }

    // Инициализируем Firebase
    firebaseApp = initializeApp(firebaseConfig);
    log('info', 'Firebase успешно инициализирован');
    return firebaseApp;
  } catch (error) {
    log('error', 'Ошибка инициализации Firebase', error);
    throw error;
  }
}

/**
 * Настраивает уведомления для Expo
 */
export async function configureNotifications(): Promise<void> {
  try {
    // Настраиваем обработчик уведомлений
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Запрашиваем разрешения
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      log('warn', 'Разрешение на уведомления не предоставлено');
      return;
    }

    log('info', 'Уведомления настроены успешно');
  } catch (error) {
    log('error', 'Ошибка настройки уведомлений', error);
    throw error;
  }
}

/**
 * Получает FCM токен для устройства
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    // Инициализируем Firebase если еще не инициализирован
    if (!firebaseApp) {
      initializeFirebase();
    }

    // Для веб-платформы используем Firebase Messaging
    if (Platform.OS === 'web') {
      try {
        if (!messaging) {
          messaging = getMessaging(firebaseApp!);
        }

        const token = await getToken(messaging, {
          vapidKey: undefined, // Для веба может потребоваться VAPID ключ из Firebase Console
        });
        
        if (token) {
          log('info', 'FCM токен получен (web)');
          return token;
        }
      } catch (error) {
        log('warn', 'Не удалось получить FCM токен через Firebase Messaging (web)', error);
        // Пробуем получить через Expo как fallback
      }
    }

    // Для мобильных платформ (iOS/Android) используем нативный токен устройства
    // getDevicePushTokenAsync возвращает нативный FCM токен для Android и APNs токен для iOS
    // ВАЖНО: В standalone сборке с правильно настроенным Firebase должен возвращаться нативный FCM токен
    // Если возвращается ExponentPushToken - значит Firebase не настроен правильно или сборка не standalone
    try {
      const token = await Notifications.getDevicePushTokenAsync();

      if (token?.data) {
        // Проверяем, что это не Expo Push Token
        if (token.data.startsWith('ExponentPushToken[')) {
          log('error', 'getDevicePushTokenAsync вернул Expo Push Token вместо FCM токена!', {
            platform: Platform.OS,
            token: token.data,
            message: 'Проверьте: 1) Сборка через EAS Build (не Expo Go), 2) google-services.json правильно настроен, 3) Firebase проект настроен для Cloud Messaging',
          });
          // НЕ возвращаем Expo Push Token - это ошибка конфигурации
          return null;
        }

        log('info', 'FCM токен получен (mobile)', { platform: Platform.OS, token: token.data });
        // Для Android возвращает нативный FCM токен
        // Для iOS возвращает APNs токен (нужна настройка в Firebase Console)
        return token.data;
      }
    } catch (error) {
      log('error', 'Не удалось получить нативный токен устройства', error);
      return null;
    }

    log('warn', 'Не удалось получить FCM токен');
    return null;
  } catch (error) {
    log('error', 'Ошибка получения FCM токена', error);
    return null;
  }
}

/**
 * Отправляет FCM токен на сервер
 * Требует авторизации - токен должен быть привязан к пользователю
 */
export async function sendFCMTokenToServer(token: string): Promise<boolean> {
  try {
    const url = `${env.API_BASE_URL}/auth/firebase-token`;
    
    log('debug', 'Отправка FCM токена на сервер', { url });

    try {
      const response = await authFetch(url, {
        method: 'POST',
        requireAuth: true, // Токен отправляется только для авторизованных пользователей
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        log('info', 'FCM токен успешно отправлен на сервер');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        log('warn', 'Ошибка отправки FCM токена на сервер', {
          status: response.status,
          error: errorData,
        });
        return false;
      }
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.message === 'Request timeout') {
        log('error', 'Таймаут при отправке FCM токена');
      } else {
        log('error', 'Ошибка сети при отправке FCM токена', fetchError);
      }
      return false;
    }
  } catch (error) {
    log('error', 'Ошибка отправки FCM токена', error);
    return false;
  }
}

/**
 * Инициализирует Firebase и отправляет токен на сервер
 * Вызывается при запуске приложения
 */
export async function initializeAndSendToken(): Promise<void> {
  try {
    // Инициализируем Firebase
    initializeFirebase();

    // Настраиваем уведомления
    await configureNotifications();

    // Получаем токен
    const token = await getFCMToken();

    if (!token) {
      log('warn', 'Не удалось получить FCM токен, пропускаем отправку');
      return;
    }

    // Отправляем токен на сервер (только если пользователь авторизован)
    await sendFCMTokenToServer(token);
  } catch (error) {
    log('error', 'Ошибка инициализации Firebase и отправки токена', error);
  }
}

/**
 * Отправляет FCM токен на сервер после успешной авторизации
 * Вызывается после логина/регистрации
 */
export async function sendTokenAfterAuth(): Promise<void> {
  try {
    // Проверяем, что Firebase уже инициализирован
    if (!firebaseApp) {
      initializeFirebase();
      await configureNotifications();
    }

    // Получаем токен
    const token = await getFCMToken();

    if (!token) {
      log('warn', 'Не удалось получить FCM токен после авторизации');
      return;
    }

    // Отправляем токен на сервер (пользователь уже авторизован)
    await sendFCMTokenToServer(token);
  } catch (error) {
    log('error', 'Ошибка отправки FCM токена после авторизации', error);
  }
}
