import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface SearchProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onSubmit?: () => void;
    autoFocus?: boolean;
}

export default function Search({ 
    placeholder = "Поиск в SaveFood", 
    value,
    onChangeText,
    onSubmit,
    autoFocus = false,
}: SearchProps) {
    return (
        <View style={styles.container}>
            <Ionicons 
                name="search" 
                size={20} 
                color="#999" 
                style={styles.icon} 
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                autoFocus={autoFocus}
                returnKeyType="search"
                onSubmitEditing={onSubmit}
            />
            <TouchableOpacity
                style={styles.submitButton}
                onPress={onSubmit}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 18,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: "#333",
    },
    submitButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FF6B00",
        marginLeft: 8,
    },
});
