import { log } from '@/constants/config';
import { verifyPhone, resendVerificationCode } from '@/services/phoneVerificationService';
import { authService } from '@/services/autoAuthService';
import { clearTokens } from '@/utils/storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function VerifyPhone() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Блокируем кнопку "назад" на Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Возвращаем true чтобы предотвратить возврат назад
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleVerify = async () => {
    log('debug', 'Начало handleVerify', { code, loading });
    
    // Очищаем предыдущие ошибки
    setError(null);
    setSuccessMessage(null);
    
    if (!code.trim()) {
      setError('Пожалуйста, введите код подтверждения');
      return;
    }

    // Валидация кода: должен быть 6 цифр
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code.trim())) {
      setError('Код должен состоять из 6 цифр');
      return;
    }

    if (loading) {
      log('debug', 'Запрос уже выполняется, игнорируем повторный вызов');
      return;
    }

    log('debug', 'Начинаем API запрос верификации', { code });
    setLoading(true);

    try {
      const result = await verifyPhone(code.trim());
      
      if (result.success) {
        log('info', 'Телефон успешно верифицирован');
        setSuccessMessage('Телефон успешно верифицирован!');
        
        // Небольшая задержка перед переходом
        setTimeout(() => {
          router.replace('/(tabs)/(home)');
        }, 1000);
      } else {
        setError(result.error || 'Ошибка верификации телефона');
        log('error', 'Ошибка верификации', { error: result.error });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(`Ошибка соединения: ${errorMessage}`);
      log('error', 'Ошибка при верификации', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resending) {
      return;
    }

    log('debug', 'Запрос на повторную отправку кода');
    setResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await resendVerificationCode();
      
      if (result.success) {
        setSuccessMessage(result.message || 'Код отправлен повторно');
        log('info', 'Код успешно отправлен повторно');
      } else {
        setError(result.error || 'Ошибка повторной отправки кода');
        log('error', 'Ошибка повторной отправки кода', { error: result.error });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(`Ошибка соединения: ${errorMessage}`);
      log('error', 'Ошибка при повторной отправке кода', { error: errorMessage });
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              // Очищаем токены
              await clearTokens();
              // Очищаем кеш пользователя
              authService.clearCache();
              log('info', 'Пользователь вышел из системы');
              // Переходим на страницу регистрации
              router.replace('/register');
            } catch (error) {
              log('error', 'Ошибка при выходе', { error });
              Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Подтверждение телефона</Text>
          <Text style={styles.subtitle}>
            Введите 6-значный код подтверждения, отправленный на ваш телефон
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Код подтверждения</Text>
            <TextInput
              style={[
                styles.input,
                error && styles.inputError
              ]}
              value={code}
              onChangeText={(text) => {
                // Разрешаем только цифры, максимум 6 символов
                const cleaned = text.replace(/[^\d]/g, '').slice(0, 6);
                setCode(cleaned);
                setError(null); // Очищаем ошибку при вводе
              }}
              placeholder="000000"
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={6}
              editable={!loading}
            />
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            {successMessage && (
              <Text style={styles.successText}>{successMessage}</Text>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.verifyButton, 
              loading && styles.verifyButtonDisabled,
              loading && styles.verifyButtonLoading
            ]} 
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.verifyButtonText}>Подтвердить</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.resendButton,
              resending && styles.resendButtonDisabled
            ]} 
            onPress={handleResendCode}
            disabled={resending || loading}
          >
            {resending ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.resendButtonText}>Отправить код повторно</Text>
            )}
          </TouchableOpacity>

          {/* Кнопка выхода */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            disabled={loading}
          >
            <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  successText: {
    color: '#34C759',
    fontSize: 12,
    marginTop: 4,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  verifyButtonLoading: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});




