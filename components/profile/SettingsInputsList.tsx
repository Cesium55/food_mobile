import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface SettingsInputsListProps {
  count?: number;
}

export function SettingsInputsList({ count = 10 }: SettingsInputsListProps) {
  const [values, setValues] = useState<string[]>(() => Array.from({ length: count }, () => ""));

  const fields = useMemo(
    () => Array.from({ length: count }, (_, index) => ({ id: index, label: `Поле ${index + 1}` })),
    [count]
  );

  const handleChange = (index: number, value: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Список инпутов</Text>
      {fields.map((field) => (
        <BottomSheetTextInput
          key={field.id}
          style={styles.input}
          placeholder={field.label}
          value={values[field.id] ?? ""}
          onChangeText={(text) => handleChange(field.id, text)}
          placeholderTextColor="#999"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    marginBottom: 10,
    color: "#333",
  },
});
