import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOffers } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";
import { useShops } from "@/hooks/useShops";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewOfferScreen() {
    const { shopId } = useLocalSearchParams();
    const selectedShopId = typeof shopId === 'string' ? parseInt(shopId) : 0;
    const { shops } = useShops();
    const { products, loading: productsLoading } = useProducts();
    const { createOffer, refetch } = useOffers();

    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('0');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [description, setDescription] = useState('');
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedShop = shops.find(s => s.id === selectedShopId);
    const selectedProduct = products.find(p => p.id === selectedProductId);

    // Фильтрация товаров по поисковому запросу
    const filteredProducts = searchQuery.trim()
        ? products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : products;

    const handleCancel = () => {
        Alert.alert(
            "Отменить создание?",
            "Все введенные данные будут потеряны",
            [
                { text: "Продолжить", style: "cancel" },
                {
                    text: "Отменить",
                    style: "destructive",
                    onPress: () => router.back()
                }
            ]
        );
    };

    const handleCreate = async () => {
        // Валидация
        if (!selectedProductId) {
            Alert.alert("Ошибка", "Выберите товар");
            return;
        }
        if (!price || parseFloat(price) <= 0) {
            Alert.alert("Ошибка", "Укажите корректную цену");
            return;
        }
        if (!quantity || parseInt(quantity) <= 0) {
            Alert.alert("Ошибка", "Укажите корректное количество");
            return;
        }
        const discountNum = parseFloat(discount) || 0;
        if (discountNum < 0 || discountNum > 100) {
            Alert.alert("Ошибка", "Скидка должна быть от 0 до 100%");
            return;
        }
        if (!expiryDate) {
            Alert.alert("Ошибка", "Укажите срок годности");
            return;
        }

        const priceNum = parseFloat(price);
        const discountNumFinal = parseFloat(discount) || 0;
        const currentCost = priceNum - (priceNum * discountNumFinal / 100);

        // Форматируем дату для отображения
        const formattedDate = expiryDate.toISOString().split('T')[0];
        
        Alert.alert(
            "Создать предложение?",
            `Товар: ${selectedProduct?.name}\nЦена: ${priceNum.toFixed(2)} ₽\nСкидка: ${discountNumFinal}%\nЦена со скидкой: ${currentCost.toFixed(2)} ₽\nКоличество: ${quantity} шт.\nСрок годности: ${formattedDate}`,
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Создать",
                    onPress: async () => {
                        try {
                            setIsCreating(true);
                            
                            await createOffer({
                                product_id: selectedProductId,
                                shop_id: selectedShopId,
                                expires_date: expiryDate.toISOString().split('T')[0],
                                original_cost: priceNum,
                                current_cost: currentCost,
                                count: parseInt(quantity),
                                description: description.trim() || undefined,
                            });

                            // Обновляем список офферов
                            await refetch();

                            Alert.alert("Успех", "Предложение успешно создано");
                            router.back();
                        } catch (error: any) {
                            console.error('Ошибка создания оффера:', error);
                            Alert.alert(
                                "Ошибка",
                                error.message || "Не удалось создать предложение. Попробуйте еще раз."
                            );
                        } finally {
                            setIsCreating(false);
                        }
                    }
                }
            ]
        );
    };

    const getFinalPrice = () => {
        const priceNum = parseFloat(price) || 0;
        const discountNum = parseFloat(discount) || 0;
        return priceNum - (priceNum * discountNum / 100);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="arrow.left" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Новое предложение</Text>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                    {/* Торговая точка */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Торговая точка</Text>
                        {selectedShop ? (
                            <View style={styles.shopCard}>
                                <Text style={styles.shopName}>{selectedShop.name}</Text>
                                <Text style={styles.shopAddress}>{selectedShop.address}</Text>
                            </View>
                        ) : (
                            <Text style={styles.errorText}>Торговая точка не найдена</Text>
                        )}
                    </View>

                    {/* Выбор товара */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Товар *</Text>
                        {!showProductSelector ? (
                            <>
                                {selectedProduct ? (
                                    <View style={styles.selectedProductCard}>
                                        <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowProductSelector(true)}
                                            style={styles.changeButton}
                                        >
                                            <Text style={styles.changeButtonText}>Изменить</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowProductSelector(true)}
                                    >
                                        <IconSymbol name="plus" size={20} color="#007AFF" />
                                        <Text style={styles.selectButtonText}>Выбрать товар</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={styles.productSelector}>
                                <View style={styles.selectorHeader}>
                                    <Text style={styles.selectorTitle}>Выберите товар</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowProductSelector(false)}
                                        style={styles.closeSelectorButton}
                                    >
                                        <IconSymbol name="xmark" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                
                                {/* Поиск товаров */}
                                <View style={styles.searchContainer}>
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Поиск товара..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        placeholderTextColor="#999"
                                    />
                                    <IconSymbol name="magnifyingglass" size={20} color="#999" />
                                </View>

                                {productsLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#007AFF" />
                                        <Text style={styles.loadingText}>Загрузка товаров...</Text>
                                    </View>
                                ) : filteredProducts.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>
                                            {searchQuery ? 'Товары не найдены' : 'Нет доступных товаров'}
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView style={styles.productsList}>
                                        {filteredProducts.map(product => (
                                            <TouchableOpacity
                                                key={product.id}
                                                style={[
                                                    styles.productItem,
                                                    selectedProductId === product.id && styles.productItemSelected
                                                ]}
                                                onPress={() => {
                                                    setSelectedProductId(product.id);
                                                    setShowProductSelector(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                <View style={styles.productItemContent}>
                                                    <Text style={[
                                                        styles.productItemText,
                                                        selectedProductId === product.id && styles.productItemTextSelected
                                                    ]}>
                                                        {product.name}
                                                    </Text>
                                                    {product.description && (
                                                        <Text style={styles.productItemDescription} numberOfLines={1}>
                                                            {product.description}
                                                        </Text>
                                                    )}
                                                </View>
                                                {selectedProductId === product.id && (
                                                    <IconSymbol name="checkmark.circle.fill" size={24} color="#007AFF" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Основная информация */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Основная информация</Text>

                        {/* Цена */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Цена, ₽ *</Text>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                            />
                        </View>

                        {/* Скидка */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Скидка, %</Text>
                            <TextInput
                                style={styles.input}
                                value={discount}
                                onChangeText={setDiscount}
                                keyboardType="decimal-pad"
                                placeholder="0"
                            />
                        </View>

                        {/* Итоговая цена */}
                        {price && parseFloat(price) > 0 && (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Цена со скидкой</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={[styles.valueText, styles.finalPrice]}>
                                        {getFinalPrice().toFixed(2)} ₽
                                    </Text>
                                    {parseFloat(discount) > 0 && (
                                        <Text style={styles.savings}>
                                            Экономия: {(parseFloat(price) - getFinalPrice()).toFixed(2)} ₽
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Количество */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Количество, шт *</Text>
                            <TextInput
                                style={styles.input}
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="number-pad"
                                placeholder="0"
                            />
                        </View>

                        {/* Срок годности */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Срок годности *</Text>
                            <TouchableOpacity
                                style={styles.input}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.dateInputText,
                                    !expiryDate && styles.dateInputPlaceholder
                                ]}>
                                    {expiryDate 
                                        ? expiryDate.toLocaleDateString('ru-RU', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                          })
                                        : 'Выберите дату'
                                    }
                                </Text>
                            </TouchableOpacity>
                            <DateTimePickerModal
                                isVisible={showDatePicker}
                                mode="date"
                                onConfirm={(date) => {
                                    setExpiryDate(date);
                                    setShowDatePicker(false);
                                }}
                                onCancel={() => setShowDatePicker(false)}
                                minimumDate={new Date()}
                                date={expiryDate || new Date()}
                            />
                        </View>

                        {/* Описание */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Описание (необязательно)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Дополнительная информация о предложении"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Кнопка создания */}
                    <View style={styles.actionsSection}>
                        <TouchableOpacity
                            style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                            onPress={handleCreate}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <View style={styles.buttonLoading}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.createButtonText}>Создание...</Text>
                                </View>
                            ) : (
                                <Text style={styles.createButtonText}>Создать предложение</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        flex: 1,
        marginLeft: 12,
    },
    cancelButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '500',
    },
    scrollContent: {
        padding: 16,
    },
    infoSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    shopCard: {
        backgroundColor: '#FFF9E6',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE699',
    },
    shopName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    shopAddress: {
        fontSize: 13,
        color: '#666',
    },
    errorText: {
        fontSize: 14,
        color: '#FF3B30',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#007AFF',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    selectedProductCard: {
        backgroundColor: '#F0F8FF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#B3D9FF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedProductName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    changeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    changeButtonText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    productSelector: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        backgroundColor: '#fff',
        maxHeight: 400,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    selectorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    selectorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    closeSelectorButton: {
        padding: 4,
    },
    productsList: {
        maxHeight: 240,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    productItemContent: {
        flex: 1,
        marginRight: 12,
    },
    productItemDescription: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    productItemSelected: {
        backgroundColor: '#F0F8FF',
    },
    productItemText: {
        fontSize: 15,
        color: '#333',
    },
    productItemTextSelected: {
        fontWeight: '600',
        color: '#007AFF',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 80,
        paddingTop: 12,
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    dateInputText: {
        fontSize: 16,
        color: '#333',
    },
    dateInputPlaceholder: {
        color: '#999',
    },
    valueContainer: {
        paddingVertical: 4,
    },
    valueText: {
        fontSize: 16,
        color: '#333',
    },
    finalPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4CAF50',
    },
    savings: {
        fontSize: 13,
        color: '#4CAF50',
        marginTop: 4,
    },
    actionsSection: {
        marginTop: 8,
    },
    createButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    buttonLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

