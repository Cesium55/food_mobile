import PhoneInput from '@/components/PhoneInput';
import { config, log } from '@/constants/config';
import { ApiResponse, authService } from '@/services/authService';
import { authService as autoAuthService } from '@/services/autoAuthService';
import { sendTokenAfterAuth } from '@/services/firebaseService';
import { FieldError, getFieldError, processAuthResponse } from '@/utils/errorHandler';
import { decodeJWT } from '@/utils/jwt';
import { saveTokens } from '@/utils/storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

export default function Register() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Блокируем кнопку "назад" на Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Возвращаем true чтобы предотвратить возврат назад
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleRegister = async () => {
    log('debug', 'Начало handleRegister', { phone, loading });
    
    // Очищаем предыдущие ошибки
    setFieldErrors([]);
    setGeneralError(null);
    
    if (!phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setGeneralError('Пожалуйста, заполните все поля');
      return;
    }

    // Валидация телефона: строка из 11 цифр, начинающаяся с 7
    const phoneRegex = /^7\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      setFieldErrors([{ field: 'phone', message: 'Телефон должен состоять из 11 цифр и начинаться с 7' }]);
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors([{ field: 'confirmPassword', message: 'Пароли не совпадают' }]);
      return;
    }

    if (password.length < 6) {
      setFieldErrors([{ field: 'password', message: 'Пароль должен содержать минимум 6 символов' }]);
      return;
    }

    if (loading) {
      log('debug', 'Запрос уже выполняется, игнорируем повторный вызов');
      return;
    }

    log('debug', 'Начинаем API запрос', { phone });
    setLoading(true);
    setApiResponse(null);

    try {
      const response = await authService.register(phone.trim(), password);
      setApiResponse(response);
      
      const result = processAuthResponse(response);
      
      if (result.success && result.data) {
        // Очищаем старый кеш перед входом
        autoAuthService.clearCache();
        // Сохраняем токены
        await saveTokens(result.data.access_token, result.data.refresh_token);
        log('info', 'Пользователь успешно зарегистрирован');
        
        // Отправляем FCM токен на сервер после успешной регистрации
        sendTokenAfterAuth().catch((error) => {
          log('warn', 'Не удалось отправить FCM токен после регистрации', error);
        });
        
        // Проверяем phone_verified в токене
        const payload = decodeJWT(result.data.access_token);
        
        if (payload && payload.phone_verified === true) {
          // Телефон верифицирован - переходим на главную страницу
          router.replace('/(tabs)/(home)');
        } else {
          // Телефон не верифицирован - переходим на экран верификации
          router.replace('/verify-phone');
        }
      } else if (result.error) {
        // Обрабатываем ошибки
        if (result.error.fieldErrors) {
          setFieldErrors(result.error.fieldErrors);
        } else {
          setGeneralError(result.error.message);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      // Создаем фиктивный ответ для отображения URL даже при ошибке
      const errorResponse: ApiResponse = {
        status: 0,
        statusText: 'Network Error',
        data: { error: errorMessage },
        headers: {},
        url: `${config.apiBaseUrl}/auth/register`,
        method: 'POST',
      };
      setApiResponse(errorResponse);
      
      setGeneralError(`Ошибка соединения: ${errorMessage}`);
      log('error', 'Ошибка при регистрации', { phone, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Регистрация</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Телефон</Text>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              error={!!getFieldError(fieldErrors, 'phone')}
              errorText={getFieldError(fieldErrors, 'phone')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Пароль</Text>
            <TextInput
              style={[
                styles.input,
                getFieldError(fieldErrors, 'password') && styles.inputError
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Введите пароль"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {getFieldError(fieldErrors, 'password') && (
              <Text style={styles.errorText}>{getFieldError(fieldErrors, 'password')}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Подтвердите пароль</Text>
            <TextInput
              style={[
                styles.input,
                getFieldError(fieldErrors, 'confirmPassword') && styles.inputError
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Подтвердите пароль"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {getFieldError(fieldErrors, 'confirmPassword') && (
              <Text style={styles.errorText}>{getFieldError(fieldErrors, 'confirmPassword')}</Text>
            )}
          </View>

          {generalError && (
            <View style={styles.generalErrorContainer}>
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.registerButton, 
              loading && styles.registerButtonDisabled,
              loading && styles.registerButtonLoading
            ]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
            )}
          </TouchableOpacity>

          {apiResponse && (
            <View style={styles.responseContainer}>
              <Text style={styles.responseTitle}>Ответ API:</Text>
              <Text style={styles.responseText}>
                {apiResponse.method} {apiResponse.url}
              </Text>
              <Text style={styles.responseText}>
                Код: {apiResponse.status} {apiResponse.statusText}
              </Text>
              <Text style={styles.responseText}>
                Заголовки: {JSON.stringify(apiResponse.headers, null, 2)}
              </Text>
              <Text style={styles.responseText}>
                Тело ответа: {JSON.stringify(apiResponse.data, null, 2)}
              </Text>
            </View>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Уже есть аккаунт? </Text>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.loginLink}>Войти</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 32,
    color: '#333',
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
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
  generalErrorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonLoading: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  responseContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  responseText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
