import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { CartProvider } from '@/contexts/CartContext';
import { ShopsProvider } from '@/contexts/ShopsContext';


export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // Принудительно используем светлую тему
  const colorScheme = 'light';

  return (
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
        <StatusBar style="auto" />
        </ShopsProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
