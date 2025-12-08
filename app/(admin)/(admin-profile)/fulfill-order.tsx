import { TabScreen } from "@/components/TabScreen";
import { FulfillItemRequest, fulfillPurchase, verifyToken, VerifyTokenItem } from "@/services/orderService";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type FulfillmentStatus = "fulfilled" | "partially_fulfilled" | "unfulfilled";

interface ItemFulfillment {
    purchase_offer_id: number;
    offer_id: number;
    quantity: number;
    fulfilled_quantity: number;
    fulfillment_status: string;
    product_name: string;
    shop_point_id: number;
    cost_at_purchase: number;
    // Локальное состояние для формы
    selectedStatus: FulfillmentStatus;
    inputQuantity: string;
}

export default function FulfillOrderScreen() {
    const params = useLocalSearchParams<{ token?: string }>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [orderData, setOrderData] = useState<{
        purchase_id: number;
        status: string;
        items: VerifyTokenItem[];
        total_cost: number;
    } | null>(null);
    const [items, setItems] = useState<ItemFulfillment[]>([]);

    useEffect(() => {
        const loadOrderData = async () => {
            if (!params.token) {
                Alert.alert("Ошибка", "Токен не найден");
                router.back();
                return;
            }

            try {
                setLoading(true);
                const data = await verifyToken(params.token);
                setOrderData(data);

                // Инициализируем состояние для каждого товара
                const initializedItems: ItemFulfillment[] = data.items.map((item) => ({
                    ...item,
                    selectedStatus: "fulfilled" as FulfillmentStatus,
                    inputQuantity: item.quantity.toString(),
                }));
                setItems(initializedItems);
            } catch (error: any) {
                console.error("Ошибка загрузки данных заказа:", error);
                Alert.alert("Ошибка", error.message || "Не удалось загрузить данные заказа");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadOrderData();
    }, [params.token]);

    const handleStatusChange = (index: number, status: FulfillmentStatus) => {
        const updatedItems = [...items];
        updatedItems[index].selectedStatus = status;
        
        // Если статус "unfulfilled", сбрасываем количество
        if (status === "unfulfilled") {
            updatedItems[index].inputQuantity = "0";
        } else if (status === "fulfilled") {
            // Если полностью выдан, ставим полное количество
            updatedItems[index].inputQuantity = updatedItems[index].quantity.toString();
        }
        
        setItems(updatedItems);
    };

    const handleQuantityChange = (index: number, value: string) => {
        const updatedItems = [...items];
        const numValue = parseInt(value, 10);
        
        if (isNaN(numValue) || numValue < 0) {
            updatedItems[index].inputQuantity = "0";
        } else if (numValue > updatedItems[index].quantity) {
            updatedItems[index].inputQuantity = updatedItems[index].quantity.toString();
        } else {
            updatedItems[index].inputQuantity = value;
        }
        
        // Автоматически обновляем статус на основе количества
        if (numValue === 0) {
            updatedItems[index].selectedStatus = "unfulfilled";
        } else if (numValue === updatedItems[index].quantity) {
            updatedItems[index].selectedStatus = "fulfilled";
        } else {
            updatedItems[index].selectedStatus = "partially_fulfilled";
        }
        
        setItems(updatedItems);
    };

    const handleSubmit = async () => {
        if (!orderData) return;

        // Валидация
        const hasAnyFulfilled = items.some(
            (item) => parseInt(item.inputQuantity, 10) > 0
        );

        if (!hasAnyFulfilled) {
            Alert.alert("Внимание", "Необходимо выдать хотя бы один товар");
            return;
        }

        try {
            setSubmitting(true);

            // Формируем данные для отправки
            const fulfillItems: FulfillItemRequest[] = items.map((item) => {
                const fulfilledQty = parseInt(item.inputQuantity, 10);
                let status = "fulfilled";
                let unfulfilledReason: string | undefined;

                if (fulfilledQty === 0) {
                    status = "unfulfilled";
                    unfulfilledReason = "Товар не выдан";
                } else if (fulfilledQty < item.quantity) {
                    status = "partially_fulfilled";
                    unfulfilledReason = `Выдано ${fulfilledQty} из ${item.quantity}`;
                }

                return {
                    purchase_offer_id: item.purchase_offer_id,
                    offer_id: item.offer_id,
                    status,
                    fulfilled_quantity: fulfilledQty,
                    unfulfilled_reason: unfulfilledReason,
                };
            });

            const result = await fulfillPurchase(orderData.purchase_id, {
                items: fulfillItems,
            });

            // Обрабатываем результат
            const allFulfilled = result.fulfilled_items.every(
                (item) => item.status === "fulfilled"
            );
            const someFulfilled = result.fulfilled_items.some(
                (item) => item.fulfilled_quantity > 0
            );

            if (allFulfilled) {
                Alert.alert(
                    "Успешно",
                    "Все товары успешно выданы",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace('/(admin)/(admin-profile)'),
                        },
                    ]
                );
            } else if (someFulfilled) {
                Alert.alert(
                    "Частично выполнено",
                    "Некоторые товары выданы. Проверьте детали.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace('/(admin)/(admin-profile)'),
                        },
                    ]
                );
            } else {
                Alert.alert(
                    "Ошибка",
                    "Не удалось выдать товары",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace('/(admin)/(admin-profile)'),
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error("Ошибка выдачи заказа:", error);
            Alert.alert("Ошибка", error.message || "Не удалось выполнить выдачу заказа");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <TabScreen title="Выдача заказа" showBackButton={true}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Загрузка данных заказа...</Text>
                </View>
            </TabScreen>
        );
    }

    if (!orderData) {
        return (
            <TabScreen title="Выдача заказа" showBackButton={true}>
                <View style={styles.container}>
                    <Text style={styles.errorText}>Данные заказа не найдены</Text>
                </View>
            </TabScreen>
        );
    }

    return (
        <TabScreen title="Выдача заказа" showBackButton={true}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Информация о заказе */}
                <View style={styles.orderInfoSection}>
                    <Text style={styles.sectionTitle}>Информация о заказе</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Номер заказа:</Text>
                        <Text style={styles.infoValue}>#{orderData.purchase_id}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Статус:</Text>
                        <Text style={styles.infoValue}>{orderData.status}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Сумма заказа:</Text>
                        <Text style={styles.infoValue}>{orderData.total_cost.toFixed(2)} ₽</Text>
                    </View>
                </View>

                {/* Список товаров */}
                <View style={styles.itemsSection}>
                    <Text style={styles.sectionTitle}>Товары для выдачи</Text>
                    {items.map((item, index) => (
                        <View key={item.purchase_offer_id} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemName}>{item.product_name}</Text>
                                <Text style={styles.itemCost}>
                                    {item.cost_at_purchase.toFixed(2)} ₽
                                </Text>
                            </View>
                            <Text style={styles.itemQuantity}>
                                Количество: {item.quantity} шт.
                            </Text>
                            <Text style={styles.itemQuantity}>
                                Уже выдано: {item.fulfilled_quantity} шт.
                            </Text>

                            {/* Статус выдачи */}
                            <View style={styles.statusSection}>
                                <Text style={styles.statusLabel}>Статус выдачи:</Text>
                                <View style={styles.statusButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusButton,
                                            item.selectedStatus === "fulfilled" &&
                                                styles.statusButtonActive,
                                        ]}
                                        onPress={() => handleStatusChange(index, "fulfilled")}
                                    >
                                        <Text
                                            style={[
                                                styles.statusButtonText,
                                                item.selectedStatus === "fulfilled" &&
                                                    styles.statusButtonTextActive,
                                            ]}
                                        >
                                            Полностью
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusButton,
                                            item.selectedStatus === "partially_fulfilled" &&
                                                styles.statusButtonActive,
                                        ]}
                                        onPress={() =>
                                            handleStatusChange(index, "partially_fulfilled")
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.statusButtonText,
                                                item.selectedStatus === "partially_fulfilled" &&
                                                    styles.statusButtonTextActive,
                                            ]}
                                        >
                                            Частично
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusButton,
                                            item.selectedStatus === "unfulfilled" &&
                                                styles.statusButtonActive,
                                        ]}
                                        onPress={() => handleStatusChange(index, "unfulfilled")}
                                    >
                                        <Text
                                            style={[
                                                styles.statusButtonText,
                                                item.selectedStatus === "unfulfilled" &&
                                                    styles.statusButtonTextActive,
                                            ]}
                                        >
                                            Не выдан
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Количество для выдачи */}
                            {item.selectedStatus !== "unfulfilled" && (
                                <View style={styles.quantitySection}>
                                    <Text style={styles.quantityLabel}>
                                        Количество к выдаче:
                                    </Text>
                                    <TextInput
                                        style={styles.quantityInput}
                                        value={item.inputQuantity}
                                        onChangeText={(value) => handleQuantityChange(index, value)}
                                        keyboardType="numeric"
                                        editable={item.selectedStatus !== "fulfilled"}
                                    />
                                    <Text style={styles.quantityHint}>
                                        Максимум: {item.quantity} шт.
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Кнопка отправки */}
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Подтвердить выдачу</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    scrollContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    errorText: {
        fontSize: 16,
        color: "#F44336",
        textAlign: "center",
        marginTop: 32,
    },
    orderInfoSection: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: "#666",
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    itemsSection: {
        marginBottom: 16,
    },
    itemCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        flex: 1,
    },
    itemCost: {
        fontSize: 16,
        fontWeight: "600",
        color: "#4CAF50",
    },
    itemQuantity: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    statusSection: {
        marginTop: 12,
        marginBottom: 12,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    statusButtons: {
        flexDirection: "row",
        gap: 8,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
        alignItems: "center",
    },
    statusButtonActive: {
        backgroundColor: "#4CAF50",
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    statusButtonTextActive: {
        color: "#fff",
    },
    quantitySection: {
        marginTop: 12,
    },
    quantityLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#fff",
    },
    quantityHint: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: "#4CAF50",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 16,
        marginBottom: 32,
    },
    submitButtonDisabled: {
        backgroundColor: "#999",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});












