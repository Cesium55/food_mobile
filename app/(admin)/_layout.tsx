import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function AdminTabLayout() {
  // Принудительно используем светлую тему
  const colorScheme = 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.light.background,
        },
      }}>
      <Tabs.Screen
        name="(shop)"
        options={{
          title: 'Магазин',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(points)"
        options={{
          title: 'Точки',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.pin.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(products)"
        options={{
          title: 'Товары',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cube.box.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(offers)"
        options={{
          title: 'Офферы',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(orders)"
        options={{
          title: 'Заказы',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="shopping-cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(admin-profile)"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

