import { log } from '@/constants/config';
import { authService } from '@/services/autoAuthService';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTokens } from '@/utils/storage';
import { decodeJWT } from '@/utils/jwt';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'auth' | 'unknown' | null>(null);

  useEffect(() => {
    checkAuthAndNavigate();
  }, []);

  // Блокируем кнопку "назад" на Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Возвращаем true чтобы предотвратить стандартное поведение (выход из приложения)
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const checkAuthAndNavigate = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);
      
      // Проверяем авторизацию (метод сам использует кеш если возможно)
      const result = await authService.checkAuth();
      
      log('debug', 'Auth result:', { 
        success: result.success, 
        errorType: result.errorType, 
        error: result.error,
        hasUserData: !!result.userData 
      });
      
      if (result.success && result.userData) {
        // Проверяем phone_verified в токене или в данных пользователя
        const tokens = await getTokens();
        let phoneVerified = false;
        
        if (tokens.accessToken) {
          const payload = decodeJWT(tokens.accessToken);
          phoneVerified = payload?.phone_verified === true;
        }
        
        // Если в токене нет информации, проверяем данные пользователя
        if (!phoneVerified && result.userData.phone_verified === true) {
          phoneVerified = true;
        }
        
        if (phoneVerified) {
          // Телефон верифицирован - переходим на главную страницу
          router.replace('/(tabs)/(home)');
        } else {
          // Телефон не верифицирован - переходим на экран верификации
          log('info', 'Phone not verified, redirecting to verification screen');
          router.replace('/verify-phone');
        }
      } else if (result.errorType === 'network') {
        // Сетевая ошибка - показываем экран с возможностью повтора
        log('info', 'Network error detected, showing retry UI');
        setError(result.error || 'Нет подключения к интернету');
        setErrorType('network');
      } else {
        // Ошибка авторизации или нет токенов - переход на регистрацию
        log('info', 'Auth error detected, redirecting to register');
        router.replace('/register');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      log('error', 'Unexpected error during auth check', { error: errorMessage });
      setError(errorMessage);
      setErrorType('unknown');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Проверка авторизации...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ошибка: {error}</Text>
        
        {errorType === 'network' ? (
          <View style={styles.networkErrorContainer}>
            <Text style={styles.errorSubtext}>
              Проблема с подключением к интернету или сервером
            </Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={checkAuthAndNavigate}
            >
              <Text style={styles.retryButtonText}>Повторить попытку</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={() => router.replace('/register')}
            >
              <Text style={styles.registerButtonText}>Перейти к регистрации</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.errorSubtext}>Переход на страницу регистрации...</Text>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  networkErrorContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});