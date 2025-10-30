import YandexMapsWebView from "@/components/yandex_maps_webview";
import { Colors } from "@/constants/theme";
import { useLocation } from '@/hooks/useLocation';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Map() {
  const colors = Colors.light;
  const { coords, status, error } = useLocation();

  useEffect(() => {
    if (status === 'granted' && coords) {
      console.log(`User location: latitude=${coords.latitude}, longitude=${coords.longitude}`);
    }
    if (status === 'denied') {
      console.log('Permission to access location was denied');
    }
    if (error) {
      console.log('Location error:', error);
    }
  }, [status, coords, error]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Map</Text>
      </View>
      <View style={styles.mapContainer}>
        <YandexMapsWebView />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
  },
});

