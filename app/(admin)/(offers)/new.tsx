import { StandardModal } from "@/components/ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOffers } from "@/hooks/useOffers";
import { usePricingStrategies } from "@/hooks/usePricingStrategies";
import { useProducts } from "@/hooks/useProducts";
import { useSellerMe } from "@/hooks/useSeller";
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

interface NewOfferScreenProps {
    shopId?: number;
    onClose?: () => void;
}

export function NewOfferContent({ shopId: shopIdProp, onClose }: NewOfferScreenProps) {
    const { shopId } = useLocalSearchParams();
    const initialShopId = shopIdProp ?? (typeof shopId === 'string' ? parseInt(shopId) : 0);
    const { seller } = useSellerMe();
    const { shops } = useShops(seller?.id);
    const { products, loading: productsLoading } = useProducts(seller?.id);
    const { createOffer, refetch } = useOffers();
    const { strategies, loading: strategiesLoading } = usePricingStrategies();

    const [selectedShopId, setSelectedShopId] = useState<number>(initialShopId);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [pricingMode, setPricingMode] = useState<'fixed' | 'strategy'>('fixed');
    const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('0');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [description, setDescription] = useState('');
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [showStrategyPicker, setShowStrategyPicker] = useState(false);
    const [showShopSelector, setShowShopSelector] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [shopSearchQuery, setShopSearchQuery] = useState('');

    const selectedShop = shops.find(s => s.id === selectedShopId);
    const selectedProduct = products.find(p => p.id === selectedProductId);

    // Фильтрация товаров по поисковому запросу
    const filteredProducts = searchQuery.trim()
        ? products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : products;

    // Фильтрация магазинов по поисковому запросу
    const filteredShops = shopSearchQuery.trim()
        ? shops.filter(s => 
            s.name.toLowerCase().includes(shopSearchQuery.toLowerCase()) ||
            (s.address && s.address.toLowerCase().includes(shopSearchQuery.toLowerCase()))
        )
        : shops;

    const handleClose = onClose ?? (() => router.back());

    const handleCancel = () => {
        Alert.alert(
            "Отменить создание?",
            "Все введенные данные будут потеряны",
            [
                { text: "Продолжить", style: "cancel" },
                {
                    text: "Отменить",
                    style: "destructive",
                    onPress: handleClose
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
        if (!quantity || parseInt(quantity) <= 0) {
            Alert.alert("Ошибка", "Укажите корректное количество");
            return;
        }
        if (!expiryDate) {
            Alert.alert("Ошибка", "Укажите срок годности");
            return;
        }

        // Валидация в зависимости от режима ценообразования
        if (pricingMode === 'fixed') {
            if (!price || parseFloat(price) <= 0) {
                Alert.alert("Ошибка", "Укажите корректную цену");
                return;
            }
            const discountNum = parseFloat(discount) || 0;
            if (discountNum < 0 || discountNum > 100) {
                Alert.alert("Ошибка", "Скидка должна быть от 0 до 100%");
                return;
            }
        } else {
            if (!selectedStrategyId) {
                Alert.alert("Ошибка", "Выберите стратегию ценообразования");
                return;
            }
            // Для динамического ценообразования нужна базовая цена (original_cost)
            if (!price || parseFloat(price) <= 0) {
                Alert.alert("Ошибка", "Укажите базовую цену для расчета динамической цены");
                return;
            }
        }

        const priceNum = parseFloat(price) || 0;
        const discountNumFinal = parseFloat(discount) || 0;
        const currentCostNum = pricingMode === 'fixed' 
            ? priceNum - (priceNum * discountNumFinal / 100)
            : null;
        const currentCost = currentCostNum !== null ? currentCostNum.toFixed(2) : null;

        // Форматируем дату для отображения
        const formattedDate = expiryDate.toISOString().split('T')[0];
        
        const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);
        const pricingInfo = pricingMode === 'fixed'
            ? `Цена: ${priceNum.toFixed(2)} ₽\nСкидка: ${discountNumFinal}%\nЦена со скидкой: ${currentCost} ₽`
            : `Стратегия: ${selectedStrategy?.name || 'Не выбрана'}\nЦена будет рассчитываться автоматически`;
        
        Alert.alert(
            "Создать предложение?",
            `Товар: ${selectedProduct?.name}\n${pricingInfo}\nКоличество: ${quantity} шт.\nСрок годности: ${formattedDate}`,
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Создать",
                    onPress: async () => {
                        try {
                            setIsCreating(true);
                            
                            // Устанавливаем время конца дня для выбранной даты (23:59:59)
                            const expiryDateTime = new Date(expiryDate);
                            expiryDateTime.setHours(23, 59, 59, 999);
                            
                            await createOffer({
                                product_id: selectedProductId,
                                shop_id: selectedShopId,
                                expires_date: expiryDateTime.toISOString(), // Передаем полный datetime с часовым поясом
                                original_cost: priceNum.toFixed(2), // Всегда передаем базовую цену (для динамического ценообразования это базовая цена, от которой считаются скидки)
                                current_cost: pricingMode === 'fixed' ? currentCost : null, // Для динамического ценообразования current_cost должен быть null
                                pricing_strategy_id: pricingMode === 'strategy' ? selectedStrategyId : null,
                                count: parseInt(quantity),
                                description: description.trim() || undefined,
                            });

                            // Обновляем список офферов
                            await refetch();

                            Alert.alert("Успех", "Предложение успешно создано");
                            handleClose();
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
        <View style={styles.modalContainer}>
                {/* Заголовок */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Новое предложение</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    nestedScrollEnabled={true}
                >
                        {/* Торговая точка */}
                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Торговая точка *</Text>
                            {!showShopSelector ? (
                                <>
                                    {selectedShop ? (
                                        <TouchableOpacity
                                            style={styles.shopCard}
                                            onPress={() => setShowShopSelector(true)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.shopCardContent}>
                                                <Text style={styles.shopName}>{selectedShop.name}</Text>
                                                {selectedShop.address && (
                                                    <Text style={styles.shopAddress}>{selectedShop.address}</Text>
                                                )}
                                            </View>
                                            <IconSymbol name="chevron.right" size={20} color="#666" />
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.selectButton}
                                            onPress={() => setShowShopSelector(true)}
                                        >
                                            <IconSymbol name="mappin.circle.fill" size={20} color="#007AFF" />
                                            <Text style={styles.selectButtonText}>Выбрать торговую точку</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            ) : (
                                <View style={styles.shopSelector}>
                                    <View style={styles.selectorHeader}>
                                        <Text style={styles.selectorTitle}>Выберите торговую точку</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowShopSelector(false)}
                                            style={styles.closeSelectorButton}
                                        >
                                            <IconSymbol name="xmark" size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    
                                    {/* Поиск магазинов */}
                                    <View style={styles.searchContainer}>
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Поиск торговой точки..."
                                            value={shopSearchQuery}
                                            onChangeText={setShopSearchQuery}
                                            placeholderTextColor="#999"
                                        />
                                        <IconSymbol name="magnifyingglass" size={20} color="#999" />
                                    </View>

                                    {filteredShops.length === 0 ? (
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>
                                                {shopSearchQuery ? 'Торговые точки не найдены' : 'Нет доступных торговых точек'}
                                            </Text>
                                        </View>
                                    ) : (
                                        <ScrollView 
                                            style={styles.shopsList}
                                            nestedScrollEnabled={true}
                                            showsVerticalScrollIndicator={true}
                                        >
                                            {filteredShops.map(shop => (
                                                <TouchableOpacity
                                                    key={shop.id}
                                                    style={[
                                                        styles.shopItem,
                                                        selectedShopId === shop.id && styles.shopItemSelected
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedShopId(shop.id);
                                                        setShowShopSelector(false);
                                                        setShopSearchQuery('');
                                                    }}
                                                >
                                                    <View style={styles.shopItemContent}>
                                                        <Text style={[
                                                            styles.shopItemText,
                                                            selectedShopId === shop.id && styles.shopItemTextSelected
                                                        ]}>
                                                            {shop.name}
                                                        </Text>
                                                        {shop.address && (
                                                            <Text style={styles.shopItemAddress} numberOfLines={1}>
                                                                {shop.address}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    {selectedShopId === shop.id && (
                                                        <IconSymbol name="checkmark.circle.fill" size={24} color="#007AFF" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
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
                                    <ScrollView 
                                        style={styles.productsList}
                                        nestedScrollEnabled={true}
                                        showsVerticalScrollIndicator={true}
                                    >
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

                        {/* Режим ценообразования */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Режим ценообразования *</Text>
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity
                                    style={[
                                        styles.segment,
                                        pricingMode === 'fixed' && styles.segmentActive
                                    ]}
                                    onPress={() => {
                                        setPricingMode('fixed');
                                        setSelectedStrategyId(null);
                                    }}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        pricingMode === 'fixed' && styles.segmentTextActive
                                    ]}>
                                        Фиксированная цена
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.segment,
                                        pricingMode === 'strategy' && styles.segmentActive
                                    ]}
                                    onPress={() => {
                                        setPricingMode('strategy');
                                        setPrice('');
                                        setDiscount('0');
                                    }}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        pricingMode === 'strategy' && styles.segmentTextActive
                                    ]}>
                                        Стратегия
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Поля для фиксированной цены */}
                        {pricingMode === 'fixed' && (
                            <>
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
                            </>
                        )}

                        {/* Поля для стратегии */}
                        {pricingMode === 'strategy' && (
                            <>
                                {/* Базовая цена для динамического ценообразования */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Базовая цена, ₽ *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#999"
                                    />
                                    <Text style={styles.hintText}>
                                        Базовая цена, от которой будут рассчитываться скидки по стратегии
                                    </Text>
                                </View>

                                {/* Выбор стратегии */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Стратегия ценообразования *</Text>
                                    {!showStrategyPicker ? (
                                        <TouchableOpacity
                                            style={styles.strategyInputContainer}
                                            onPress={() => setShowStrategyPicker(true)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.strategyInputText,
                                                !selectedStrategyId && styles.strategyInputPlaceholder
                                            ]}>
                                                {selectedStrategyId
                                                    ? strategies.find(s => s.id === selectedStrategyId)?.name || 'Не выбрана'
                                                    : 'Выберите стратегию'
                                                }
                                            </Text>
                                            <IconSymbol name="chevron.down" size={20} color="#666" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.strategySelector}>
                                            <View style={styles.selectorHeader}>
                                                <Text style={styles.selectorTitle}>Выберите стратегию</Text>
                                                <TouchableOpacity
                                                    onPress={() => setShowStrategyPicker(false)}
                                                    style={styles.closeSelectorButton}
                                                >
                                                    <IconSymbol name="xmark" size={20} color="#666" />
                                                </TouchableOpacity>
                                            </View>
                                            {strategiesLoading ? (
                                                <View style={styles.loadingContainer}>
                                                    <ActivityIndicator size="small" color="#007AFF" />
                                                    <Text style={styles.loadingText}>Загрузка стратегий...</Text>
                                                </View>
                                            ) : strategies.length === 0 ? (
                                                <View style={styles.emptyContainer}>
                                                    <Text style={styles.emptyText}>Нет доступных стратегий</Text>
                                                </View>
                                            ) : (
                                                <ScrollView 
                                                    style={styles.strategiesList}
                                                    nestedScrollEnabled={true}
                                                    showsVerticalScrollIndicator={true}
                                                >
                                                    {strategies.map(strategy => (
                                                        <TouchableOpacity
                                                            key={strategy.id}
                                                            style={[
                                                                styles.strategyItem,
                                                                selectedStrategyId === strategy.id && styles.strategyItemSelected
                                                            ]}
                                                            onPress={() => {
                                                                setSelectedStrategyId(strategy.id);
                                                                setShowStrategyPicker(false);
                                                            }}
                                                        >
                                                            <View style={styles.strategyItemContent}>
                                                                <Text style={[
                                                                    styles.strategyItemText,
                                                                    selectedStrategyId === strategy.id && styles.strategyItemTextSelected
                                                                ]}>
                                                                    {strategy.name}
                                                                </Text>
                                                                <Text style={styles.strategyItemSteps}>
                                                                    {strategy.steps.length} шаг{strategy.steps.length !== 1 ? 'ов' : ''}
                                                                </Text>
                                                            </View>
                                                            {selectedStrategyId === strategy.id && (
                                                                <IconSymbol name="checkmark.circle.fill" size={24} color="#007AFF" />
                                                            )}
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            )}
                                        </View>
                                    )}
                                </View>

                                {/* Информация о динамическом ценообразовании */}
                                {selectedStrategyId && price && parseFloat(price) > 0 && (
                                    <View style={styles.dynamicPricingInfo}>
                                        <IconSymbol name="info.circle" size={20} color="#007AFF" />
                                        <Text style={styles.dynamicPricingText}>
                                            Цена будет рассчитываться автоматически на основе базовой цены ({parseFloat(price).toFixed(2)} ₽) и выбранной стратегии
                                        </Text>
                                    </View>
                                )}
                            </>
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
        </View>
    );
}

export default function NewOfferScreen(props: NewOfferScreenProps) {
    const handleClose = props.onClose ?? (() => router.back());

    return (
        <StandardModal visible onClose={handleClose}>
            <NewOfferContent {...props} onClose={handleClose} />
        </StandardModal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
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
        borderBottomColor: '#d0d0d0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        flex: 1,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 0,
        paddingVertical: 16,
    },
    infoSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 0,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#d0d0d0',
        marginBottom: 0,
        marginHorizontal: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    shopCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shopCardContent: {
        flex: 1,
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
    shopSelector: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        backgroundColor: '#fff',
        maxHeight: 400,
    },
    shopsList: {
        maxHeight: 240,
    },
    shopItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    shopItemSelected: {
        backgroundColor: '#F5F7FA',
    },
    shopItemContent: {
        flex: 1,
        marginRight: 12,
    },
    shopItemText: {
        fontSize: 15,
        color: '#333',
    },
    shopItemTextSelected: {
        fontWeight: '600',
        color: '#007AFF',
    },
    shopItemAddress: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
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
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
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
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
        backgroundColor: '#F5F7FA',
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
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
        gap: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentActive: {
        backgroundColor: '#007AFF',
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    segmentTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    strategySelector: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        backgroundColor: '#fff',
        maxHeight: 300,
    },
    strategiesList: {
        maxHeight: 240,
    },
    strategyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    strategyItemSelected: {
        backgroundColor: '#F5F7FA',
    },
    strategyItemContent: {
        flex: 1,
        marginRight: 12,
    },
    strategyItemText: {
        fontSize: 15,
        color: '#333',
    },
    strategyItemTextSelected: {
        fontWeight: '600',
        color: '#007AFF',
    },
    strategyItemSteps: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    strategyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    strategyInputText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    strategyInputPlaceholder: {
        color: '#999',
    },
    dynamicPricingInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    dynamicPricingText: {
        flex: 1,
        fontSize: 13,
        color: '#007AFF',
        lineHeight: 18,
    },
    hintText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
});

