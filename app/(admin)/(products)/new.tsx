import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCategories } from "@/hooks/useCategories";
import { router } from "expo-router";
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

// Стандартные характеристики (всегда есть) - вынесены за компонент для оптимизации
const STANDARD_CHARACTERISTICS = {
    'Вес/Объем': '',
    'Производитель': '',
    'Страна': '',
    'Срок хранения': '',
    'Условия хранения': '',
};

export default function NewProductScreen() {
    const { categories, getCategoryById } = useCategories();

    // Дополнительные характеристики (могут добавляться пользователем)
    const [customCharacteristics, setCustomCharacteristics] = useState<{ [key: string]: string }>({});
    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [categoryIds, setCategoryIds] = useState<number[]>([]); // Массив ID категорий
    const [images, setImages] = useState<string[]>([]);
    const [characteristics, setCharacteristics] = useState<{ [key: string]: string }>(STANDARD_CHARACTERISTICS);
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
    
    // Модальное окно для добавления характеристики
    const [showAddCharModal, setShowAddCharModal] = useState(false);
    const [newCharName, setNewCharName] = useState('');

    const handleAddImage = () => {
        Alert.alert(
            "Добавить фото",
            "В реальном приложении здесь откроется галерея",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Добавить фото",
                    onPress: () => {
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
        if (!name || !description) {
            Alert.alert("Ошибка", "Заполните обязательные поля: Название и Описание");
            return;
        }

        if (categoryIds.length === 0) {
            Alert.alert("Ошибка", "Выберите хотя бы одну категорию");
            return;
        }

        Alert.alert(
            "Создание товара",
            `Товар "${name}" успешно создан!\n(Демонстрационный режим)`,
            [{ 
                text: "OK",
                onPress: () => router.back()
            }]
        );
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
                    onPress: () => router.back()
                }
            ]
        );
    };

    const handleCharacteristicChange = (key: string, value: string) => {
        if (STANDARD_CHARACTERISTICS.hasOwnProperty(key)) {
            // Изменяем стандартную характеристику
            setCharacteristics({ ...characteristics, [key]: value });
        } else {
            // Изменяем пользовательскую характеристику
            const newCustom = { ...customCharacteristics, [key]: value };
            setCustomCharacteristics(newCustom);
            setCharacteristics({ ...STANDARD_CHARACTERISTICS, ...newCustom });
        }
    };

    const handleDeleteCharacteristic = (key: string) => {
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
                            setCharacteristics({ ...STANDARD_CHARACTERISTICS, ...newCustom });
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
            const newCustom = { ...customCharacteristics, [newCharName.trim()]: '' };
            setCustomCharacteristics(newCustom);
            setCharacteristics({ ...STANDARD_CHARACTERISTICS, ...newCustom });
            setNewCharName('');
            setShowAddCharModal(false);
        }
    };

    const handleCancelAddCharacteristic = () => {
        setNewCharName('');
        setShowAddCharModal(false);
    };

    const handleToggleExpand = (categoryId: number) => {
        setExpandedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleToggleCategory = (categoryId: number) => {
        const newCategoryIds = categoryIds.includes(categoryId)
            ? categoryIds.filter(id => id !== categoryId)
            : [...categoryIds, categoryId];
        
        setCategoryIds(newCategoryIds);
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
                    Новый товар
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
                    <Text style={styles.sectionTitle}>Фотографии товара</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.galleryScroll}
                    >
                        {images.map((imageUrl, index) => {
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
                        <Text style={styles.hint}>Выберите одну или несколько категорий (с подкатегориями)</Text>
                        <View style={styles.categoryTree}>
                            {categories.filter(c => c.parent_category_id === null).map(parentCat => {
                                const subCategories = categories.filter(c => c.parent_category_id === parentCat.id);
                                const isExpanded = expandedCategories.includes(parentCat.id);
                                const isParentSelected = categoryIds.includes(parentCat.id);
                                
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
                                            const isSelected = categoryIds.includes(subCat.id);
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
                        const isStandard = STANDARD_CHARACTERISTICS.hasOwnProperty(key);
                        return (
                            <View key={key} style={styles.characteristicRow}>
                                <View style={styles.characteristicLeft}>
                                    <Text style={styles.characteristicKey}>{key}</Text>
                                    {isStandard && (
                                        <Text style={styles.standardBadge}>●</Text>
                                    )}
                                </View>
                                <View style={styles.characteristicRight}>
                                    <TextInput
                                        style={styles.characteristicInput}
                                        value={value}
                                        onChangeText={(text) => handleCharacteristicChange(key, text)}
                                        placeholder="..."
                                    />
                                    {!isStandard && (
                                        <TouchableOpacity
                                            style={styles.deleteCharButton}
                                            onPress={() => handleDeleteCharacteristic(key)}
                                        >
                                            <IconSymbol name="trash" size={16} color="#ff3b30" />
                                        </TouchableOpacity>
                                    )}
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
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Создать товар</Text>
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

