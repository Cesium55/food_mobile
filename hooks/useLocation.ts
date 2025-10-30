import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

interface LocationState {
  coords: {
    latitude: number;
    longitude: number;
  } | null;
  status: 'pending' | 'granted' | 'denied';
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: null,
    status: 'pending',
    error: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setState({ coords: null, status: 'denied', error: 'Permission denied' });
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setState({
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          status: 'granted',
          error: null,
        });
      } catch (e) {
        setState({ coords: null, status: 'denied', error: String(e) });
      }
    })();
  }, []);

  return state;
}
