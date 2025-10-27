import { IconSymbol } from "@/components/ui/icon-symbol";
import { useShops } from "@/hooks/useShops";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Демо список товаров (в реальном приложении - из API или useProducts hook)
const demoProducts = [
    { id: 1, name: 'Молоко пастеризованное 3.2%' },
    { id: 2, name: 'Хлеб "Бородинский"' },
    { id: 3, name: 'Яйца куриные С1' },
    { id: 4, name: 'Сыр "Российский"' },
    { id: 5, name: 'Кофе молотый "Жокей"' },
    { id: 6, name: 'Йогурт "Активия"' },
    { id: 7, name: 'Масло сливочное 82.5%' },
    { id: 8, name: 'Сметана 20%' },
    { id: 9, name: 'Творог 9%' },
    { id: 10, name: 'Кефир 3.2%' },
];

export default function NewOfferScreen() {
    const { shopId } = useLocalSearchParams();
    const selectedShopId = typeof shopId === 'string' ? parseInt(shopId) : 0;
    const { shops } = useShops();

    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('0');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [showProductSelector, setShowProductSelector] = useState(false);

    const selectedShop = shops.find(s => s.id === selectedShopId);
    const selectedProduct = demoProducts.find(p => p.id === selectedProductId);

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

    const handleCreate = () => {
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

        Alert.alert(
            "Создать предложение?",
            "Предложение будет добавлено в торговую точку",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Создать",
                    onPress: () => {
                        // В реальном приложении - API запрос
                        Alert.alert("Успех", "Предложение создано");
                        router.back();
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
                                <ScrollView style={styles.productsList}>
                                    {demoProducts.map(product => (
                                        <TouchableOpacity
                                            key={product.id}
                                            style={[
                                                styles.productItem,
                                                selectedProductId === product.id && styles.productItemSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedProductId(product.id);
                                                setShowProductSelector(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.productItemText,
                                                selectedProductId === product.id && styles.productItemTextSelected
                                            ]}>
                                                {product.name}
                                            </Text>
                                            {selectedProductId === product.id && (
                                                <IconSymbol name="checkmark" size={20} color="#007AFF" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
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
                            <TextInput
                                style={styles.input}
                                value={expiryDate}
                                onChangeText={setExpiryDate}
                                placeholder="ГГГГ-ММ-ДД"
                            />
                            <Text style={styles.hint}>Формат: ГГГГ-ММ-ДД (например, 2025-12-31)</Text>
                        </View>
                    </View>

                    {/* Кнопка создания */}
                    <View style={styles.actionsSection}>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleCreate}
                        >
                            <Text style={styles.createButtonText}>Создать предложение</Text>
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
        maxHeight: 300,
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
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
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
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

