import { CartProvider } from '@/contexts/CartContext';
import { ShopsProvider } from '@/contexts/ShopsContext';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import { initializeAndSendToken } from '@/services/firebaseService';
import { initializeLocationUpdate } from '@/services/locationService';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';


export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // Принудительно используем светлую тему
  const colorScheme = 'light';

  // Инициализируем Firebase и отправляем FCM токен при запуске приложения
  useEffect(() => {
    initializeAndSendToken();
  }, []);

  // Инициализируем обновление местоположения при запуске приложения
  useEffect(() => {
    initializeLocationUpdate();
  }, []);

  return (
    <AppThemeProvider>
      <ThemeProvider value={DefaultTheme}>
        <CartProvider>
          <ShopsProvider>
            <Stack
            screenOptions={{
              animation: 'fade',
              animationDuration: 200,
            }}
          >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false,
              animation: 'fade',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen 
            name="register" 
            options={{ 
              headerShown: false,
              animation: 'fade',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ 
              headerShown: false,
              animation: 'fade',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 400,
            }} 
          />
          <Stack.Screen 
            name="(admin)" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 400,
            }} 
          />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', 
              title: 'Modal',
              animation: 'slide_from_bottom',
              animationDuration: 300,
            }} 
          />
          </Stack>
          <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
          </ShopsProvider>
        </CartProvider>
      </ThemeProvider>
    </AppThemeProvider>
  );
}
