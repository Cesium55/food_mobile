import { IconSymbol } from "@/components/ui/icon-symbol";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ItemStatus = 'issued' | 'returned';
type OrderStatus = 'reserved' | 'paid' | 'issued' | 'completed' | 'returned' | 'partially_returned';

interface OrderItem {
    id: number;
    productName: string;
    quantity: number;
    price: string; // decimal формат
    shopName: string;
    status: ItemStatus;
}

interface Order {
    id: number;
    date: Date;
    status: OrderStatus;
    items: OrderItem[];
    totalAmount: number;
    discount: number;
    paymentMethod: 'card' | 'cash' | 'online';
    shopId: number;
    shopName: string;
    customerId: number;
    commission?: number;
}

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams();
    const orderId = typeof id === 'string' ? parseInt(id) : 0;

    // Функция вычисления статуса заказа на основе статусов товаров
    const calculateOrderStatus = (items: OrderItem[], baseStatus: OrderStatus): OrderStatus => {
        if (baseStatus === 'reserved' || baseStatus === 'paid') {
            return baseStatus;
        }

        const issuedCount = items.filter(item => item.status === 'issued').length;
        const returnedCount = items.filter(item => item.status === 'returned').length;

        if (returnedCount === items.length) {
            return 'returned';
        }

        if (returnedCount > 0 && issuedCount > 0) {
            return 'partially_returned';
        }

        if (baseStatus === 'completed') {
            return 'completed';
        }

        return 'issued';
    };

    // Демо-данные всех заказов (копия из index.tsx)
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
    const allOrders: Order[] = demoOrdersBase.map((orderData, index) => {
        let baseStatus: OrderStatus;
        
        // Определяем базовый статус для демо
        if (index === 0) baseStatus = 'completed'; // Заказ 1 - завершен (деньги отправлены)
        else if (index === 1) baseStatus = 'paid'; // Заказ 2 - оплачен, но еще не выдан
        else if (index === 5) baseStatus = 'reserved'; // Заказ 6 - забронирован
        else baseStatus = 'issued'; // Остальные - выданы
        
        return {
            ...orderData,
            status: calculateOrderStatus(orderData.items, baseStatus),
        };
    });

    // Находим заказ по ID
    const initialOrder = allOrders.find(o => o.id === orderId) || allOrders[0];
    
    // Демо-данные заказа
    const [order, setOrder] = useState<Order>(initialOrder);

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
            reserved: '#5AC8FA',
            paid: '#007AFF',
            issued: '#FF9500',
            completed: '#4CAF50',
            returned: '#FF3B30',
            partially_returned: '#FF9500',
        };
        return colors[status];
    };

    const getItemStatusLabel = (status: ItemStatus) => {
        return status === 'issued' ? 'Выдан' : 'Возвращен';
    };

    const getItemStatusColor = (status: ItemStatus) => {
        return status === 'issued' ? '#4CAF50' : '#FF3B30';
    };

    const subtotal = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const discountAmount = subtotal * (order.discount / 100);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="arrow.left" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Заказ #{order.id}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Статус */}
                <View style={styles.infoSection}>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(order.status) }]}>
                            <Text style={styles.statusTextLarge}>{getStatusLabel(order.status)}</Text>
                        </View>
                    </View>
                </View>

                {/* Дата и время */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Дата и время</Text>
                    <Text style={styles.infoText}>
                        {new Date(order.date).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>

                {/* Информация о клиенте */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Клиент</Text>
                    <View style={styles.infoRow}>
                        <IconSymbol name="person.fill" size={16} color="#666" />
                        <Text style={styles.infoText}>ID: {order.customerId}</Text>
                    </View>
                </View>

                {/* Торговая точка */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Торговая точка</Text>
                    <View style={styles.infoRow}>
                        <IconSymbol name="map.pin.fill" size={16} color="#666" />
                        <Text style={styles.infoText}>{order.shopName}</Text>
                    </View>
                </View>

                {/* Товары */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Товары</Text>
                    {order.items.map((item, index) => (
                        <View
                            key={index} 
                            style={[
                                styles.itemCard,
                                item.status === 'returned' && styles.itemCardReturned
                            ]}
                        >
                            <View style={styles.itemLeft}>
                                <Text style={[
                                    styles.itemName,
                                    item.status === 'returned' && styles.itemNameReturned
                                ]}>
                                    {item.productName}
                                </Text>
                                <Text style={styles.itemQuantity}>Количество: {item.quantity} шт</Text>
                                <View style={[
                                    styles.itemStatusBadge,
                                    { backgroundColor: getItemStatusColor(item.status) }
                                ]}>
                                    <Text style={styles.itemStatusText}>
                                        {getItemStatusLabel(item.status)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.itemRight}>
                                <Text style={styles.itemPrice}>{item.price} ₽</Text>
                                <Text style={[
                                    styles.itemTotal,
                                    item.status === 'returned' && styles.itemTotalReturned
                                ]}>
                                    {(parseFloat(item.price) * item.quantity).toFixed(2)} ₽
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Итого */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Сумма товаров:</Text>
                        <Text style={styles.totalValue}>{subtotal.toFixed(2)} ₽</Text>
                    </View>
                    {order.discount > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Скидка ({order.discount}%):</Text>
                            <Text style={[styles.totalValue, styles.discountValue]}>
                                -{discountAmount.toFixed(2)} ₽
                            </Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabelFinal}>Итого:</Text>
                        <Text style={styles.totalValueFinal}>{order.totalAmount.toFixed(2)} ₽</Text>
                    </View>
                    
                    {order.commission && order.status === 'completed' && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Комиссия агрегатора ({order.commission}%):</Text>
                                <Text style={[styles.totalValue, styles.commissionValue]}>
                                    {(order.totalAmount * (order.commission / 100)).toFixed(2)} ₽
                                </Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabelFinal}>К выплате продавцу:</Text>
                                <Text style={[styles.totalValueFinal, styles.finalPayoutValue]}>
                                    {(order.totalAmount * (1 - order.commission / 100)).toFixed(2)} ₽
                                </Text>
                            </View>
                        </>
                    )}
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
    scrollContent: {
        padding: 16,
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
        textAlign: 'center',
    },
    infoSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    sectionHint: {
        fontSize: 13,
        color: '#999',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadgeLarge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    statusTextLarge: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
    },
    infoText: {
        fontSize: 15,
        color: '#333',
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 4,
    },
    itemCardReturned: {
        backgroundColor: '#FFF5F5',
    },
    itemLeft: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    itemNameReturned: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    itemQuantity: {
        fontSize: 13,
        color: '#666',
        marginBottom: 6,
    },
    itemStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    itemStatusText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '700',
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    itemPrice: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    itemTotalReturned: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    totalSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 15,
        color: '#666',
    },
    totalValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    discountValue: {
        color: '#4CAF50',
    },
    commissionValue: {
        color: '#FF9500',
    },
    finalPayoutValue: {
        color: '#4CAF50',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 12,
    },
    totalLabelFinal: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    totalValueFinal: {
        fontSize: 22,
        fontWeight: '700',
        color: '#007AFF',
    },
});

