import { IconSymbol } from "@/components/ui/icon-symbol";
import { useShopPoint } from "@/hooks/useShopPoints";
import { getImageUrl } from "@/utils/imageUtils";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PointDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const pointId = Number(id);
    const { shopPoint, loading, error } = useShopPoint(pointId);

    // Режим редактирования
    const [isEditing, setIsEditing] = useState(false);

    const [hasChanges, setHasChanges] = useState(false);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.headerBackButton}
                        onPress={() => router.back()}
                    >
                        <IconSymbol name="arrow.left" color="#333" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Загрузка...</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#666' }}>Загрузка данных...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !shopPoint) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.headerBackButton}
                        onPress={() => router.back()}
                    >
                        <IconSymbol name="arrow.left" color="#333" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ошибка</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#ff3b30' }}>{error || 'Торговая точка не найдена'}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        Alert.alert(
            "Отмена",
            "Отменить все несохраненные изменения?",
            [
                { text: "Нет", style: "cancel" },
                {
                    text: "Да",
                    style: "destructive",
                    onPress: () => {
                        setIsEditing(false);
                        setHasChanges(false);
                    }
                }
            ]
        );
    };

    const handleSave = () => {
        Alert.alert(
            "Сохранение",
            "Изменения сохранены успешно!\n(Демонстрационный режим)",
            [{ 
                text: "OK",
                onPress: () => {
                    setIsEditing(false);
                    setHasChanges(false);
                }
            }]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            "Удаление торговой точки",
            `Вы уверены, что хотите удалить эту торговую точку?\n\nЭто действие нельзя отменить.`,
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Удалить",
                    style: "destructive",
                    onPress: () => {
                        // TODO: реализовать удаление через API
                        setTimeout(() => {
                            Alert.alert("Успех", "Торговая точка удалена");
                            router.back();
                        }, 100);
                    }
                }
            ]
        );
    };

    const handleAddImage = () => {
        if (!isEditing) return;
        
        Alert.alert(
            "Добавить фото",
            "В реальном приложении здесь откроется галерея",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Добавить фото",
                    onPress: () => {
                        // TODO: реализовать загрузку фото
                        setHasChanges(true);
                    }
                }
            ]
        );
    };

    const handleRemoveImage = (index: number) => {
        if (!isEditing) return;
        
        Alert.alert(
            "Удалить фото",
            "Вы уверены, что хотите удалить это фото?",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Удалить",
                    style: "destructive",
                    onPress: () => {
                        // TODO: реализовать удаление фото через API
                        setHasChanges(true);
                    }
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
                    onPress={() => router.back()}
                >
                    <IconSymbol name="arrow.left" color="#333" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    Торговая точка #{shopPoint.id}
                </Text>
                {!isEditing ? (
                    <TouchableOpacity 
                        style={styles.headerEditButton}
                        onPress={handleEdit}
                    >
                        <IconSymbol name="pencil" size={20} color="#007AFF" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={styles.headerCancelButton}
                        onPress={handleCancel}
                    >
                        <Text style={styles.headerCancelText}>Отмена</Text>
                    </TouchableOpacity>
                )}
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
                        {(shopPoint.images || []).map((imageItem, index) => {
                            const imageUrl = getImageUrl(imageItem.path);
                            const hasImage = !!imageUrl;
                            
                            return (
                                <View key={imageItem.id || index} style={styles.imageWrapper}>
                                    {hasImage ? (
                                        <Image
                                            source={{ uri: imageUrl! }}
                                            style={styles.galleryImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View 
                                            style={[styles.galleryImage, styles.galleryImagePlaceholder]}
                                        >
                                            <Text style={styles.imagePlaceholderText}>📸</Text>
                                            <Text style={styles.imageNumberText}>Фото {index + 1}</Text>
                                        </View>
                                    )}
                                    {isEditing && (
                                        <TouchableOpacity 
                                            style={styles.removeImageButton}
                                            onPress={() => handleRemoveImage(index)}
                                        >
                                            <IconSymbol name="trash" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                        
                        {isEditing && (
                            <TouchableOpacity 
                                style={styles.addImageButton}
                                onPress={handleAddImage}
                            >
                                <IconSymbol name="plus" size={32} color="#999" />
                                <Text style={styles.addImageText}>Добавить фото</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                {/* Информация о точке */}
                <View style={styles.infoSection}>
                    {/* Адрес */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Адрес</Text>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueText}>📍 {shopPoint.address_formated || shopPoint.address_raw}</Text>
                        </View>
                    </View>

                    {/* Город */}
                    {shopPoint.city && (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Город</Text>
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>🏙️ {shopPoint.city}</Text>
                            </View>
                        </View>
                    )}

                    {/* Координаты */}
                    <View style={styles.coordinatesSection}>
                        <Text style={styles.label}>Координаты</Text>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueText}>
                                🌍 {shopPoint.latitude.toFixed(6)}, {shopPoint.longitude.toFixed(6)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Кнопки действий в режиме редактирования */}
                {isEditing && (
                    <View style={styles.actionsSection}>
                        <TouchableOpacity 
                            style={[
                                styles.saveButton,
                                !hasChanges && styles.saveButtonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={!hasChanges}
                        >
                            <Text style={styles.saveButtonText}>
                                {hasChanges ? "Сохранить изменения" : "Нет изменений"}
                            </Text>
                        </TouchableOpacity>

                        {hasChanges && (
                            <View style={styles.changesIndicator}>
                                <Text style={styles.changesIndicatorText}>
                                    ⚠️ Есть несохраненные изменения
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={handleDelete}
                        >
                            <IconSymbol name="trash" size={20} color="#fff" />
                            <Text style={styles.deleteButtonText}>Удалить точку</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
    headerEditButton: {
        padding: 8,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
    },
    headerCancelButton: {
        padding: 8,
    },
    headerCancelText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: '600',
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
    },
    galleryImagePlaceholder: {
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
    valueContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    valueText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
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
    actionsSection: {
        backgroundColor: '#fff',
        padding: 16,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    changesIndicator: {
        backgroundColor: '#FFF3CD',
        borderColor: '#FFC107',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    changesIndicatorText: {
        color: '#856404',
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButton: {
        flexDirection: 'row',
        backgroundColor: '#ff3b30',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

