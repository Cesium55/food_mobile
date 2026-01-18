import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  // Принудительно используем светлую тему
  const colorScheme = 'light';
  const pathname = usePathname();
  const isProfileScreen = pathname?.includes('(profile)');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B00', // Оранжевый цвет для активных иконок
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarLabelStyle: {
          color: '#000000', // Черный цвет для текста (всегда)
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: isProfileScreen
          ? { display: 'none' }
          : {
              backgroundColor: Colors.light.background,
            },
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <IconSymbol size={28} name="house.fill" color={focused ? '#FF6B00' : Colors.light.tabIconDefault} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? '#000000' : Colors.light.tabIconDefault, fontSize: 12 }}>Home</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="(catalog)"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ focused }) => (
            <IconSymbol size={28} name="list.bullet" color={focused ? '#FF6B00' : Colors.light.tabIconDefault} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? '#000000' : Colors.light.tabIconDefault, fontSize: 12 }}>Catalog</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="(map)"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <IconSymbol size={28} name="map.fill" color={focused ? '#FF6B00' : Colors.light.tabIconDefault} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? '#000000' : Colors.light.tabIconDefault, fontSize: 12 }}>Map</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="(cart)"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <IconSymbol size={28} name="shopping-cart.fill" color={focused ? '#FF6B00' : Colors.light.tabIconDefault} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? '#000000' : Colors.light.tabIconDefault, fontSize: 12 }}>Cart</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          href: null, // Скрываем из таббара, но оставляем доступным через роутинг
          tabBarStyle: { display: 'none' },
        }}
        listeners={{
          focus: () => {
            // Скрываем таббар при фокусе на профиле
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
