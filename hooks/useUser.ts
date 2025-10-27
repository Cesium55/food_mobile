import { authService } from '@/services/autoAuthService';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  verified: boolean;
  active: boolean;
  is_seller: boolean;
}

export const useUser = (): User => {
  const [user, setUser] = useState<User>({
    id: 0,
    email: 'Загрузка...',
    verified: false,
    active: false,
    is_seller: false,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Перезагружаем профиль при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      // Получаем данные пользователя из кешированного autoAuthService
      const userProfile = await authService.getUserProfile();
      
      if (userProfile) {
        setUser({
          id: userProfile.id,
          email: userProfile.email,
          verified: true, // Предполагаем, что пользователь верифицирован
          active: true,  // Предполагаем, что пользователь активен
          is_seller: userProfile.is_seller || false,
        });
      } else {
        setUser({
          id: 0,
          email: 'Не авторизован',
          verified: false,
          active: false,
          is_seller: false,
        });
      }
    } catch (error) {
      setUser({
        id: 0,
        email: 'Ошибка соединения',
        verified: false,
        active: false,
        is_seller: false,
      });
    }
  };

  return user;
};