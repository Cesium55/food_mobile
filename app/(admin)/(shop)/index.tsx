import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useSellerMe } from "@/hooks/useSeller";
import { deleteSellerImage, ImageFile, uploadSellerImage } from "@/utils/imageUpload";
import { getFirstImageUrl } from "@/utils/imageUtils";
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ShopScreen() {
    // Режим редактирования
    const [isEditing, setIsEditing] = useState(false);
    
    // Загрузка данных из API
    const { seller, loading, error } = useSellerMe();
    
    // Локальное состояние для редактируемых полей
    const [fullName, setFullName] = useState("");
    const [shortName, setShortName] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [currentImageId, setCurrentImageId] = useState<number | null>(null);
    const [newImageFile, setNewImageFile] = useState<ImageFile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [hasChanges, setHasChanges] = useState(false);

    // Обновляем локальное состояние при загрузке данных
    useFocusEffect(
        useCallback(() => {
            if (seller) {
                setFullName(seller.full_name);
                setShortName(seller.short_name);
                setDescription(seller.description);
                const firstImage = seller.images && seller.images.length > 0 
                    ? seller.images.sort((a, b) => a.order - b.order)[0]
                    : null;
                const firstImageUrl = firstImage ? getFirstImageUrl(seller.images) : null;
                setImageUrl(firstImageUrl);
                setCurrentImageId(firstImage?.id || null);
                setNewImageFile(null);
                setHasChanges(false);
            }
        }, [seller])
    );

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
                        if (seller) {
                            setFullName(seller.full_name);
                            setShortName(seller.short_name);
                            setDescription(seller.description);
                            const firstImage = seller.images && seller.images.length > 0 
                                ? seller.images.sort((a, b) => a.order - b.order)[0]
                                : null;
                            const firstImageUrl = firstImage ? getFirstImageUrl(seller.images) : null;
                            setImageUrl(firstImageUrl);
                            setCurrentImageId(firstImage?.id || null);
                            setNewImageFile(null);
                        }
                        setIsEditing(false);
                        setHasChanges(false);
                        setIsUploading(false);
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!seller) return;

        setIsUploading(true);
        try {
            // Если изображение было удалено (было изображение, но теперь нет)
            if (!imageUrl && currentImageId && !newImageFile) {
                const deleted = await deleteSellerImage(currentImageId);
                if (deleted) {
                    setCurrentImageId(null);
                } else {
                    Alert.alert("Ошибка", "Не удалось удалить изображение");
                    setIsUploading(false);
                    return;
                }
            }
            
            // Если есть новое изображение, загружаем его
            if (newImageFile) {
                // Если есть старое изображение, удаляем его перед загрузкой нового
                if (currentImageId) {
                    await deleteSellerImage(currentImageId);
                }
                
                // Загружаем новое изображение
                const uploadedImage = await uploadSellerImage(seller.id, newImageFile, 0);
                if (uploadedImage) {
                    setCurrentImageId(uploadedImage.id);
                    setImageUrl(getFirstImageUrl([uploadedImage]));
                    setNewImageFile(null);
                } else {
                    Alert.alert("Ошибка", "Не удалось загрузить изображение");
                    setIsUploading(false);
                    return;
                }
            }

            // TODO: Сохранить другие поля (fullName, shortName, description) через API
            // Пока просто показываем успех
            Alert.alert(
                "Сохранение",
                "Изменения сохранены успешно!",
                [{ 
                    text: "OK",
                    onPress: () => {
                        setIsEditing(false);
                        setHasChanges(false);
                    }
                }]
            );
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            Alert.alert("Ошибка", "Не удалось сохранить изменения");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageChange = async () => {
        if (!isEditing) return;
        
        // Запрашиваем разрешение на доступ к медиатеке
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                "Доступ запрещен",
                "Для изменения логотипа необходимо разрешение на доступ к медиатеке."
            );
            return;
        }

        Alert.alert(
            "Изменить логотип",
            imageUrl ? "Выберите действие" : "Выберите изображение",
            [
                { text: "Отмена", style: "cancel" },
                ...(imageUrl ? [{
                    text: "Удалить",
                    style: "destructive" as const,
                    onPress: () => {
                        Alert.alert(
                            "Удалить логотип",
                            "Вы уверены, что хотите удалить текущий логотип?",
                            [
                                { text: "Отмена", style: "cancel" },
                                {
                                    text: "Удалить",
                                    style: "destructive" as const,
                                    onPress: () => {
                                        setImageUrl(null);
                                        setCurrentImageId(null);
                                        setNewImageFile(null);
                                        setHasChanges(true);
                                    }
                                }
                            ]
                        );
                    }
                }] : []),
                {
                    text: "Выбрать из галереи",
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsMultipleSelection: false,
                            quality: 0.8,
                        });

                        if (!result.canceled && result.assets && result.assets.length > 0) {
                            const asset = result.assets[0];
                            const imageFile: ImageFile = {
                                uri: asset.uri,
                                type: asset.mimeType || 'image/jpeg',
                                name: asset.fileName || `logo_${Date.now()}.jpg`,
                            };
                            setNewImageFile(imageFile);
                            setImageUrl(asset.uri);
                            setHasChanges(true);
                        }
                    }
                }
            ]
        );
    };

    const handleFieldChange = (setter: (value: string) => void) => {
        return (value: string) => {
            setter(value);
            setHasChanges(true);
        };
    };

    if (loading) {
        return (
            <TabScreen title="Управление магазином">
                <View style={[styles.container, styles.centered]}>
                    <Text style={styles.loadingText}>Загрузка данных...</Text>
                </View>
            </TabScreen>
        );
    }

    if (error || !seller) {
        return (
            <TabScreen title="Управление магазином">
                <View style={[styles.container, styles.centered]}>
                    <Text style={styles.errorText}>{error || 'Ошибка загрузки данных'}</Text>
                </View>
            </TabScreen>
        );
    }

    return (
        <TabScreen title="Управление магазином">
            <View style={styles.container}>
                {/* Кнопка редактирования/отмены */}
                <View style={styles.header}>
                    {!isEditing ? (
                        <TouchableOpacity 
                            style={styles.editButton}
                            onPress={handleEdit}
                        >
                            <IconSymbol name="pencil" size={20} color="#007AFF" />
                            <Text style={styles.editButtonText}>Редактировать</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Отмена</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    {/* Блок с изображением */}
                    <View style={styles.imageSection}>
                        <Text style={styles.sectionTitle}>Логотип торговой сети</Text>
                        <TouchableOpacity 
                            style={[
                                styles.imageContainer,
                                !isEditing && styles.imageContainerDisabled
                            ]}
                            onPress={handleImageChange}
                            disabled={!isEditing}
                        >
                            {imageUrl ? (
                                <Image 
                                    source={{ uri: imageUrl }}
                                    style={styles.image}
                                />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <IconSymbol name="bag.fill" size={60} color="#ccc" />
                                </View>
                            )}
                            {isEditing && (
                                <View style={styles.imageOverlay}>
                                    <IconSymbol name="camera" size={24} color="#fff" />
                                    <Text style={styles.imageOverlayText}>
                                        {imageUrl ? 'Изменить' : 'Добавить'}
                                    </Text>
                                </View>
                            )}
                            {isEditing && imageUrl && (
                                <TouchableOpacity
                                    style={styles.deleteImageButton}
                                    onPress={() => {
                                        Alert.alert(
                                            "Удалить логотип",
                                            "Вы уверены, что хотите удалить текущий логотип?",
                                            [
                                                { text: "Отмена", style: "cancel" },
                                                {
                                                    text: "Удалить",
                                                    style: "destructive" as const,
                                                    onPress: () => {
                                                        setImageUrl(null);
                                                        setCurrentImageId(null);
                                                        setNewImageFile(null);
                                                        setHasChanges(true);
                                                    }
                                                }
                                            ]
                                        );
                                    }}
                                >
                                    <IconSymbol name="trash" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Редактируемые поля */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Основная информация</Text>
                        
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Полное название</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={handleFieldChange(setFullName)}
                                    placeholder="Введите полное название"
                                    autoCapitalize="words"
                                />
                            ) : (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{fullName}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Короткое название</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={shortName}
                                    onChangeText={handleFieldChange(setShortName)}
                                    placeholder="Введите короткое название"
                                    autoCapitalize="words"
                                />
                            ) : (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{shortName}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Описание</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={handleFieldChange(setDescription)}
                                    placeholder="Введите описание"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            ) : (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{description || 'Не указано'}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Только для чтения поля (скрыты в режиме редактирования) */}
                    {!isEditing && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Дополнительная информация</Text>
                            
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.email}</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Телефон</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.phone || 'Не указан'}</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Баланс</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.balance.toFixed(2)} ₽</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>ИНН</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.inn}</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>ОГРН</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.ogrn}</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Тип организации</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.is_IP ? 'ИП' : 'ООО'}</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Статус</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>
                                        {seller.status === 0 ? 'Неактивен' : 
                                         seller.status === 1 ? 'Активен' : 
                                         seller.status === 2 ? 'Заблокирован' : 'Неизвестен'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Уровень верификации</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.verification_level}</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>ID продавца</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.id}</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Master ID</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.master_id || 'Не указан'}</Text>
                                </View>
                            </View>

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>URL регистрационного документа</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{seller.registration_doc_url || 'Не указан'}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Кнопка сохранения (только в режиме редактирования) */}
                    {isEditing && (
                        <>
                            <TouchableOpacity 
                                style={[
                                    styles.saveButton,
                                    (!hasChanges || isUploading) && styles.saveButtonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={!hasChanges || isUploading}
                            >
                                {isUploading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>
                                        {hasChanges ? "Сохранить изменения" : "Нет изменений"}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {hasChanges && (
                                <View style={styles.changesIndicator}>
                                    <Text style={styles.changesIndicatorText}>
                                        ⚠️ Есть несохраненные изменения
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </View>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#ff3b30',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    editButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    imageContainer: {
        position: 'relative',
        width: 150,
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#ddd',
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainerDisabled: {
        opacity: 0.8,
    },
    imagePlaceholder: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    imageOverlayText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    deleteImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 59, 48, 0.9)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
    textArea: {
        minHeight: 100,
        paddingTop: 12,
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
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
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
        marginTop: 16,
        alignItems: 'center',
    },
    changesIndicatorText: {
        color: '#856404',
        fontSize: 14,
        fontWeight: '600',
    },
});
