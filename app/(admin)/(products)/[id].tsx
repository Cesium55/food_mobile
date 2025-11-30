import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { getImageUrl } from "@/utils/imageUtils";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import { SafeAreaView } from "react-native-safe-area-context";

interface Product {
    id: number;
    name: string;
    description: string;
    categoryIds: number[]; // Массив ID категорий (для локального использования)
    images: string[];
    characteristics: { [key: string]: string };
}

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const productId = Number(id);
    const { categories, getCategoryById, getCategoryPath } = useCategories();
    const { fetchProductById } = useProducts();

    // Режим редактирования
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Данные товара
    const [product, setProduct] = useState<Product | null>(null);

    const [hasChanges, setHasChanges] = useState(false);

    // Загрузка товара с сервера
    useEffect(() => {
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
                    setProduct({
                        id: apiProduct.id,
                        name: apiProduct.name,
                        description: apiProduct.description || '',
                        categoryIds: apiProduct.category_ids || [],
                        images: apiProduct.images || [],
                        characteristics: apiProduct.characteristics || {},
                    });
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
                        setProduct({
                            ...product,
                            images: [...product.images, '']
                        });
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
                        setProduct({
                            ...product,
                            images: product.images.filter((_, i) => i !== index)
                        });
                        setHasChanges(true);
                    }
                }
            ]
        );
    };

    const handleFieldChange = <K extends keyof Product>(field: K, value: Product[K]) => {
        setProduct({ ...product, [field]: value });
        setHasChanges(true);
    };

    const handleCharacteristicChange = (key: string, value: string) => {
        setProduct({
            ...product,
            characteristics: { ...product.characteristics, [key]: value }
        });
        setHasChanges(true);
    };

    const handleDeleteCharacteristic = (key: string) => {
        if (!isEditing) return;
        
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
        if (newCharName.trim()) {
            setProduct({
                ...product,
                characteristics: { ...product.characteristics, [newCharName.trim()]: '' }
            });
            setHasChanges(true);
            setNewCharName('');
            setShowAddCharModal(false);
        }
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
        if (!isEditing) return;
        
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
        <SafeAreaView style={styles.safeArea} edges={[]}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerBackButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="arrow.left" color="#333" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {product?.name || 'Загрузка...'}
                </Text>
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
                ) : (
                    <View style={styles.headerSpacer} />
                )}
            </View>

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
                        onPress={() => router.back()}
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
                {/* Галерея изображений */}
                <View style={styles.gallerySection}>
                    <Text style={styles.sectionTitle}>Фотографии товара</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.galleryScroll}
                    >
                        {product.images.map((imagePath, index) => {
                            const imageUrl = getImageUrl(imagePath);
                            const hasImage = !!imageUrl;
                            
                            return (
                                <View key={index} style={styles.imageWrapper}>
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

                    {Object.entries(product.characteristics).map(([key, value]) => {
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
        paddingTop: 0,
        paddingBottom: 16,
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
        backgroundColor: '#f9f9f9',
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
        borderRadius: 12,
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
        backgroundColor: '#f9f9f9',
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
        backgroundColor: '#f9f9f9',
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
        backgroundColor: '#f9f9f9',
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

