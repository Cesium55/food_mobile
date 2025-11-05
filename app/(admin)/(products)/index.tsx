import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCategories } from "@/hooks/useCategories";
import { useProducts, Product } from "@/hooks/useProducts";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ProductsScreen() {
    const { categories, getCategoryById } = useCategories();
    const { products, loading: productsLoading, error: productsError } = useProducts();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // Группировка товаров по категориям
    const getCategoryIcon = (categoryId: number): string => {
        const category = getCategoryById(categoryId);
        if (!category) return '📦';
        
        const parentId = category.parent_category_id || categoryId;
        const icons: { [key: number]: string } = {
            1: '🥛', 2: '🥩', 3: '🥗', 4: '🍞',
            5: '🥤', 6: '🌾', 7: '❄️', 8: '🍰',
        };
        return icons[parentId] || '📦';
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategoryId === null || product.category_ids.includes(selectedCategoryId);
        return matchesSearch && matchesCategory;
    });

    // Группировка по категориям (берем первую категорию товара для группировки)
    const groupedProducts = filteredProducts.reduce((acc, product) => {
        // Используем первую категорию товара для группировки
        const mainCategoryId = product.category_ids.length > 0 ? product.category_ids[0] : 0;
        if (!acc[mainCategoryId]) {
            acc[mainCategoryId] = [];
        }
        acc[mainCategoryId].push(product);
        return acc;
    }, {} as { [key: number]: Product[] });

    const handleProductPress = (productId: number) => {
        router.push(`/(admin)/(products)/${productId}`);
    };

    const handleAddProduct = () => {
        router.push('/(admin)/(products)/new');
    };

    // Получаем все категории, которые имеют товары
    const categoriesWithProducts = Object.keys(groupedProducts).map(Number);

    return (
        <TabScreen title="Товары">
            <View style={styles.container}>
                {/* Заголовок и кнопка добавления */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Каталог товаров
                    </Text>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={handleAddProduct}
                    >
                        <IconSymbol name="plus" size={20} color="#fff" />
                        <Text style={styles.addButtonText}>Добавить</Text>
                    </TouchableOpacity>
                </View>

                {/* Поиск */}
                <View style={styles.searchContainer}>
                    <IconSymbol name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Поиск товаров..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <IconSymbol name="xmark" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Список товаров */}
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {productsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#34C759" />
                            <Text style={styles.loadingText}>Загрузка товаров...</Text>
                        </View>
                    ) : productsError ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>⚠️</Text>
                            <Text style={styles.emptyText}>Ошибка загрузки</Text>
                            <Text style={styles.emptySubtext}>{productsError}</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.countText}>
                                Всего товаров: {filteredProducts.length}
                            </Text>

                            {categoriesWithProducts.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyIcon}>📦</Text>
                                    <Text style={styles.emptyText}>
                                        {searchQuery ? "Товары не найдены" : "Нет товаров"}
                                    </Text>
                                    <Text style={styles.emptySubtext}>
                                        {searchQuery ? "Попробуйте изменить поисковый запрос" : "Нажмите 'Добавить' чтобы создать первый товар"}
                                    </Text>
                                </View>
                            ) : (
                                categoriesWithProducts.map(categoryId => {
                                    // Обработка товаров без категорий (categoryId = 0)
                                    if (categoryId === 0) {
                                        return (
                                            <View key="no-category" style={styles.categorySection}>
                                                <View style={styles.categoryHeader}>
                                                    <Text style={styles.categoryIcon}>📦</Text>
                                                    <Text style={styles.categoryName}>Без категории</Text>
                                                    <Text style={styles.categoryCount}>
                                                        {groupedProducts[categoryId].length}
                                                    </Text>
                                                </View>

                                                {groupedProducts[categoryId].map(product => (
                                                    <TouchableOpacity
                                                        key={product.id}
                                                        style={styles.productCard}
                                                        activeOpacity={0.7}
                                                        onPress={() => handleProductPress(product.id)}
                                                    >
                                                        <View style={styles.productIcon}>
                                                            <Text style={styles.productIconText}>📦</Text>
                                                        </View>
                                                        
                                                        <View style={styles.productInfo}>
                                                            <Text style={styles.productName}>{product.name}</Text>
                                                            <Text style={styles.productDescription} numberOfLines={1}>
                                                                {product.description}
                                                            </Text>
                                                        </View>

                                                        <IconSymbol name="chevron.right" color="#999" size={20} />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        );
                                    }

                                    const category = getCategoryById(categoryId);
                                    if (!category) return null;

                                    return (
                                        <View key={categoryId} style={styles.categorySection}>
                                            <View style={styles.categoryHeader}>
                                                <Text style={styles.categoryIcon}>{getCategoryIcon(categoryId)}</Text>
                                                <Text style={styles.categoryName}>{category.name}</Text>
                                                <Text style={styles.categoryCount}>
                                                    {groupedProducts[categoryId].length}
                                                </Text>
                                            </View>

                                            {groupedProducts[categoryId].map(product => (
                                                <TouchableOpacity
                                                    key={product.id}
                                                    style={styles.productCard}
                                                    activeOpacity={0.7}
                                                    onPress={() => handleProductPress(product.id)}
                                                >
                                                    <View style={styles.productIcon}>
                                                        <Text style={styles.productIconText}>
                                                            {getCategoryIcon(categoryId)}
                                                        </Text>
                                                    </View>
                                                    
                                                    <View style={styles.productInfo}>
                                                        <Text style={styles.productName}>{product.name}</Text>
                                                        <Text style={styles.productDescription} numberOfLines={1}>
                                                            {product.description}
                                                        </Text>
                                                    </View>

                                                    <IconSymbol name="chevron.right" color="#999" size={20} />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    );
                                })
                            )}
                        </>
                    )}
                </ScrollView>
            </View>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#34C759',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        margin: 16,
        marginBottom: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    scrollContent: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 40,
    },
    countText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        marginBottom: 8,
    },
    categoryIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    categoryName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    categoryCount: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        alignItems: 'center',
    },
    productIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    productIconText: {
        fontSize: 24,
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    productDescription: {
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});
