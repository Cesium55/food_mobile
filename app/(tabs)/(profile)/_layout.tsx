import { useNavigation } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileLayout() {
  const navigation = useNavigation();

  useEffect(() => {
    // Скрываем таббар при входе в профиль
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    return () => {
      // Восстанавливаем таббар при выходе
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'flex' },
        });
      }
    };
  }, [navigation]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="order-paid" options={{ headerShown: false }} />
    </Stack>
  );
}