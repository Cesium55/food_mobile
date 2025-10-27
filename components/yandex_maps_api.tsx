import { StyleSheet, Text, View } from "react-native";

export default function YandexMapsAPI() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yandex Maps API</Text>
      <Text style={styles.description}>Здесь будет работа с API Яндекс Карт</Text>
      <Text style={styles.description}>Пока без логики</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});

