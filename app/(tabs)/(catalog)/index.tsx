import { TabScreen } from "@/components/TabScreen";
import { useCategories } from "@/hooks/useCategories";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ROW_HEIGHT = 70;

export default function Catalog() {
  const router = useRouter();
  const { getTopLevelCategories } = useCategories();
  const topCategories = getTopLevelCategories();

  const getCategoryIcon = (categoryId: number): string => {
    const icons: { [key: number]: string } = {
      1: '🥛', // Молочные продукты
      2: '🥩', // Мясо и птица
      3: '🥗', // Овощи и фрукты
      4: '🍞', // Хлеб и выпечка
      5: '🥤', // Напитки
      6: '🌾', // Бакалея
      7: '❄️', // Замороженные продукты
      8: '🍰', // Кондитерские изделия
    };
    return icons[categoryId] || '📦';
  };

  return (
    <TabScreen title="Каталог">
      <View style={styles.container}>
        <Text style={styles.title}>Категории товаров</Text>
        
        <View style={styles.list}>
          {topCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryRow}
              activeOpacity={0.7}
              onPress={() => router.push(`/(tabs)/(catalog)/${category.id}`)}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getCategoryIcon(category.id)}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  list: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: ROW_HEIGHT * 0.14,
    paddingHorizontal: ROW_HEIGHT * 0.2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: ROW_HEIGHT * 0.6,
    height: ROW_HEIGHT * 0.6,
    borderRadius: ROW_HEIGHT * 0.3,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ROW_HEIGHT * 0.2,
  },
  icon: {
    fontSize: ROW_HEIGHT * 0.4,
  },
  categoryName: {
    flex: 1,
    fontSize: ROW_HEIGHT * 0.23,
    fontWeight: '600',
    color: '#333',
  },
  arrow: {
    fontSize: ROW_HEIGHT * 0.5,
    color: '#999',
    fontWeight: '300',
  },
});