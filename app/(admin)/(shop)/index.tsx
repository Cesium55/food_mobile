import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useState } from "react";
import {
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
    
    // Демонстрационные данные
    const [imageUrl, setImageUrl] = useState("https://via.placeholder.com/150");
    const [fullName, setFullName] = useState("Продуктовая сеть 'Свежесть'");
    const [shortName, setShortName] = useState("Свежесть");
    const [description, setDescription] = useState("Крупнейшая региональная сеть продуктовых магазинов. Мы предлагаем широкий ассортимент свежих продуктов по доступным ценам.");
    const [contacts, setContacts] = useState("+7 (800) 123-45-67\ninfo@svezhest.ru");
    
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
                        // В реальном приложении здесь бы восстанавливались исходные данные
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

    const handleImageChange = () => {
        if (!isEditing) return;
        
        Alert.alert(
            "Выбор изображения",
            "В реальном приложении здесь откроется галерея",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Демо изображение",
                    onPress: () => {
                        setImageUrl("https://via.placeholder.com/150/0000FF/FFFFFF");
                        setHasChanges(true);
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
                            <View style={styles.imagePlaceholder}>
                                <IconSymbol name="bag.fill" size={60} color="#ccc" />
                            </View>
                            {imageUrl && imageUrl !== "https://via.placeholder.com/150" ? (
                                <Image 
                                    source={{ uri: imageUrl }}
                                    style={styles.image}
                                />
                            ) : null}
                            {isEditing && (
                                <View style={styles.imageOverlay}>
                                    <IconSymbol name="camera" size={24} color="#fff" />
                                    <Text style={styles.imageOverlayText}>Изменить</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Полное название */}
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

                    {/* Короткое название */}
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

                    {/* Описание */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Описание</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={handleFieldChange(setDescription)}
                                placeholder="Введите описание торговой сети"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        ) : (
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>{description}</Text>
                            </View>
                        )}
                    </View>

                    {/* Контакты */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Контакты</Text>
                        {isEditing ? (
                            <>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={contacts}
                                    onChangeText={handleFieldChange(setContacts)}
                                    placeholder="Введите контактную информацию"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                                <Text style={styles.hint}>Телефон, email, адрес и другая контактная информация</Text>
                            </>
                        ) : (
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>{contacts}</Text>
                            </View>
                        )}
                    </View>

                    {/* Кнопка сохранения (только в режиме редактирования) */}
                    {isEditing && (
                        <>
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
    imageSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
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
    hint: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontStyle: 'italic',
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
