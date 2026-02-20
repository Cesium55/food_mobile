import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { WorkflowPageProps } from "@/components/workflow/types";
import { ProfileScreenWrapper } from "@/components/profile/ProfileScreenWrapper";
import { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AgreementItem {
  id: string;
  title: string;
  url: string;
}

const AGREEMENTS: AgreementItem[] = [
  { id: "policy", title: "Принимаю политику обработки данных", url: "https://www.google.com" },
  { id: "offer", title: "Принимаю условия оферты", url: "https://yandex.ru" },
  { id: "rules", title: "Принимаю правила размещения товаров", url: "https://www.wikipedia.org" },
];

export function SellerOnboardingAgreementsPage(props: WorkflowPageProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = useMemo(
    () => AGREEMENTS.every((item) => checked[item.id]),
    [checked]
  );

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ProfileScreenWrapper
      title="Согласия"
      showBackButton
      onBackPress={() => props.emit("back")}
      useScrollView={false}
    >
      <View style={styles.container}>
        <Text style={styles.subtitle}>Подтвердите обязательные документы:</Text>

        <View style={styles.list}>
          {AGREEMENTS.map((item) => (
            <View key={item.id} style={styles.row}>
              <TouchableOpacity style={styles.checkboxArea} onPress={() => toggle(item.id)}>
                <View style={[styles.checkbox, checked[item.id] && styles.checkboxChecked]}>
                  {checked[item.id] && <IconSymbol name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.itemText}>{item.title}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => void Linking.openURL(item.url)}>
                <Text style={styles.link}>Открыть</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Button
          disabled={!allChecked}
          loading={props.isInitializing}
          onPress={() => props.emit("next")}
          fullWidth
        >
          Далее
        </Button>
      </View>
    </ProfileScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  list: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e2e2",
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkboxArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#7a7a7a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  itemText: {
    marginLeft: 10,
    color: "#222",
    fontSize: 15,
    flexShrink: 1,
  },
  link: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
