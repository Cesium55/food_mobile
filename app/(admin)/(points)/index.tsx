import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useSellerMe } from "@/hooks/useSeller";
import { useShopPoints } from "@/hooks/useShopPoints";
import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function PointsScreen() {
    const { seller } = useSellerMe();
    const { shopPoints, loading, error } = useShopPoints(seller?.id);

    const handlePointPress = (pointId: number) => {
        router.push(`/(admin)/(points)/${pointId}`);
    };

    const handleAddPoint = () => {
        router.push('/(admin)/(points)/new');
    };

    if (loading) {
        return (
            <TabScreen title="Торговые точки">
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#666' }}>Загрузка данных...</Text>
                </View>
            </TabScreen>
        );
    }

    if (error) {
        return (
            <TabScreen title="Торговые точки">
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#ff3b30' }}>{error}</Text>
                </View>
            </TabScreen>
        );
    }

    return (
        <TabScreen title="Торговые точки">
            <View style={styles.container}>
                {/* Заголовок и кнопки */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Торговые точки сети
                    </Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddPoint}
                        >
                            <IconSymbol name="plus" size={20} color="#fff" />
                            <Text style={styles.addButtonText}>Добавить</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Список точек */}
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.countText}>
                        Всего точек: {shopPoints.length}
                    </Text>

                    {shopPoints.length > 0 && (
                        <View style={styles.pointsSection}>
                            {shopPoints.map((point) => (
                                <TouchableOpacity
                                    key={point.id}
                                    style={styles.pointRow}
                                    activeOpacity={0.7}
                                    onPress={() => handlePointPress(point.id)}
                                >
                                    <View style={styles.pointIcon}>
                                        <Text style={styles.pointIconText}>🏪</Text>
                                    </View>
                                    
                                    <View style={styles.pointInfo}>
                                        <Text style={styles.pointName}>Торговая точка #{point.id}</Text>
                                        {point.city && <Text style={styles.pointCity}>🏙️ {point.city}</Text>}
                                        <Text style={styles.pointAddress}>📍 {point.address_formated || point.address_raw}</Text>
                                    </View>

                                    <IconSymbol name="chevron.right" color="#999" size={20} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {shopPoints.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🏪</Text>
                            <Text style={styles.emptyText}>Нет торговых точек</Text>
                            <Text style={styles.emptySubtext}>
                                Нажмите "Добавить" чтобы создать первую точку
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eee',
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
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    filterButtonTextActive: {
        color: '#fff',
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
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
        paddingHorizontal: 0,
    },
    countText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    pointsSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    pointRow: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    pointIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pointIconText: {
        fontSize: 24,
    },
    pointInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    pointName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    pointCity: {
        fontSize: 13,
        color: '#007AFF',
        marginBottom: 4,
        fontWeight: '500',
    },
    pointAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    pointPhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    pointHours: {
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    modalScroll: {
        padding: 20,
    },
    cityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f9f9f9',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    cityOptionSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    cityOptionText: {
        fontSize: 16,
        color: '#000',
    },
    cityOptionTextSelected: {
        fontWeight: '600',
        color: '#007AFF',
    },
});
