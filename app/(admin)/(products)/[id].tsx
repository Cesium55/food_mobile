import { ScreenWrapper } from "@/components/screen/ScreenWrapper";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { API_ENDPOINTS } from "@/constants/api";
import { getApiUrl } from "@/constants/env";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { authFetch } from "@/utils/authFetch";
import { ImageFile, deleteProductImage, uploadProductImagesBatch } from "@/utils/imageUpload";
import { getImageUrl } from "@/utils/imageUtils";
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface Product {
    id: number;
    name: string;
    description: string;
    categoryIds: number[]; // Массив ID категорий (для локального использования)
    images: string[];
    characteristics: { [key: string]: string };
}

interface ProductImage {
    path: string;
    id?: number; // ID изображения, если доступен
}

interface ProductDetailScreenProps {
    productId?: number;
    onClose?: () => void;
}

export function ProductDetailContent({ productId: productIdProp, onClose }: ProductDetailScreenProps) {
    const { id } = useLocalSearchParams<{ id: string }>();
    const productId = productIdProp ?? Number(id);
    const { categories, getCategoryById, getCategoryPath } = useCategories();
    const { fetchProductById } = useProducts(); // fetchProductById не требует seller_id, так как загружает конкретный товар по ID

    // Режим редактирования
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Данные товара
    const [product, setProduct] = useState<Product | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    
    // Работа с изображениями
    const [existingImages, setExistingImages] = useState<ProductImage[]>([]); // Существующие изображения с сервера
    const [newImages, setNewImages] = useState<ImageFile[]>([]); // Новые изображения для загрузки
    const [imagesToDelete, setImagesToDelete] = useState<number[]>([]); // ID изображений для удаления
    const [isUploading, setIsUploading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const galleryScrollRef = useRef<ScrollView>(null);
    const handleClose = onClose ?? (() => router.back());

    // Функция загрузки товара с сервера
    const loadProduct = async () => {
        if (!productId || isNaN(productId)) {
            setError('Неверный ID товара');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const apiProduct = await fetchProductById(productId);
            
            if (apiProduct) {
                // Данные уже преобразованы в хуке, просто используем их
                const productData = {
                    id: apiProduct.id,
                    name: apiProduct.name,
                    description: apiProduct.description || '',
                    categoryIds: apiProduct.category_ids || [],
                    images: apiProduct.images || [],
                    characteristics: apiProduct.characteristics || {},
                };
                setProduct(productData);
                
                // Инициализируем существующие изображения
                // Преобразуем изображения в объекты с path
                // images может быть массивом строк или объектов {id, order, path}
                setExistingImages(
                    (apiProduct.images || [])
                        .map((img): ProductImage | null => {
                            if (typeof img === 'string' && img.length > 0) {
                                return { path: img };
                            } else if (img && typeof img === 'object' && img !== null && 'path' in img) {
                                const imgObj = img as { path: string; id?: number; order?: number };
                                if (imgObj.path && typeof imgObj.path === 'string' && imgObj.path.length > 0) {
                                    return {
                                        path: imgObj.path,
                                        id: imgObj.id,
                                    };
                                }
                            }
                            return null;
                        })
                        .filter((img): img is ProductImage => img !== null)
                );
                setNewImages([]);
                setImagesToDelete([]);
            } else {
                setError('Товар не найден');
                setProduct(null);
            }
        } catch (err) {
            console.error('Ошибка загрузки товара:', err);
            setError('Ошибка загрузки товара');
            setProduct(null);
        } finally {
            setLoading(false);
        }
    };

    // Загрузка товара с сервера
    useEffect(() => {
        loadProduct();
    }, [productId, fetchProductById]);

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
                    onPress: async () => {
                        // Отменяем все изменения, включая изображения
                        await loadProduct();
                        setIsEditing(false);
                        setHasChanges(false);
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!product) return;

        if (!product.name || !product.description) {
            Alert.alert("Ошибка", "Заполните обязательные поля: Название и Описание");
            return;
        }

        if (product.categoryIds.length === 0) {
            Alert.alert("Ошибка", "Выберите хотя бы одну категорию");
            return;
        }

        try {
            setIsUploading(true);

            // Преобразуем characteristics в формат attributes для API
            const attributes = Object.entries(product.characteristics)
                .filter(([key, value]) => value.trim() !== '')
                .map(([key, value]) => {
                    // Генерируем slug из названия
                    const slug = key.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    return {
                        slug,
                        name: key,
                        value: value,
                    };
                });

            // Обновляем данные товара
            const productData = {
                name: product.name.trim(),
                description: product.description.trim(),
                category_ids: product.categoryIds,
                attributes: attributes,
            };

            const response = await authFetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS.BASE}/${product.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
                requireAuth: true,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Ошибка обновления товара');
            }

            // Удаляем помеченные изображения
            for (const imageId of imagesToDelete) {
                try {
                    await deleteProductImage(imageId);
                } catch (err) {
                    console.error(`Ошибка удаления изображения ${imageId}:`, err);
                }
            }

            // Загружаем новые изображения
            if (newImages.length > 0) {
                const existingCount = existingImages.length - imagesToDelete.length;
                await uploadProductImagesBatch(product.id, newImages, existingCount);
            }

            // Обновляем данные товара
            await loadProduct();
            
            Alert.alert(
                "Успех",
                "Товар успешно обновлен!",
                [{ 
                    text: "OK",
                    onPress: () => {
                        setIsEditing(false);
                        setHasChanges(false);
                    }
                }]
            );
        } catch (err: any) {
            console.error('Ошибка сохранения товара:', err);
            Alert.alert(
                "Ошибка",
                err.message || "Ошибка сохранения товара. Проверьте подключение к интернету.",
                [{ text: "OK" }]
            );
        } finally {
            setIsUploading(false);
        }
    };


    const handleDelete = () => {
        if (!product) return;
        
        Alert.alert(
            "Удаление товара",
            `Вы уверены, что хотите удалить "${product.name}"?\n\nЭто действие нельзя отменить.`,
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Удалить",
                    style: "destructive",
                    onPress: () => {
                        setTimeout(() => {
                            Alert.alert("Успех", "Товар удален");
                            handleClose();
                        }, 100);
                    }
                }
            ]
        );
    };

    const handleAddImage = async () => {
        if (!isEditing) return;

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
            const newImageFiles: ImageFile[] = result.assets.map((asset: any) => ({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `image_${Date.now()}.jpg`,
            }));
            setNewImages([...newImages, ...newImageFiles]);
            setHasChanges(true);
        }
    };

    const handleRemoveImage = (index: number, isNewImage: boolean) => {
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
                        if (isNewImage) {
                            // Удаляем из новых изображений
                            setNewImages(newImages.filter((_, i) => i !== index));
                        } else {
                            // Помечаем существующее изображение на удаление
                            const imageToDelete = existingImages[index];
                            if (imageToDelete.id) {
                                setImagesToDelete([...imagesToDelete, imageToDelete.id]);
                            }
                            setExistingImages(existingImages.filter((_, i) => i !== index));
                        }
                        setHasChanges(true);
                    }
                }
            ]
        );
    };

    const handleFieldChange = <K extends keyof Product>(field: K, value: Product[K]) => {
        if (!product) return;
        setProduct({ ...product, [field]: value });
        setHasChanges(true);
    };

    const handleCharacteristicChange = (key: string, value: string) => {
        if (!product) return;
        setProduct({
            ...product,
            characteristics: { ...product.characteristics, [key]: value }
        });
        setHasChanges(true);
    };

    const handleDeleteCharacteristic = (key: string) => {
        if (!isEditing || !product) return;
        
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
                            if (!product) return;
                            const newCharacteristics = { ...product.characteristics };
                            delete newCharacteristics[key];
                            setProduct({
                                ...product,
                                characteristics: newCharacteristics
                            });
                            setHasChanges(true);
                        }
                    }
                ]
            );
        }, 100);
    };

    const handleAddCharacteristic = () => {
        if (!isEditing) return;
        setShowAddCharModal(true);
    };

    const handleConfirmAddCharacteristic = () => {
        if (!product || !newCharName.trim()) return;
        setProduct({
            ...product,
            characteristics: { ...product.characteristics, [newCharName.trim()]: '' }
        });
        setHasChanges(true);
        setNewCharName('');
        setShowAddCharModal(false);
    };

    const handleCancelAddCharacteristic = () => {
        setNewCharName('');
        setShowAddCharModal(false);
    };

    const [showCategorySelector, setShowCategorySelector] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]); // Раскрытые категории (для подкатегорий)
    
    // Модальное окно для добавления характеристики
    const [showAddCharModal, setShowAddCharModal] = useState(false);
    const [newCharName, setNewCharName] = useState('');

    const handleToggleCategory = (categoryId: number) => {
        if (!isEditing || !product) return;
        
        if (product.categoryIds.includes(categoryId)) {
            // Снимаем выбор - удаляем категорию из списка
            const newCategoryIds = product.categoryIds.filter(id => id !== categoryId);
            setProduct({ ...product, categoryIds: newCategoryIds });
        } else {
            // Добавляем выбор - добавляем категорию и всех её родителей
            const categoryPath = getCategoryPath(categoryId);
            const parentIds = categoryPath.map(cat => cat.id);
            const newCategoryIds = [...new Set([...product.categoryIds, ...parentIds])]; // Убираем дубликаты
            setProduct({ ...product, categoryIds: newCategoryIds });
        }
        setHasChanges(true);
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
        if (!product) return null;
        const subCategories = categories.filter(c => c.parent_category_id === category.id);
        const isExpanded = expandedCategories.includes(category.id);
        const isSelected = product.categoryIds.includes(category.id);
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
        <ScreenWrapper title={product?.name || "Товар"} useScrollView={false}>
            <View style={styles.modalContainer}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Загрузка товара...</Text>
                </View>
            ) : error || !product ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error || 'Товар не найден'}</Text>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={handleClose}
                    >
                        <Text style={styles.backButtonText}>Вернуться назад</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                <View style={styles.inlineHeaderActions}>
                    {!isEditing && product ? (
                        <TouchableOpacity 
                            style={styles.headerEditButton}
                            onPress={handleEdit}
                        >
                            <IconSymbol name="pencil" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    ) : isEditing && product ? (
                        <TouchableOpacity 
                            style={styles.headerCancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.headerCancelText}>Отмена</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
                {/* Галерея изображений */}
                <View style={styles.gallerySection}>
                    <Text style={styles.sectionTitle}>Фотографии товара</Text>
                    <View style={styles.galleryContainer}>
                    <ScrollView 
                        ref={galleryScrollRef}
                        horizontal 
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                            const scrollPosition = event.nativeEvent.contentOffset.x;
                            const imageWidth = 250; // ширина изображения
                            const index = Math.round(scrollPosition / imageWidth);
                            setCurrentImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                        style={styles.galleryScrollView}
                        contentContainerStyle={styles.galleryScroll}
                    >
                        {/* Существующие изображения */}
                        {existingImages.map((image, index) => {
                            const imageUrl = getImageUrl(image?.path);
                            
                            return (
                                <View key={`existing-${index}`} style={styles.imageWrapper}>
                                    {imageUrl ? (
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={styles.galleryImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View 
                                            style={[styles.galleryImage, styles.galleryImagePlaceholder]}
                                        >
                                            <IconSymbol name="photo" size={32} color="#999" />
                                            <Text style={styles.imageNumberText}>Фото {index + 1}</Text>
                                        </View>
                                    )}
                                    {isEditing && (
                                        <TouchableOpacity 
                                            style={styles.removeImageButton}
                                            onPress={() => handleRemoveImage(index, false)}
                                        >
                                            <IconSymbol name="trash" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                        
                        {/* Новые изображения */}
                        {newImages.map((image, index) => (
                            <View key={`new-${index}`} style={styles.imageWrapper}>
                                <Image
                                    source={{ uri: image.uri }}
                                    style={styles.galleryImage}
                                    resizeMode="cover"
                                />
                                {isEditing && (
                                    <TouchableOpacity 
                                        style={styles.removeImageButton}
                                        onPress={() => handleRemoveImage(index, true)}
                                    >
                                        <IconSymbol name="trash" size={16} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                        
                        {isEditing && (
                            <TouchableOpacity 
                                style={styles.addImageButton}
                                onPress={handleAddImage}
                                disabled={isUploading}
                            >
                                <IconSymbol name="plus" size={32} color="#999" />
                                <Text style={styles.addImageText}>Добавить фото</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                    
                    {/* Индикаторы изображений */}
                    {(existingImages.length + newImages.length + (isEditing ? 1 : 0)) > 1 && (
                        <View style={styles.indicators}>
                            {Array.from({ length: existingImages.length + newImages.length + (isEditing ? 1 : 0) }).map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.indicatorDot,
                                        index === currentImageIndex && styles.indicatorDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                    </View>
                </View>

                {/* Основная информация */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Основная информация</Text>

                    {/* Название */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Название товара</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={product.name}
                                onChangeText={(text) => handleFieldChange('name', text)}
                                placeholder="Введите название"
                            />
                        ) : (
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>{product.name}</Text>
                            </View>
                        )}
                    </View>

                    {/* Категории */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Категории</Text>
                        {isEditing ? (
                            <View>
                                <Text style={styles.hint}>Выберите одну или несколько категорий</Text>
                                <View style={styles.categoryTree}>
                                    {categories.filter(c => c.parent_category_id === null).map(parentCat => {
                                        const subCategories = categories.filter(c => c.parent_category_id === parentCat.id);
                                        const isParentSelected = product.categoryIds.includes(parentCat.id);
                                        
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
                        ) : (
                            <View style={styles.valueContainer}>
                                <View style={styles.categoriesWrap}>
                                    {product.categoryIds.map(catId => {
                                        const cat = getCategoryById(catId);
                                        return cat ? (
                                            <View key={catId} style={styles.categoryTag}>
                                                <Text style={styles.categoryTagText}>{cat.name}</Text>
                                            </View>
                                        ) : null;
                                    })}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Описание */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Описание</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={product.description}
                                onChangeText={(text) => handleFieldChange('description', text)}
                                placeholder="Введите описание товара"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        ) : (
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>{product.description}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Характеристики */}
                <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Характеристики</Text>
                        {isEditing && (
                            <TouchableOpacity 
                                style={styles.addCharButton}
                                onPress={handleAddCharacteristic}
                            >
                                <IconSymbol name="plus" size={16} color="#007AFF" />
                                <Text style={styles.addCharButtonText}>Добавить</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {product && Object.entries(product.characteristics).map(([key, value]) => {
                        return (
                            <View key={key} style={styles.characteristicRow}>
                                <View style={styles.characteristicLeft}>
                                    <Text style={styles.characteristicKey}>{key}</Text>
                                </View>
                                <View style={styles.characteristicRight}>
                                    {isEditing ? (
                                        <>
                                            <TextInput
                                                style={styles.characteristicInput}
                                                value={value}
                                                onChangeText={(text) => handleCharacteristicChange(key, text)}
                                            />
                                            <TouchableOpacity
                                                style={styles.deleteCharButton}
                                                onPress={() => handleDeleteCharacteristic(key)}
                                            >
                                                <IconSymbol name="trash" size={16} color="#ff3b30" />
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <Text style={styles.characteristicValue}>{value}</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}

                    {Object.keys(product.characteristics).length === 0 && (
                        <Text style={styles.emptyCharacteristics}>
                            {isEditing ? 'Нажмите "Добавить" для создания характеристики' : 'Нет характеристик'}
                        </Text>
                    )}
                </View>

                {/* Кнопки действий в режиме редактирования */}
                {isEditing && (
                    <View style={styles.actionsSection}>
                        <TouchableOpacity 
                            style={[
                                styles.saveButton,
                                (!hasChanges || isUploading) && styles.saveButtonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={!hasChanges || isUploading}
                        >
                            <Text style={styles.saveButtonText}>
                                {isUploading ? "Сохранение..." : hasChanges ? "Сохранить изменения" : "Нет изменений"}
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
                            <Text style={styles.deleteButtonText}>Удалить товар</Text>
                        </TouchableOpacity>
                    </View>
                )}
                </ScrollView>
            )}

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

export default function ProductDetailScreen(props: ProductDetailScreenProps) {
    return <ProductDetailContent {...props} />;
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
    inlineHeaderActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    gallerySection: {
        backgroundColor: '#fff',
        paddingTop: 0,
        paddingBottom: 16,
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
    galleryContainer: {
        alignItems: 'center',
    },
    galleryScrollView: {
        width: 250,
        height: 250,
    },
    galleryScroll: {
        alignItems: 'center',
    },
    imageWrapper: {
        position: 'relative',
    },
    galleryImage: {
        width: 250,
        height: 250,
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
    indicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ccc',
    },
    indicatorDotActive: {
        backgroundColor: '#34C759',
        width: 10,
        height: 10,
        borderRadius: 5,
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
        backgroundColor: '#fff',
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
    categoriesWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#E3F2FD',
    },
    categoryTagText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
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
        backgroundColor: '#f5f7fa',
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
    characteristicValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
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
    hint: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
    },
    actionsSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
        backgroundColor: '#fff',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});



