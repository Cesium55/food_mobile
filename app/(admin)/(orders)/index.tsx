import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useShops } from "@/hooks/useShops";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Интерфейс заказа (из useOrders)
type ItemStatus = 'issued' | 'returned';
type OrderStatus = 'reserved' | 'paid' | 'issued' | 'completed' | 'returned' | 'partially_returned';

interface OrderItem {
    id: number;
    productName: string;
    quantity: number;
    price: string; // decimal формат
    shopName: string;
    status: ItemStatus; // Статус конкретного товара
}

interface Order {
    id: number;
    date: Date;
    status: OrderStatus; // Автоматически вычисляется на основе статусов товаров
    items: OrderItem[];
    totalAmount: number;
    discount: number;
    paymentMethod: 'card' | 'cash' | 'online';
    shopId: number;
    shopName: string;
    customerId: number;
    commission?: number; // Комиссия агрегатора (%)
}

type TimePeriod = 'today' | 'week' | 'month' | 'all';

export default function AdminOrdersScreen() {
    const { shops } = useShops();
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
    const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);

    // Функция вычисления статуса заказа на основе статусов товаров
    const calculateOrderStatus = (items: OrderItem[], baseStatus: OrderStatus): OrderStatus => {
        // Если заказ еще не выдан, возвращаем базовый статус
        if (baseStatus === 'reserved' || baseStatus === 'paid') {
            return baseStatus;
        }

        const issuedCount = items.filter(item => item.status === 'issued').length;
        const returnedCount = items.filter(item => item.status === 'returned').length;

        // Все товары возвращены
        if (returnedCount === items.length) {
            return 'returned';
        }

        // Часть товаров возвращена
        if (returnedCount > 0 && issuedCount > 0) {
            return 'partially_returned';
        }

        // Все товары выданы, деньги отправлены продавцу
        if (baseStatus === 'completed') {
            return 'completed';
        }

        // Все товары выданы, деньги еще не отправлены
        return 'issued';
    };

    // Демо-данные заказов (в реальном приложении - из API)
    const demoOrdersBase: Omit<Order, 'status'>[] = [
        {
            id: 1,
            date: new Date('2025-10-21T10:30:00'),
            items: [
                { id: 1, productName: 'Молоко пастеризованное 3.2%', quantity: 2, price: '89.90', shopName: 'ТЦ "Мега"', status: 'issued' },
                { id: 2, productName: 'Хлеб "Бородинский"', quantity: 1, price: '55.00', shopName: 'ТЦ "Мега"', status: 'issued' },
            ],
            totalAmount: 235.80,
            discount: 10,
            paymentMethod: 'card',
            shopId: 1,
            shopName: 'ТЦ "Мега" - Продукты',
            customerId: 1001,
            commission: 15,
        },
        {
            id: 2,
            date: new Date('2025-10-21T11:15:00'),
            items: [
                { id: 3, productName: 'Яйца куриные С1', quantity: 1, price: '119.00', shopName: 'ул. Ленина', status: 'issued' },
                { id: 4, productName: 'Сыр "Российский"', quantity: 1, price: '450.00', shopName: 'ул. Ленина', status: 'issued' },
            ],
            totalAmount: 569.00,
            discount: 0,
            paymentMethod: 'online',
            shopId: 2,
            shopName: 'ул. Ленина, 15 - Продукты',
            customerId: 1002,
            commission: 15,
        },
        {
            id: 3,
            date: new Date('2025-10-20T14:20:00'),
            items: [
                { id: 5, productName: 'Кофе молотый "Жокей"', quantity: 1, price: '320.00', shopName: 'пр. Мира', status: 'issued' },
            ],
            totalAmount: 320.00,
            discount: 0,
            paymentMethod: 'cash',
            shopId: 3,
            shopName: 'пр. Мира, 50 - Продукты',
            customerId: 1003,
            commission: 15,
        },
        {
            id: 4,
            date: new Date('2025-10-20T16:45:00'),
            items: [
                { id: 6, productName: 'Йогурт "Активия"', quantity: 3, price: '75.00', shopName: 'ТЦ "Мега"', status: 'returned' },
            ],
            totalAmount: 225.00,
            discount: 10,
            paymentMethod: 'card',
            shopId: 1,
            shopName: 'ТЦ "Мега" - Продукты',
            customerId: 1004,
            commission: 15,
        },
        {
            id: 5,
            date: new Date('2025-10-15T09:00:00'),
            items: [
                { id: 7, productName: 'Масло сливочное 82.5%', quantity: 1, price: '180.00', shopName: 'ТЦ "Мега"', status: 'issued' },
                { id: 8, productName: 'Вода минеральная', quantity: 2, price: '45.00', shopName: 'ул. Ленина', status: 'returned' },
            ],
            totalAmount: 270.00,
            discount: 0,
            paymentMethod: 'card',
            shopId: 2,
            shopName: 'ул. Ленина, 15 - Продукты',
            customerId: 1005,
            commission: 15,
        },
        {
            id: 6,
            date: new Date('2025-10-21T14:00:00'),
            items: [
                { id: 9, productName: 'Сметана 20%', quantity: 1, price: '95.00', shopName: 'ТЦ "Мега"', status: 'issued' },
            ],
            totalAmount: 95.00,
            discount: 0,
            paymentMethod: 'card',
            shopId: 1,
            shopName: 'ТЦ "Мега" - Продукты',
            customerId: 1006,
            commission: 15,
        },
    ];

    // Вычисляем статус для каждого заказа
    const demoOrders: Order[] = demoOrdersBase.map((order, index) => {
        let baseStatus: OrderStatus;
        
        // Определяем базовый статус для демо
        if (index === 0) baseStatus = 'completed'; // Заказ 1 - завершен (деньги отправлены)
        else if (index === 1) baseStatus = 'paid'; // Заказ 2 - оплачен, но еще не выдан
        else if (index === 5) baseStatus = 'reserved'; // Заказ 6 - забронирован
        else baseStatus = 'issued'; // Остальные - выданы
        
        return {
            ...order,
            status: calculateOrderStatus(order.items, baseStatus),
        };
    });

    // Фильтрация по времени
    const filterByTime = (order: Order): boolean => {
        const now = new Date();
        const orderDate = new Date(order.date);
        
        switch (selectedTimePeriod) {
            case 'today':
                return orderDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return orderDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return orderDate >= monthAgo;
            case 'all':
            default:
                return true;
        }
    };

    // Фильтрация заказов
    const filteredOrders = demoOrders.filter(order => {
        if (!filterByTime(order)) {
            return false;
        }
        if (selectedShopIds.length > 0 && !selectedShopIds.includes(order.shopId)) {
            return false;
        }
        return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleOrderPress = (orderId: number) => {
        router.push(`/(admin)/(orders)/${orderId}`);
    };

    const handleToggleShopFilter = (shopId: number) => {
        setSelectedShopIds(prev =>
            prev.includes(shopId)
                ? prev.filter(id => id !== shopId)
                : [...prev, shopId]
        );
    };

    const handleClearFilters = () => {
        setSelectedTimePeriod('all');
        setSelectedShopIds([]);
    };

    const hasActiveFilters = selectedTimePeriod !== 'all' || selectedShopIds.length > 0;

    const getStatusLabel = (status: OrderStatus) => {
        const labels: Record<OrderStatus, string> = {
            reserved: 'Забронирован',
            paid: 'Оплачен',
            issued: 'Выдан',
            completed: 'Завершен',
            returned: 'Возвращен',
            partially_returned: 'Частично возвращен',
        };
        return labels[status];
    };

    const getStatusColor = (status: OrderStatus) => {
        const colors: Record<OrderStatus, string> = {
            reserved: '#5AC8FA',       // Голубой
            paid: '#007AFF',           // Синий
            issued: '#FF9500',         // Оранжевый
            completed: '#4CAF50',      // Зеленый
            returned: '#FF3B30',       // Красный
            partially_returned: '#FF9500', // Оранжевый
        };
        return colors[status];
    };

    const getItemStatusLabel = (status: ItemStatus) => {
        return status === 'issued' ? 'Выдан' : 'Возвращен';
    };

    const getItemStatusColor = (status: ItemStatus) => {
        return status === 'issued' ? '#4CAF50' : '#FF3B30';
    };

    // Статистика
    const totalRevenue = filteredOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0);
    
    const totalCommission = filteredOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.totalAmount * ((o.commission || 0) / 100)), 0);

    return (
        <TabScreen title="Заказы">
            <View style={styles.container}>
                {/* Заголовок с кнопкой фильтров */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Заказы клиентов</Text>
                        <Text style={styles.headerSubtitle}>
                            Найдено: {filteredOrders.length} заказов
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                        onPress={() => setShowFilters(true)}
                    >
                        <IconSymbol name="filter" size={20} color={hasActiveFilters ? "#fff" : "#007AFF"} />
                        {hasActiveFilters && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>
                                    {(selectedTimePeriod !== 'all' ? 1 : 0) + selectedShopIds.length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Статистика */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Выручка (завершено)</Text>
                        <Text style={styles.statValue}>{totalRevenue.toFixed(2)} ₽</Text>
                        <Text style={styles.statSubtext}>
                            Комиссия: {totalCommission.toFixed(2)} ₽
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Завершено</Text>
                        <Text style={styles.statValue}>
                            {filteredOrders.filter(o => o.status === 'completed').length}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Активных</Text>
                        <Text style={styles.statValue}>
                            {filteredOrders.filter(o => 
                                o.status === 'reserved' || 
                                o.status === 'paid' || 
                                o.status === 'issued' ||
                                o.status === 'partially_returned'
                            ).length}
                        </Text>
                    </View>
                </View>

                {/* Список заказов */}
                <ScrollView style={styles.scrollView}>
                    {filteredOrders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Нет заказов</Text>
                            <Text style={styles.emptySubtext}>
                                {hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Заказы появятся здесь'}
                            </Text>
                        </View>
                    ) : (
                        filteredOrders.map(order => (
                            <TouchableOpacity
                                key={order.id}
                                style={styles.orderCard}
                                onPress={() => handleOrderPress(order.id)}
                            >
                                {/* Заголовок заказа */}
                                <View style={styles.orderHeader}>
                                    <View style={styles.orderHeaderLeft}>
                                        <Text style={styles.orderId}>Заказ #{order.id}</Text>
                                        <Text style={styles.orderDate}>
                                            {new Date(order.date).toLocaleDateString('ru-RU', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                                        <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                                    </View>
                                </View>

                                {/* Информация о заказе */}
                                <View style={styles.orderInfo}>
                                    <View style={styles.infoRow}>
                                        <IconSymbol name="person.fill" size={14} color="#666" />
                                        <Text style={styles.infoText}>Клиент ID: {order.customerId}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <IconSymbol name="map.pin.fill" size={14} color="#666" />
                                        <Text style={styles.infoText}>{order.shopName}</Text>
                                    </View>
                                </View>

                                {/* Товары */}
                                <View style={styles.orderItems}>
                                    {order.items.slice(0, 2).map((item, index) => (
                                        <View key={index} style={styles.itemRow}>
                                            <Text style={[
                                                styles.itemText,
                                                item.status === 'returned' && styles.itemTextReturned
                                            ]}>
                                                • {item.productName} × {item.quantity}
                                            </Text>
                                            {item.status === 'returned' && (
                                                <Text style={styles.returnedBadge}>Возвращен</Text>
                                            )}
                                        </View>
                                    ))}
                                    {order.items.length > 2 && (
                                        <Text style={styles.moreItems}>
                                            +{order.items.length - 2} ещё
                                        </Text>
                                    )}
                                </View>

                                {/* Итого */}
                                <View style={styles.orderFooter}>
                                    <Text style={styles.orderTotal}>{order.totalAmount.toFixed(2)} ₽</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                    <View style={{ height: 20 }} />
                </ScrollView>
            </View>

            {/* Модальное окно фильтров */}
            <Modal
                visible={showFilters}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFilters(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFilters(false)}
                >
                    <TouchableOpacity
                        style={styles.filterModal}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Заголовок модалки */}
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>Фильтры</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <IconSymbol name="xmark" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.filterContent}>
                            {/* Фильтр по времени */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Период</Text>
                                <View style={styles.timePeriodButtons}>
                                    {[
                                        { value: 'today' as TimePeriod, label: 'Сегодня' },
                                        { value: 'week' as TimePeriod, label: 'Неделя' },
                                        { value: 'month' as TimePeriod, label: 'Месяц' },
                                        { value: 'all' as TimePeriod, label: 'Все время' },
                                    ].map((period) => (
                                        <TouchableOpacity
                                            key={period.value}
                                            style={[
                                                styles.timePeriodButton,
                                                selectedTimePeriod === period.value && styles.timePeriodButtonActive
                                            ]}
                                            onPress={() => setSelectedTimePeriod(period.value)}
                                        >
                                            <Text style={[
                                                styles.timePeriodButtonText,
                                                selectedTimePeriod === period.value && styles.timePeriodButtonTextActive
                                            ]}>
                                                {period.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Фильтр по торговым точкам */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Торговые точки</Text>
                                {shops.map(shop => (
                                    <TouchableOpacity
                                        key={shop.id}
                                        style={styles.filterItem}
                                        onPress={() => handleToggleShopFilter(shop.id)}
                                    >
                                        <View style={styles.filterItemLeft}>
                                            <Text style={styles.filterItemName}>{shop.shortName}</Text>
                                            <Text style={styles.filterItemSubtitle}>{shop.address}</Text>
                                        </View>
                                        <View style={[
                                            styles.checkbox,
                                            selectedShopIds.includes(shop.id) && styles.checkboxChecked
                                        ]}>
                                            {selectedShopIds.includes(shop.id) && (
                                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Кнопки действий */}
                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClearFilters}
                            >
                                <Text style={styles.clearButtonText}>Очистить</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setShowFilters(false)}
                            >
                                <Text style={styles.applyButtonText}>Применить</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: '#fff',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    statSubtext: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
    },
    orderCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderHeaderLeft: {
        flex: 1,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 13,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    orderInfo: {
        marginBottom: 12,
        gap: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    orderItems: {
        marginBottom: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    itemTextReturned: {
        color: '#999',
        textDecorationLine: 'line-through',
    },
    returnedBadge: {
        fontSize: 11,
        color: '#FF3B30',
        backgroundColor: '#FFE5E5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontWeight: '600',
    },
    moreItems: {
        fontSize: 13,
        color: '#007AFF',
        fontStyle: 'italic',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    orderTotal: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    // Стили модального окна
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    filterModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    filterContent: {
        maxHeight: 400,
    },
    filterSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    timePeriodButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    timePeriodButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#fff',
    },
    timePeriodButtonActive: {
        backgroundColor: '#007AFF',
    },
    timePeriodButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    timePeriodButtonTextActive: {
        color: '#fff',
    },
    filterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    filterItemLeft: {
        flex: 1,
    },
    filterItemName: {
        fontSize: 15,
        color: '#333',
        marginBottom: 2,
    },
    filterItemSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    clearButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    applyButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

