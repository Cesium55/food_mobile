import { IconSymbol } from "@/components/ui/icon-symbol";
import { router } from "expo-router";
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

export default function NewPointScreen() {
    const [fullName, setFullName] = useState("");
    const [shortName, setShortName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [workingHours, setWorkingHours] = useState("");
    const [latitude, setLatitude] = useState("55.755819");
    const [longitude, setLongitude] = useState("37.617644");
    const [images, setImages] = useState<string[]>([]);

    const handleAddImage = () => {
        Alert.alert(
            "Добавить фото",
            "В реальном приложении здесь откроется галерея",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Добавить фото",
                    onPress: () => {
                        // Просто добавляем пустую строку - цвет будет назначен автоматически
                        setImages([...images, '']);
                    }
                }
            ]
        );
    };

    const handleRemoveImage = (index: number) => {
        Alert.alert(
            "Удалить фото",
            "Вы уверены, что хотите удалить это фото?",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Удалить",
                    style: "destructive",
                    onPress: () => {
                        setImages(images.filter((_, i) => i !== index));
                    }
                }
            ]
        );
    };

    const handleSave = () => {
        if (!fullName || !address) {
            Alert.alert("Ошибка", "Заполните обязательные поля: Полное название и Адрес");
            return;
        }

        Alert.alert(
            "Создание точки",
            `Торговая точка "${fullName}" успешно создана!\n(Демонстрационный режим)`,
            [{ 
                text: "OK",
                onPress: () => router.back()
            }]
        );
    };

    const handleCancel = () => {
        Alert.alert(
            "Отмена",
            "Вы уверены, что хотите отменить создание точки?",
            [
                { text: "Нет", style: "cancel" },
                {
                    text: "Да",
                    style: "destructive",
                    onPress: () => router.back()
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerBackButton}
                    onPress={handleCancel}
                >
                    <IconSymbol name="arrow.left" color="#333" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Новая торговая точка
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {/* Галерея изображений */}
                <View style={styles.gallerySection}>
                    <Text style={styles.sectionTitle}>Фотографии точки</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.galleryScroll}
                    >
                        {images.map((imageUrl, index) => {
                            // Массив приятных пастельных цветов
                            const colors = ['#81C784', '#64B5F6', '#FFB74D', '#BA68C8', '#F06292', '#4DD0E1', '#AED581', '#FFD54F'];
                            const backgroundColor = colors[index % colors.length];
                            
                            return (
                                <View key={index} style={styles.imageWrapper}>
                                    <View 
                                        style={[styles.galleryImage, { backgroundColor }]}
                                    >
                                        <Text style={styles.imagePlaceholderText}>📸</Text>
                                        <Text style={styles.imageNumberText}>Фото {index + 1}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.removeImageButton}
                                        onPress={() => handleRemoveImage(index)}
                                    >
                                        <IconSymbol name="trash" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                        
                        <TouchableOpacity 
                            style={styles.addImageButton}
                            onPress={handleAddImage}
                        >
                            <IconSymbol name="plus" size={32} color="#999" />
                            <Text style={styles.addImageText}>Добавить фото</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Информация о точке */}
                <View style={styles.infoSection}>
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Полное название *</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Свежесть на Ленина"
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Короткое название</Text>
                        <TextInput
                            style={styles.input}
                            value={shortName}
                            onChangeText={setShortName}
                            placeholder="Свежесть"
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Адрес *</Text>
                        <TextInput
                            style={styles.input}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="ул. Ленина, 45"
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Телефон</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+7 (495) 123-45-67"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Часы работы</Text>
                        <TextInput
                            style={styles.input}
                            value={workingHours}
                            onChangeText={setWorkingHours}
                            placeholder="08:00 - 22:00"
                        />
                    </View>

                    <View style={styles.coordinatesSection}>
                        <Text style={styles.label}>Координаты</Text>
                        <View style={styles.coordinatesRow}>
                            <View style={styles.coordinateField}>
                                <Text style={styles.coordinateLabel}>Широта</Text>
                                <TextInput
                                    style={styles.input}
                                    value={latitude}
                                    onChangeText={setLatitude}
                                    placeholder="55.755819"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={styles.coordinateField}>
                                <Text style={styles.coordinateLabel}>Долгота</Text>
                                <TextInput
                                    style={styles.input}
                                    value={longitude}
                                    onChangeText={setLongitude}
                                    placeholder="37.617644"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                    </View>

                    <Text style={styles.hint}>* - обязательные поля</Text>
                </View>

                {/* Кнопки действий */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Создать торговую точку</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelButtonText}>Отмена</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerBackButton: {
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    gallerySection: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    galleryScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    imageWrapper: {
        position: 'relative',
    },
    galleryImage: {
        width: 300,
        height: 200,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 48,
        marginBottom: 8,
    },
    imageNumberText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 59, 48, 0.9)',
        borderRadius: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImageButton: {
        width: 300,
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    addImageText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
    infoSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    coordinatesSection: {
        marginBottom: 20,
    },
    coordinatesRow: {
        flexDirection: 'row',
        gap: 12,
    },
    coordinateField: {
        flex: 1,
    },
    coordinateLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    hint: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    actionsSection: {
        backgroundColor: '#fff',
        padding: 16,
    },
    saveButton: {
        backgroundColor: '#34C759',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
});

