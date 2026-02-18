import { useNavigation } from '@react-navigation/native';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function ProfileLayout() {
  const navigation = useNavigation();

  // Скрываем таббар при фокусе на любом экране профиля
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      // Не восстанавливаем таббар в cleanup, так как он должен оставаться скрытым
      // для всех экранов профиля. Восстановится автоматически при выходе из профиля.
    }, [navigation])
  );

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="order-paid" options={{ headerShown: false }} />
    </Stack>
  );
}
