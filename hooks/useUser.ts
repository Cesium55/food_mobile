import { authService } from '@/services/autoAuthService';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: number;
  email?: string | null;
  phone?: string | null;
  verified: boolean;
  active: boolean;
  is_seller: boolean;
}

export const useUser = (): User => {
  const [user, setUser] = useState<User>({
    id: 0,
    email: null,
    phone: null,
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
          email: userProfile.email || null,
          phone: userProfile.phone || null,
          verified: userProfile.phone_verified || false,
          active: true,  // Предполагаем, что пользователь активен
          is_seller: userProfile.is_seller || false,
        });
      } else {
        setUser({
          id: 0,
          email: null,
          phone: null,
          verified: false,
          active: false,
          is_seller: false,
        });
      }
    } catch (error) {
      setUser({
        id: 0,
        email: null,
        phone: null,
        verified: false,
        active: false,
        is_seller: false,
      });
    }
  };

  return user;
};