import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCategories } from "@/hooks/useCategories";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
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
    categoryIds: number[]; // Массив ID категорий
    images: string[];
    characteristics: { [key: string]: string };
}

// Стандартные характеристики (всегда есть) - вынесены за компонент для оптимизации
const STANDARD_CHARACTERISTICS = {
    'Вес/Объем': '1 л',
    'Производитель': 'ООО "Молочный завод №1"',
    'Страна': 'Россия',
    'Срок хранения': '7 дней',
    'Условия хранения': 'При температуре +2...+6°C',
};

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const productId = Number(id);
    const { categories, getCategoryById } = useCategories();

    // Режим редактирования
    const [isEditing, setIsEditing] = useState(false);

    // Дополнительные характеристики (могут добавляться пользователем)
    const [customCharacteristics, setCustomCharacteristics] = useState<{ [key: string]: string }>({
        'Жирность': '3.2%',
        'ГОСТ': 'ГОСТ 31450-2013',
    });

    // Демо-данные товара
    const [product, setProduct] = useState<Product>({
        id: productId,
        name: "Молоко пастеризованное 3.2%",
        description: "Натуральное коровье молоко высшего сорта. Пастеризованное молоко сохраняет все полезные свойства и имеет приятный вкус.",
        categoryIds: [11, 1], // Молоко + Молочные продукты
        images: ['', '', ''], // 3 фото
        characteristics: { ...STANDARD_CHARACTERISTICS, ...customCharacteristics }
    });

    const [hasChanges, setHasChanges] = useState(false);

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
        if (STANDARD_CHARACTERISTICS.hasOwnProperty(key)) {
            // Изменяем стандартную характеристику
            setProduct({
                ...product,
                characteristics: { ...product.characteristics, [key]: value }
            });
        } else {
            // Изменяем пользовательскую характеристику
            const newCustom = { ...customCharacteristics, [key]: value };
            setCustomCharacteristics(newCustom);
            setProduct({
                ...product,
                characteristics: { ...STANDARD_CHARACTERISTICS, ...newCustom }
            });
        }
        setHasChanges(true);
    };

    const handleDeleteCharacteristic = (key: string) => {
        if (!isEditing) return;
        
        // Нельзя удалить стандартные характеристики
        if (STANDARD_CHARACTERISTICS.hasOwnProperty(key)) {
            setTimeout(() => {
                Alert.alert("Ошибка", "Стандартные характеристики нельзя удалить");
            }, 100);
            return;
        }
        
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
                            const newCustom = { ...customCharacteristics };
                            delete newCustom[key];
                            setCustomCharacteristics(newCustom);
                            setProduct({
                                ...product,
                                characteristics: { ...STANDARD_CHARACTERISTICS, ...newCustom }
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
            const newCustom = { ...customCharacteristics, [newCharName.trim()]: '' };
            setCustomCharacteristics(newCustom);
            setProduct({
                ...product,
                characteristics: { ...STANDARD_CHARACTERISTICS, ...newCustom }
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
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
    
    // Модальное окно для добавления характеристики
    const [showAddCharModal, setShowAddCharModal] = useState(false);
    const [newCharName, setNewCharName] = useState('');

    const handleToggleCategory = (categoryId: number) => {
        if (!isEditing) return;
        
        const newCategoryIds = product.categoryIds.includes(categoryId)
            ? product.categoryIds.filter(id => id !== categoryId)
            : [...product.categoryIds, categoryId];
        
        setProduct({ ...product, categoryIds: newCategoryIds });
        setHasChanges(true);
    };

    const handleToggleExpand = (categoryId: number) => {
        setExpandedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
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
                    {product.name}
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
                    <Text style={styles.sectionTitle}>Фотографии товара</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.galleryScroll}
                    >
                        {product.images.map((imageUrl, index) => {
                            const colors = ['#81C784', '#64B5F6', '#FFB74D', '#BA68C8', '#F06292', '#4DD0E1'];
                            const backgroundColor = colors[index % colors.length];
                            
                            return (
                                <View key={index} style={styles.imageWrapper}>
                                    <View 
                                        style={[styles.galleryImage, { backgroundColor }]}
                                    >
                                        <Text style={styles.imagePlaceholderText}>📸</Text>
                                        <Text style={styles.imageNumberText}>Фото {index + 1}</Text>
                                    </View>
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
                                <Text style={styles.hint}>Выберите одну или несколько категорий (с подкатегориями)</Text>
                                <View style={styles.categoryTree}>
                                    {categories.filter(c => c.parent_category_id === null).map(parentCat => {
                                        const subCategories = categories.filter(c => c.parent_category_id === parentCat.id);
                                        const isExpanded = expandedCategories.includes(parentCat.id);
                                        const isParentSelected = product.categoryIds.includes(parentCat.id);
                                        
                                        return (
                                            <View key={parentCat.id} style={styles.categoryTreeItem}>
                                                {/* Родительская категория */}
                                                <View style={styles.categoryRow}>
                                                    {subCategories.length > 0 && (
                                                        <TouchableOpacity 
                                                            onPress={() => handleToggleExpand(parentCat.id)}
                                                            style={styles.expandButton}
                                                        >
                                                            <Text style={styles.expandIcon}>
                                                                {isExpanded ? '▼' : '▶'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.categoryItemButton,
                                                            isParentSelected && styles.categoryItemSelected,
                                                            subCategories.length === 0 && styles.categoryItemNoChildren
                                                        ]}
                                                        onPress={() => handleToggleCategory(parentCat.id)}
                                                    >
                                                        <Text style={[
                                                            styles.categoryItemText,
                                                            isParentSelected && styles.categoryItemTextSelected
                                                        ]}>
                                                            {parentCat.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                                
                                                {/* Подкатегории */}
                                                {isExpanded && subCategories.map(subCat => {
                                                    const isSelected = product.categoryIds.includes(subCat.id);
                                                    return (
                                                        <TouchableOpacity
                                                            key={subCat.id}
                                                            style={[
                                                                styles.subCategoryItem,
                                                                isSelected && styles.subCategoryItemSelected
                                                            ]}
                                                            onPress={() => handleToggleCategory(subCat.id)}
                                                        >
                                                            <Text style={[
                                                                styles.subCategoryText,
                                                                isSelected && styles.subCategoryTextSelected
                                                            ]}>
                                                                {subCat.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        );
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
                        const isStandard = STANDARD_CHARACTERISTICS.hasOwnProperty(key);
                        return (
                            <View key={key} style={styles.characteristicRow}>
                                <View style={styles.characteristicLeft}>
                                    <Text style={styles.characteristicKey}>{key}</Text>
                                    {!isEditing && isStandard && (
                                        <Text style={styles.standardBadge}>●</Text>
                                    )}
                                </View>
                                <View style={styles.characteristicRight}>
                                    {isEditing ? (
                                        <>
                                            <TextInput
                                                style={styles.characteristicInput}
                                                value={value}
                                                onChangeText={(text) => handleCharacteristicChange(key, text)}
                                            />
                                            {!isStandard && (
                                                <TouchableOpacity
                                                    style={styles.deleteCharButton}
                                                    onPress={() => handleDeleteCharacteristic(key)}
                                                >
                                                    <IconSymbol name="trash" size={16} color="#ff3b30" />
                                                </TouchableOpacity>
                                            )}
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
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#fafafa',
    },
    categoryTreeItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandButton: {
        width: 40,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandIcon: {
        fontSize: 12,
        color: '#666',
    },
    categoryItemButton: {
        flex: 1,
        padding: 12,
        paddingVertical: 14,
        backgroundColor: '#fff',
    },
    categoryItemNoChildren: {
        marginLeft: 40,
    },
    categoryItemSelected: {
        backgroundColor: '#E3F2FD',
    },
    categoryItemText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    categoryItemTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    subCategoryItem: {
        paddingLeft: 56,
        paddingRight: 12,
        paddingVertical: 12,
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    subCategoryItemSelected: {
        backgroundColor: '#E3F2FD',
    },
    subCategoryText: {
        fontSize: 14,
        color: '#666',
    },
    subCategoryTextSelected: {
        color: '#007AFF',
        fontWeight: '500',
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
});

