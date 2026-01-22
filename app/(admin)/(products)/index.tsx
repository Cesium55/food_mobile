import { ProductDetailContent } from "@/app/(admin)/(products)/[id]";
import { NewProductContent } from "@/app/(admin)/(products)/new";
import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useModal } from "@/contexts/ModalContext";
import { useCategories } from "@/hooks/useCategories";
import { Product, useProducts } from "@/hooks/useProducts";
import { useSellerMe } from "@/hooks/useSeller";
import { getImageUrl } from "@/utils/imageUtils";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ProductsScreen() {
    const { seller } = useSellerMe();
    const { categories, getCategoryById } = useCategories();
    const { products, loading: productsLoading, error: productsError, refetch } = useProducts(seller?.id);
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Фильтруем товары: только текущего продавца + поиск
    const filteredProducts = products.filter(product => {
        // Фильтр по продавцу
        if (seller?.id && product.seller_id !== seller.id) {
            return false;
        }
        
        // Фильтр по поиску
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
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
        openModal(<ProductDetailContent productId={productId} onClose={closeModal} />);
    };

    const handleAddProduct = () => {
        openModal(<NewProductContent onClose={closeModal} />);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    };

    // Получаем все категории, которые имеют товары
    const categoriesWithProducts = Object.keys(groupedProducts).map(Number);

    if (productsLoading) {
        return (
            <TabScreen title="Товары">
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#666' }}>Загрузка данных...</Text>
                </View>
            </TabScreen>
        );
    }

    if (productsError) {
        return (
            <TabScreen title="Товары">
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#ff3b30' }}>{productsError}</Text>
                </View>
            </TabScreen>
        );
    }

    return (
        <TabScreen title="Товары">
            <View style={styles.container}>
                {/* Заголовок и кнопка добавления */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Каталог товаров
                    </Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddProduct}
                        >
                            <IconSymbol name="plus" size={20} color="#fff" />
                            <Text style={styles.addButtonText}>Добавить</Text>
                        </TouchableOpacity>
                    </View>
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#34C759"
                            colors={["#34C759"]}
                        />
                    }
                >
                    <Text style={styles.countText}>
                        Всего товаров: {filteredProducts.length}
                    </Text>

                    {categoriesWithProducts.length === 0 ? (
                        <View style={styles.emptyContainer}>
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
                                            <IconSymbol name="cube.box" size={20} color="#666" />
                                            <Text style={styles.categoryName}>Без категории</Text>
                                            <Text style={styles.categoryCount}>
                                                {groupedProducts[categoryId].length}
                                            </Text>
                                        </View>

                                        {groupedProducts[categoryId].map(product => {
                                            // Получаем первую валидную строку изображения
                                            // images может быть массивом строк или объектов с path
                                            const firstImage = Array.isArray(product.images) && product.images.length > 0
                                                ? product.images[0]
                                                : null;
                                            
                                            // Извлекаем path из объекта или используем строку напрямую
                                            const imagePath = firstImage 
                                                ? (typeof firstImage === 'string' ? firstImage : firstImage.path)
                                                : null;
                                            
                                            const firstImageUrl = imagePath && typeof imagePath === 'string' && imagePath.length > 0
                                                ? getImageUrl(imagePath)
                                                : null;
                                            
                                            return (
                                                <TouchableOpacity
                                                    key={product.id}
                                                    style={styles.productCard}
                                                    activeOpacity={0.7}
                                                    onPress={() => handleProductPress(product.id)}
                                                >
                                                    <View style={styles.productIcon}>
                                                        {firstImageUrl ? (
                                                            <Image
                                                                source={{ uri: firstImageUrl }}
                                                                style={styles.productImage}
                                                                resizeMode="cover"
                                                            />
                                                        ) : (
                                                            <View style={styles.productIconPlaceholder}>
                                                                <IconSymbol name="photo" size={24} color="#999" />
                                                            </View>
                                                        )}
                                                    </View>
                                                    
                                                    <View style={styles.productInfo}>
                                                        <Text style={styles.productName}>{product.name}</Text>
                                                        <Text style={styles.productDescription} numberOfLines={1}>
                                                            {product.description}
                                                        </Text>
                                                    </View>

                                                    <IconSymbol name="chevron.right" color="#999" size={20} />
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                );
                            }

                            const category = getCategoryById(categoryId);
                            if (!category) return null;

                            return (
                                <View key={categoryId} style={styles.categorySection}>
                                    <View style={styles.categoryHeader}>
                                        <IconSymbol name="tag" size={20} color="#666" />
                                        <Text style={styles.categoryName}>{category.name}</Text>
                                        <Text style={styles.categoryCount}>
                                            {groupedProducts[categoryId].length}
                                        </Text>
                                    </View>

                                    {groupedProducts[categoryId].map(product => {
                                        // Получаем первую валидную строку изображения
                                        // images может быть массивом строк или объектов с path
                                        const firstImage = Array.isArray(product.images) && product.images.length > 0
                                            ? product.images[0]
                                            : null;
                                        
                                        // Извлекаем path из объекта или используем строку напрямую
                                        const imagePath = firstImage 
                                            ? (typeof firstImage === 'string' ? firstImage : firstImage.path)
                                            : null;
                                        
                                        const firstImageUrl = imagePath && typeof imagePath === 'string' && imagePath.length > 0
                                            ? getImageUrl(imagePath)
                                            : null;
                                        
                                        return (
                                            <TouchableOpacity
                                                key={product.id}
                                                style={styles.productCard}
                                                activeOpacity={0.7}
                                                onPress={() => handleProductPress(product.id)}
                                            >
                                                <View style={styles.productIcon}>
                                                    {firstImageUrl ? (
                                                        <Image
                                                            source={{ uri: firstImageUrl }}
                                                            style={styles.productImage}
                                                            resizeMode="cover"
                                                            onError={(e) => {
                                                                console.log('Image load error:', firstImageUrl, e.nativeEvent.error);
                                                            }}
                                                        />
                                                    ) : (
                                                        <View style={styles.productIconPlaceholder}>
                                                            <IconSymbol name="photo" size={24} color="#999" />
                                                        </View>
                                                    )}
                                                </View>
                                                
                                                <View style={styles.productInfo}>
                                                    <Text style={styles.productName}>{product.name}</Text>
                                                    <Text style={styles.productDescription} numberOfLines={1}>
                                                        {product.description}
                                                    </Text>
                                                </View>

                                                <IconSymbol name="chevron.right" color="#999" size={20} />
                                            </TouchableOpacity>
                                        );
                                    })}
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
        backgroundColor: '#f5f5f5',
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
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
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
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
        paddingTop: 8,
        paddingBottom: 40,
        paddingHorizontal: 0,
    },
    countText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
        paddingHorizontal: 16,
    },
    categorySection: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 8,
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
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    productIcon: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    productIconPlaceholder: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingHorizontal: 20,
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
    },
});
