import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from 'react-native-webview';
import ShopModal from './ShopModal';

// Демо-данные магазина
const demoShop = {
  id: 1,
  name: "Продуктовый магазин 'Свежие продукты'",
  address: "ул. Ленина, 15",
  phone: "+7 (495) 123-45-67",
  rating: 4.5,
  image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
  description: "Свежие продукты каждый день! Широкий ассортимент овощей, фруктов, мяса и молочных продуктов. Качественные товары по доступным ценам.",
  workingHours: "Пн-Вс: 8:00 - 22:00",
  distance: "0.5 км"
};

export default function YandexMapsWebView() {
  const [modalVisible, setModalVisible] = useState(false);

  const handleMarkerClick = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://gembos.ru/debug/template' }}
        originWhitelist={['*']}
        javaScriptEnabled
        style={styles.webview}
        onMessage={(event) => {
          console.log("WebView message received:", event.nativeEvent.data);
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log("Parsed data:", data);
            if (data.type === 'markerClick') {
              console.log("Opening modal...");
              handleMarkerClick();
            }
          } catch (error) {
            console.log('Error parsing WebView message:', error);
          }
        }}
      />
      
      <ShopModal
        visible={modalVisible}
        shop={demoShop}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

