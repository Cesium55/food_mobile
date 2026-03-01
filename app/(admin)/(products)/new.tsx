import { ScreenWrapper } from "@/components/screen/ScreenWrapper";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { API_ENDPOINTS } from "@/constants/api";
import { getApiUrl } from "@/constants/env";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useSellerMe } from "@/hooks/useSeller";
import { authFetch } from "@/utils/authFetch";
import { ImageFile, uploadProductImagesBatch } from "@/utils/imageUpload";
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface NewProductScreenProps {
    onClose?: () => void;
}

export function NewProductContent({ onClose }: NewProductScreenProps) {
    const { seller } = useSellerMe();
    const { categories, getCategoryById, getCategoryPath } = useCategories();
    const { refetch } = useProducts(seller?.id);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [categoryIds, setCategoryIds] = useState<number[]>([]); // Массив ID категорий
    const [images, setImages] = useState<ImageFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    // Характеристики (можно удалять любые)
    const [characteristics, setCharacteristics] = useState<{ [key: string]: string }>({
        'Вес/Объем': '',
        'Производитель': '',
        'Страна': '',
        'Срок хранения': '',
        'Условия хранения': '',
    });
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]); // Раскрытые категории (для подкатегорий)
    
    // Модальное окно для добавления характеристики
    const [showAddCharModal, setShowAddCharModal] = useState(false);
    const [newCharName, setNewCharName] = useState('');

    const handleAddImage = async () => {
        // Запрашиваем разрешение на доступ к медиатеке
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                "Доступ запрещен",
                "Для добавления фотографий необходимо разрешение на доступ к медиатеке."
            );
            return;
        }

        // Открываем галерею для выбора изображений
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            const newImages: ImageFile[] = result.assets.map((asset: any) => ({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `image_${Date.now()}.jpg`,
            }));
            setImages([...images, ...newImages]);
        }
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

    // Маппинг русских названий характеристик на английские slug'и
    const getCharacteristicSlug = (name: string): string => {
        const slugMap: { [key: string]: string } = {
            'Вес/Объем': 'weight-volume',
            'Производитель': 'manufacturer',
            'Страна': 'country',
            'Срок хранения': 'shelf-life',
            'Условия хранения': 'storage-conditions',
        };

        // Если есть маппинг, используем его
        if (slugMap[name]) {
            return slugMap[name];
        }

        // Иначе генерируем slug из названия (транслитерация не требуется, просто приводим к нижнему регистру и заменяем пробелы)
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const handleClose = onClose ?? (() => router.back());

    const handleSave = async () => {
        if (!name || !description) {
            Alert.alert("Ошибка", "Заполните обязательные поля: Название и Описание");
            return;
        }

        if (categoryIds.length === 0) {
            Alert.alert("Ошибка", "Выберите хотя бы одну категорию");
            return;
        }

        // Преобразуем characteristics в формат attributes для API
        const attributes = Object.entries(characteristics)
            .filter(([key, value]) => value.trim() !== '') // Убираем пустые характеристики
            .map(([key, value]) => ({
                slug: getCharacteristicSlug(key),
                name: key,
                value: value,
            }));

        // Формируем данные товара для отправки на сервер (согласно схеме API)
        const productData = {
            name: name.trim(),
            description: description.trim(),
            category_ids: categoryIds,
            attributes: attributes,
        };

        // Логируем все данные товара
        console.log('📦 ===== ДАННЫЕ ТОВАРА ДЛЯ СОЗДАНИЯ =====');
        console.log('Название:', productData.name);
        console.log('Описание:', productData.description);
        console.log('Категории (ID):', productData.category_ids);
        console.log('Характеристики (attributes):', productData.attributes);
        console.log('📦 ===== ПОЛНЫЙ ОБЪЕКТ ДАННЫХ =====');
        console.log(JSON.stringify(productData, null, 2));
        console.log('📦 ====================================');

        try {
            // Отправляем данные на сервер
            const response = await authFetch(getApiUrl(API_ENDPOINTS.PRODUCTS.BASE), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
                requireAuth: true,
            });

            // Проверяем успешный ответ (authFetch автоматически следует за редиректами)
            if (response.ok) {
                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    // Если ответ не JSON, это нормально
                    data = null;
                }
                
                console.log('✅ Товар успешно создан:', data || 'Ответ получен');
                
                // Получаем ID созданного товара
                const productData = data?.data || data;
                const productId = productData?.id;

                // Если есть изображения и товар создан, загружаем изображения
                if (productId && images.length > 0) {
                    setIsUploading(true);
                    try {
                        const uploadedImages = await uploadProductImagesBatch(productId, images, 0);
                        console.log('✅ Изображения успешно загружены:', uploadedImages);
                        
                        // Обновляем список товаров
                        await refetch();
                        
                        Alert.alert(
                            "Успех",
                            `Товар "${name}" успешно создан${uploadedImages.length > 0 ? ` и загружено ${uploadedImages.length} изображений` : ''}!`,
                            [{ 
                                text: "OK",
                                onPress: handleClose
                            }]
                        );
                    } catch (uploadError) {
                        console.error('❌ Ошибка загрузки изображений:', uploadError);
                        
                        // Обновляем список товаров даже если изображения не загрузились
                        await refetch();
                        
                        Alert.alert(
                            "Товар создан",
                            `Товар "${name}" успешно создан, но произошла ошибка при загрузке изображений. Вы можете добавить их позже.`,
                            [{ 
                                text: "OK",
                                onPress: handleClose
                            }]
                        );
                    } finally {
                        setIsUploading(false);
                    }
                } else {
                    // Обновляем список товаров
                    await refetch();
                    
                    Alert.alert(
                        "Успех",
                        `Товар "${name}" успешно создан!`,
                        [{ 
                            text: "OK",
                            onPress: handleClose
                        }]
                    );
                }
            } else {
                const errorText = await response.text();
                console.error('❌ Ошибка создания товара:', response.status, errorText);
                
                let errorMessage = 'Ошибка создания товара';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Если не удалось распарсить JSON, используем текст ошибки
                    errorMessage = errorText || errorMessage;
                }

                Alert.alert(
                    "Ошибка",
                    errorMessage,
                    [{ text: "OK" }]
                );
            }
        } catch (err) {
            console.error('❌ Ошибка подключения к серверу при создании товара:', err);
            Alert.alert(
                "Ошибка",
                "Ошибка подключения к серверу. Проверьте подключение к интернету.",
                [{ text: "OK" }]
            );
        }
    };

    const handleCancel = () => {
        Alert.alert(
            "Отмена",
            "Вы уверены, что хотите отменить создание товара?",
            [
                { text: "Нет", style: "cancel" },
                {
                    text: "Да",
                    style: "destructive",
                    onPress: handleClose
                }
            ]
        );
    };

    const handleCharacteristicChange = (key: string, value: string) => {
        setCharacteristics({ ...characteristics, [key]: value });
    };

    const handleDeleteCharacteristic = (key: string) => {
        setTimeout(() => {
            Alert.alert(
                "Удалить характеристику",
                `Удалить "${key}"?`,
                [
                    { text: "Отмена", style: "cancel" },
                    {
                        text: "Удалить",
                        style: "destructive",
                        onPress: () => {
                            const newCharacteristics = { ...characteristics };
                            delete newCharacteristics[key];
                            setCharacteristics(newCharacteristics);
                        }
                    }
                ]
            );
        }, 100);
    };

    const handleAddCharacteristic = () => {
        setShowAddCharModal(true);
    };

    const handleConfirmAddCharacteristic = () => {
        if (newCharName.trim()) {
            setCharacteristics({ ...characteristics, [newCharName.trim()]: '' });
            setNewCharName('');
            setShowAddCharModal(false);
        }
    };

    const handleCancelAddCharacteristic = () => {
        setNewCharName('');
        setShowAddCharModal(false);
    };

    const handleToggleCategory = (categoryId: number) => {
        if (categoryIds.includes(categoryId)) {
            // Снимаем выбор - удаляем категорию из списка
            setCategoryIds(categoryIds.filter(id => id !== categoryId));
        } else {
            // Добавляем выбор - добавляем категорию и всех её родителей
            const categoryPath = getCategoryPath(categoryId);
            const parentIds = categoryPath.map(cat => cat.id);
            const newCategoryIds = [...new Set([...categoryIds, ...parentIds])]; // Убираем дубликаты
            setCategoryIds(newCategoryIds);
        }
    };

    const handleToggleExpand = (categoryId: number) => {
        setExpandedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Рекурсивный компонент для отображения категории
    const renderCategoryItem = (category: typeof categories[0], level: number = 0) => {
        const subCategories = categories.filter(c => c.parent_category_id === category.id);
        const isExpanded = expandedCategories.includes(category.id);
        const isSelected = categoryIds.includes(category.id);
        const hasChildren = subCategories.length > 0;

        return (
            <View key={category.id} style={level === 0 ? styles.categoryGroup : {}}>
                {level === 0 ? (
                    // Заголовок категории верхнего уровня - с возможностью сворачивания
                    <View style={styles.categoryHeaderRow}>
                        {hasChildren && (
                            <TouchableOpacity
                                onPress={() => handleToggleExpand(category.id)}
                                style={styles.expandButton}
                            >
                                <IconSymbol 
                                    name={isExpanded ? "chevron.down" : "chevron.right"} 
                                    size={18} 
                                    color="#666" 
                                />
                            </TouchableOpacity>
                        )}
                        {!hasChildren && <View style={styles.expandButtonSpacer} />}
                        <TouchableOpacity
                            style={styles.categoryHeader}
                            onPress={() => handleToggleCategory(category.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.categoryTitle}>{category.name}</Text>
                            {isSelected && (
                                <View style={styles.categoryHeaderBadge}>
                                    <Text style={styles.categoryHeaderBadgeText}>Выбрано</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Подкатегории - кликабельные кнопки с возможностью раскрытия
                    <View style={styles.subCategoryRow}>
                        {hasChildren && (
                            <TouchableOpacity
                                onPress={() => handleToggleExpand(category.id)}
                                style={styles.expandButton}
                            >
                                <IconSymbol 
                                    name={isExpanded ? "chevron.down" : "chevron.right"} 
                                    size={16} 
                                    color="#666" 
                                />
                            </TouchableOpacity>
                        )}
                        {!hasChildren && <View style={styles.expandButtonSpacer} />}
                        <TouchableOpacity
                            style={[
                                styles.subCategoryButton,
                                { paddingLeft: 12 + (level - 1) * 16, flex: 1 }, // Отступ по уровню вложенности
                                isSelected && styles.subCategoryButtonSelected
                            ]}
                            onPress={() => handleToggleCategory(category.id)}
                        >
                            <Text style={[
                                styles.subCategoryText,
                                isSelected && styles.subCategoryTextSelected
                            ]}>
                                {category.name}
                            </Text>
                            {isSelected && (
                                <IconSymbol name="checkmark.circle.fill" size={20} color="#007AFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                
                {/* Рекурсивно отображаем подкатегории */}
                {isExpanded && hasChildren && (
                    <View style={styles.subCategoriesContainer}>
                        {subCategories.map(subCat => renderCategoryItem(subCat, level + 1))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <ScreenWrapper title="Новый товар" useScrollView={false}>
            <View style={styles.modalContainer}>
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {/* Галерея изображений */}
                <View style={styles.gallerySection}>
                    <Text style={styles.sectionTitle}>Фотографии товара</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.galleryScroll}
                    >
                        {images.map((image, index) => {
                            return (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image 
                                        source={{ uri: image.uri }}
                                        style={styles.galleryImage}
                                        resizeMode="cover"
                                    />
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
                            disabled={isUploading}
                        >
                            <IconSymbol name="plus" size={32} color="#999" />
                            <Text style={styles.addImageText}>Добавить фото</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Основная информация */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Основная информация</Text>

                    {/* Название */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Название товара *</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Молоко пастеризованное 3.2%"
                        />
                    </View>

                    {/* Категории */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Категории *</Text>
                        <Text style={styles.hint}>Выберите одну или несколько категорий</Text>
                        <View style={styles.categoryTree}>
                            {categories.filter(c => c.parent_category_id === null).map(parentCat => {
                                const subCategories = categories.filter(c => c.parent_category_id === parentCat.id);
                                const isParentSelected = categoryIds.includes(parentCat.id);
                                
                                // Если у категории нет подкатегорий, делаем её кликабельной
                                if (subCategories.length === 0) {
                                    return (
                                        <View key={parentCat.id} style={styles.categoryGroup}>
                                            <TouchableOpacity
                                                style={styles.categoryHeader}
                                                onPress={() => handleToggleCategory(parentCat.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.categoryTitle}>{parentCat.name}</Text>
                                                {isParentSelected && (
                                                    <View style={styles.categoryHeaderBadge}>
                                                        <Text style={styles.categoryHeaderBadgeText}>Выбрано</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.subCategoryButton,
                                                    isParentSelected && styles.subCategoryButtonSelected
                                                ]}
                                                onPress={() => handleToggleCategory(parentCat.id)}
                                            >
                                                <View style={styles.expandButtonSpacer} />
                                                <Text style={[
                                                    styles.subCategoryText,
                                                    isParentSelected && styles.subCategoryTextSelected
                                                ]}>
                                                    Выбрать категорию
                                                </Text>
                                                {isParentSelected && (
                                                    <IconSymbol name="checkmark.circle.fill" size={20} color="#007AFF" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }
                                
                                // Рекурсивно отображаем категорию с подкатегориями
                                return renderCategoryItem(parentCat, 0);
                            })}
                        </View>
                    </View>

                    {/* Описание */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Описание *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Натуральное коровье молоко высшего сорта..."
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Характеристики */}
                <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Характеристики</Text>
                        <TouchableOpacity 
                            style={styles.addCharButton}
                            onPress={handleAddCharacteristic}
                        >
                            <IconSymbol name="plus" size={16} color="#007AFF" />
                            <Text style={styles.addCharButtonText}>Добавить</Text>
                        </TouchableOpacity>
                    </View>

                    {Object.entries(characteristics).map(([key, value]) => {
                        return (
                            <View key={key} style={styles.characteristicRow}>
                                <View style={styles.characteristicLeft}>
                                    <Text style={styles.characteristicKey}>{key}</Text>
                                </View>
                                <View style={styles.characteristicRight}>
                                    <TextInput
                                        style={styles.characteristicInput}
                                        value={value}
                                        onChangeText={(text) => handleCharacteristicChange(key, text)}
                                        placeholder="..."
                                    />
                                    <TouchableOpacity
                                        style={styles.deleteCharButton}
                                        onPress={() => handleDeleteCharacteristic(key)}
                                    >
                                        <IconSymbol name="trash" size={16} color="#ff3b30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}

                    {Object.keys(characteristics).length === 0 && (
                        <Text style={styles.emptyCharacteristics}>
                            Нажмите "Добавить" для создания характеристик
                        </Text>
                    )}

                    <Text style={styles.hint}>* - обязательные поля</Text>
                </View>

                {/* Кнопки действий */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity 
                        style={[styles.saveButton, (isUploading) && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isUploading}
                    >
                        <Text style={styles.saveButtonText}>
                            {isUploading ? 'Загрузка...' : 'Создать товар'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelButtonText}>Отмена</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Модальное окно для добавления новой характеристики */}
            <Modal
                visible={showAddCharModal}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCancelAddCharacteristic}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Новая характеристика</Text>
                            <TouchableOpacity onPress={handleCancelAddCharacteristic}>
                                <IconSymbol name="xmark" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.modalLabel}>Название характеристики</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Например: Калорийность"
                                value={newCharName}
                                onChangeText={setNewCharName}
                                autoFocus
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={handleCancelAddCharacteristic}
                            >
                                <Text style={styles.modalCancelButtonText}>Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalConfirmButton,
                                    !newCharName.trim() && styles.modalConfirmButtonDisabled
                                ]}
                                onPress={handleConfirmAddCharacteristic}
                                disabled={!newCharName.trim()}
                            >
                                <Text style={styles.modalConfirmButtonText}>Добавить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
        </ScreenWrapper>
    );
}

export default function NewProductScreen(props: NewProductScreenProps) {
    return <NewProductContent {...props} />;
}

const styles = StyleSheet.create({
    modalContainer: {
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
        paddingTop: 16,
        paddingBottom: 40,
        paddingHorizontal: 0,
    },
    gallerySection: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        marginBottom: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
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
        width: 250,
        height: 250,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
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
        width: 250,
        height: 250,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
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
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    categoryButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    categoryButtonText: {
        fontSize: 16,
        color: '#333',
    },
    categoryTree: {
        marginTop: 8,
    },
    categoryGroup: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    categoryHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryHeader: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    categoryHeaderBadge: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryHeaderBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    subCategoriesContainer: {
        gap: 4,
        marginTop: 4,
    },
    subCategoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    expandButton: {
        width: 32,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandButtonSpacer: {
        width: 32,
    },
    subCategoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    subCategoryButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    subCategoryText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    subCategoryTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addCharButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    addCharButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    hint: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
    },
    characteristicRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    characteristicLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    characteristicKey: {
        fontSize: 14,
        color: '#666',
    },
    standardBadge: {
        fontSize: 8,
        color: '#007AFF',
    },
    characteristicRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    characteristicInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        backgroundColor: '#fff',
        textAlign: 'right',
    },
    deleteCharButton: {
        padding: 4,
    },
    emptyCharacteristics: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
    actionsSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    saveButton: {
        backgroundColor: '#34C759',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
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
    // Модальное окно
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
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
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    modalBody: {
        padding: 20,
    },
    modalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    modalCancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    modalCancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    modalConfirmButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    modalConfirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    modalConfirmButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});



