import { TabScreen } from "@/components/TabScreen";
import YandexMapsWebView from "@/components/yandex_maps_webview";
import { useLocation } from '@/hooks/useLocation';
import { useEffect } from 'react';
import { StyleSheet, View } from "react-native";

export default function Map() {
  const { coords, status, error } = useLocation();

  useEffect(() => {
    // Location tracking
  }, [status, coords, error]);

  return (
    <TabScreen useScrollView={false}>
      <View style={styles.mapContainer}>
        <YandexMapsWebView />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
});

