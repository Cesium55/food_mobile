import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router } from "expo-router";
import { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface ShopPoint {
    id: number;
    shortName: string;
    fullName: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    phone: string;
    workingHours: string;
}

export default function PointsScreen() {
    // Демо-данные торговых точек
    const [points] = useState<ShopPoint[]>([
        {
            id: 1,
            shortName: "Свежесть",
            fullName: "Свежесть на Ленина",
            address: "ул. Ленина, 45",
            city: "Москва",
            latitude: 55.755819,
            longitude: 37.617644,
            phone: "+7 (495) 123-45-67",
            workingHours: "08:00 - 22:00",
        },
        {
            id: 2,
            shortName: "Свежесть",
            fullName: "Свежесть на Мира",
            address: "пр. Мира, 12",
            city: "Москва",
            latitude: 55.781908,
            longitude: 37.632771,
            phone: "+7 (495) 234-56-78",
            workingHours: "09:00 - 21:00",
        },
        {
            id: 3,
            shortName: "Свежесть",
            fullName: "Свежесть на Пушкина",
            address: "ул. Пушкина, 23",
            city: "Санкт-Петербург",
            latitude: 55.764393,
            longitude: 37.625212,
            phone: "+7 (812) 345-67-89",
            workingHours: "08:00 - 22:00",
        },
        {
            id: 4,
            shortName: "Свежесть",
            fullName: "Свежесть на Невском",
            address: "Невский пр., 120",
            city: "Санкт-Петербург",
            latitude: 59.931402,
            longitude: 30.360575,
            phone: "+7 (812) 456-78-90",
            workingHours: "09:00 - 21:00",
        },
        {
            id: 5,
            shortName: "Свежесть",
            fullName: "Свежесть на Красной",
            address: "ул. Красная, 78",
            city: "Казань",
            latitude: 55.796127,
            longitude: 49.106414,
            phone: "+7 (843) 567-89-01",
            workingHours: "08:00 - 22:00",
        },
        {
            id: 6,
            shortName: "Свежесть",
            fullName: "Свежесть на Баумана",
            address: "ул. Баумана, 34",
            city: "Казань",
            latitude: 55.789736,
            longitude: 49.122831,
            phone: "+7 (843) 678-90-12",
            workingHours: "09:00 - 21:00",
        },
    ]);

    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [showCityFilter, setShowCityFilter] = useState(false);

    // Получаем список уникальных городов
    const cities = Array.from(new Set(points.map(p => p.city))).sort();

    // Фильтруем точки по выбранному городу
    const filteredPoints = selectedCity
        ? points.filter(p => p.city === selectedCity)
        : points;

    const handlePointPress = (pointId: number) => {
        router.push(`/(admin)/(points)/${pointId}`);
    };

    const handleAddPoint = () => {
        router.push('/(admin)/(points)/new');
    };

    const handleCitySelect = (city: string | null) => {
        setSelectedCity(city);
        setShowCityFilter(false);
    };

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
                            style={[styles.filterButton, selectedCity && styles.filterButtonActive]}
                            onPress={() => setShowCityFilter(true)}
                        >
                            <IconSymbol name="filter" size={20} color={selectedCity ? "#fff" : "#007AFF"} />
                            <Text style={[styles.filterButtonText, selectedCity && styles.filterButtonTextActive]}>
                                {selectedCity || 'Город'}
                            </Text>
                        </TouchableOpacity>
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
                        {selectedCity 
                            ? `Точек в городе ${selectedCity}: ${filteredPoints.length} из ${points.length}`
                            : `Всего точек: ${points.length}`
                        }
                    </Text>

                    {filteredPoints.map((point) => (
                        <TouchableOpacity
                            key={point.id}
                            style={styles.pointCard}
                            activeOpacity={0.7}
                            onPress={() => handlePointPress(point.id)}
                        >
                            <View style={styles.pointIcon}>
                                <Text style={styles.pointIconText}>🏪</Text>
                            </View>
                            
                            <View style={styles.pointInfo}>
                                <Text style={styles.pointName}>{point.fullName}</Text>
                                <Text style={styles.pointCity}>🏙️ {point.city}</Text>
                                <Text style={styles.pointAddress}>📍 {point.address}</Text>
                                <Text style={styles.pointPhone}>📞 {point.phone}</Text>
                                <Text style={styles.pointHours}>🕒 {point.workingHours}</Text>
                            </View>

                            <IconSymbol name="chevron.right" color="#999" size={20} />
                        </TouchableOpacity>
                    ))}

                    {filteredPoints.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🏪</Text>
                            <Text style={styles.emptyText}>
                                {selectedCity ? `Нет точек в городе ${selectedCity}` : 'Нет торговых точек'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {selectedCity 
                                    ? 'Попробуйте выбрать другой город или сбросить фильтр'
                                    : 'Нажмите "Добавить" чтобы создать первую точку'
                                }
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Модальное окно фильтра по городам */}
                <Modal
                    visible={showCityFilter}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowCityFilter(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Фильтр по городу</Text>
                                <TouchableOpacity onPress={() => setShowCityFilter(false)}>
                                    <IconSymbol name="xmark" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalScroll}>
                                {/* Опция "Все города" */}
                                <TouchableOpacity
                                    style={[
                                        styles.cityOption,
                                        !selectedCity && styles.cityOptionSelected
                                    ]}
                                    onPress={() => handleCitySelect(null)}
                                >
                                    <Text style={[
                                        styles.cityOptionText,
                                        !selectedCity && styles.cityOptionTextSelected
                                    ]}>
                                        Все города
                                    </Text>
                                    {!selectedCity && (
                                        <IconSymbol name="checkmark" size={20} color="#007AFF" />
                                    )}
                                </TouchableOpacity>

                                {/* Список городов */}
                                {cities.map((city) => (
                                    <TouchableOpacity
                                        key={city}
                                        style={[
                                            styles.cityOption,
                                            selectedCity === city && styles.cityOptionSelected
                                        ]}
                                        onPress={() => handleCitySelect(city)}
                                    >
                                        <Text style={[
                                            styles.cityOptionText,
                                            selectedCity === city && styles.cityOptionTextSelected
                                        ]}>
                                            {city}
                                        </Text>
                                        {selectedCity === city && (
                                            <IconSymbol name="checkmark" size={20} color="#007AFF" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
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
        padding: 16,
        paddingBottom: 40,
    },
    countText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    pointCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
