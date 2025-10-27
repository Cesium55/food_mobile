/**
 * Утилиты для работы с AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Ключи для хранения токенов
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/**
 * Сохраняет токены в AsyncStorage
 */
export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [TOKEN_KEYS.ACCESS_TOKEN, accessToken],
      [TOKEN_KEYS.REFRESH_TOKEN, refreshToken],
    ]);
    console.log('✅ Токены сохранены в AsyncStorage');
  } catch (error) {
    console.error('❌ Ошибка сохранения токенов:', error);
    throw error;
  }
};

/**
 * Получает токены из AsyncStorage
 */
export const getTokens = async (): Promise<{ accessToken: string | null; refreshToken: string | null }> => {
  try {
    const tokens = await AsyncStorage.multiGet([
      TOKEN_KEYS.ACCESS_TOKEN,
      TOKEN_KEYS.REFRESH_TOKEN,
    ]);
    
    return {
      accessToken: tokens[0][1],
      refreshToken: tokens[1][1],
    };
  } catch (error) {
    console.error('❌ Ошибка получения токенов:', error);
    return { accessToken: null, refreshToken: null };
  }
};

/**
 * Удаляет токены из AsyncStorage
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      TOKEN_KEYS.ACCESS_TOKEN,
      TOKEN_KEYS.REFRESH_TOKEN,
    ]);
    console.log('✅ Токены удалены из AsyncStorage');
  } catch (error) {
    console.error('❌ Ошибка удаления токенов:', error);
    throw error;
  }
};

/**
 * Проверяет, есть ли сохраненные токены
 */
export const hasTokens = async (): Promise<boolean> => {
  const { accessToken } = await getTokens();
  return accessToken !== null;
};
