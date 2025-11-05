import { TabScreen } from "@/components/TabScreen";
import { useCategories } from "@/hooks/useCategories";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Catalog() {
  const router = useRouter();
  const { getTopLevelCategories, getSubCategories, loading, error } = useCategories();
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

  if (loading) {
    return (
      <TabScreen title="Каталог">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Загрузка категорий...</Text>
        </View>
      </TabScreen>
    );
  }

  if (error) {
    return (
      <TabScreen title="Каталог">
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Ошибка: {error}</Text>
        </View>
      </TabScreen>
    );
  }

  if (topCategories.length === 0) {
    return (
      <TabScreen title="Каталог">
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Категории не найдены</Text>
        </View>
      </TabScreen>
    );
  }

  return (
    <TabScreen title="Каталог">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Категории товаров</Text>
          
          {topCategories.map((category) => {
            const subCategories = getSubCategories(category.id);
            
            return (
              <View key={category.id} style={styles.categoryGroup}>
                {/* Заголовок категории верхнего уровня - просто текст, не кнопка */}
                <View style={styles.categoryHeader}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{getCategoryIcon(category.id)}</Text>
                  </View>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                </View>
                
                {/* Подкатегории как кнопки под заголовком */}
                {subCategories.length > 0 ? (
                  <View style={styles.subCategoriesContainer}>
                    {subCategories.map((subCategory) => (
                      <TouchableOpacity
                        key={subCategory.id}
                        style={styles.subCategoryButton}
                        activeOpacity={0.7}
                        onPress={() => router.push(`/(tabs)/(catalog)/${subCategory.id}`)}
                      >
                        <View style={styles.subCategoryIconContainer}>
                          <Text style={styles.subCategoryIcon}>📦</Text>
                        </View>
                        <Text style={styles.subCategoryText}>{subCategory.name}</Text>
                        <Text style={styles.arrow}>›</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  // Если подкатегорий нет, показываем кнопку для перехода к товарам категории
                  <TouchableOpacity
                    style={styles.subCategoryButton}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(tabs)/(catalog)/${category.id}`)}
                  >
                    <Text style={styles.subCategoryText}>Показать товары</Text>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  container: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  categoryGroup: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  subCategoriesContainer: {
    gap: 10,
  },
  subCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subCategoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subCategoryIcon: {
    fontSize: 20,
  },
  subCategoryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  arrow: {
    fontSize: 20,
    color: '#999',
    fontWeight: '300',
  },
});