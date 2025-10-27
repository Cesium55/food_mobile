import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCategories } from "@/hooks/useCategories";
import { router } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface Product {
    id: number;
    name: string;
    description: string;
    categoryId: number;
}

export default function ProductsScreen() {
    const { categories, getCategoryById } = useCategories();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // Демо-данные товаров
    const [products] = useState<Product[]>([
        // Молочные продукты
        { id: 1, name: "Молоко пастеризованное 3.2%", description: "Натуральное коровье молоко", categoryId: 11 },
        { id: 2, name: "Молоко ультрапастеризованное 2.5%", description: "Длительного хранения", categoryId: 11 },
        { id: 3, name: "Кефир 2.5%", description: "Традиционный кисломолочный напиток", categoryId: 12 },
        { id: 4, name: "Йогурт натуральный", description: "Без добавок и сахара", categoryId: 12 },
        { id: 5, name: "Творог 5%", description: "Зерненый творог", categoryId: 13 },
        { id: 6, name: "Сырки глазированные", description: "Творожная масса в шоколаде", categoryId: 13 },
        { id: 7, name: "Сыр Российский", description: "Твердый сыр", categoryId: 14 },
        { id: 8, name: "Сыр Пармезан", description: "Итальянский твердый сыр", categoryId: 14 },
        { id: 9, name: "Сметана 20%", description: "Классическая сметана", categoryId: 15 },
        { id: 10, name: "Масло сливочное 82.5%", description: "Традиционное сливочное масло", categoryId: 16 },
        
        // Хлеб и выпечка
        { id: 11, name: "Хлеб Бородинский", description: "Ржаной хлеб", categoryId: 41 },
        { id: 12, name: "Хлеб белый", description: "Пшеничный хлеб", categoryId: 41 },
        { id: 13, name: "Круассан с шоколадом", description: "Свежая выпечка", categoryId: 42 },
        { id: 14, name: "Булочка с маком", description: "Сдобная булочка", categoryId: 42 },
        
        // Мясо и птица
        { id: 15, name: "Куриное филе", description: "Охлажденное", categoryId: 23 },
        { id: 16, name: "Фарш говяжий", description: "Свежий фарш", categoryId: 24 },
        { id: 17, name: "Колбаса Докторская", description: "Вареная колбаса", categoryId: 25 },
        
        // Овощи и фрукты
        { id: 18, name: "Помидоры", description: "Свежие томаты", categoryId: 31 },
        { id: 19, name: "Огурцы", description: "Свежие огурцы", categoryId: 31 },
        { id: 20, name: "Яблоки Голден", description: "Импортные яблоки", categoryId: 32 },
    ]);

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
        const matchesCategory = selectedCategoryId === null || product.categoryId === selectedCategoryId;
        return matchesSearch && matchesCategory;
    });

    // Группировка по категориям
    const groupedProducts = filteredProducts.reduce((acc, product) => {
        if (!acc[product.categoryId]) {
            acc[product.categoryId] = [];
        }
        acc[product.categoryId].push(product);
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
});
