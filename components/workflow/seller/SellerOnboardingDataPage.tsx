import { Button } from "@/components/ui/Button";
import type { WorkflowPageProps } from "@/components/workflow/types";
import { ProfileScreenWrapper } from "@/components/profile/ProfileScreenWrapper";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type OrgType = "IP" | "OOO";

export function SellerOnboardingDataPage(props: WorkflowPageProps) {
  const [fullName, setFullName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [inn, setInn] = useState("");
  const [ogrn, setOgrn] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("IP");

  const canContinue = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      shortName.trim().length > 0 &&
      description.trim().length > 0 &&
      inn.trim().length > 0 &&
      ogrn.trim().length > 0 &&
      orgType.length > 0
    );
  }, [description, fullName, inn, ogrn, orgType, shortName]);

  return (
    <ProfileScreenWrapper
      title="Данные продавца"
      showBackButton
      onBackPress={() => props.emit("back")}
    >
      <View style={styles.container}>
        <Text style={styles.label}>Полное название</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Например: ООО Ромашка"
        />

        <Text style={styles.label}>Короткое название</Text>
        <TextInput
          style={styles.input}
          value={shortName}
          onChangeText={setShortName}
          placeholder="Например: Ромашка"
        />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Кратко о вашем магазине"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>ИНН</Text>
        <TextInput
          style={styles.input}
          value={inn}
          onChangeText={setInn}
          placeholder="Введите ИНН"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>ОГРН</Text>
        <TextInput
          style={styles.input}
          value={ogrn}
          onChangeText={setOgrn}
          placeholder="Введите ОГРН"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Тип организации</Text>
        <View style={styles.orgTypeRow}>
          <TouchableOpacity
            style={[styles.orgTypeButton, orgType === "IP" && styles.orgTypeButtonActive]}
            onPress={() => setOrgType("IP")}
          >
            <Text style={[styles.orgTypeText, orgType === "IP" && styles.orgTypeTextActive]}>
              ИП
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.orgTypeButton, orgType === "OOO" && styles.orgTypeButtonActive]}
            onPress={() => setOrgType("OOO")}
          >
            <Text style={[styles.orgTypeText, orgType === "OOO" && styles.orgTypeTextActive]}>
              ООО
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.submit}>
          <Button
            disabled={!canContinue}
            loading={props.isInitializing}
            onPress={() => props.emit("next")}
            fullWidth
          >
            Далее
          </Button>
        </View>
      </View>
    </ProfileScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  textArea: {
    minHeight: 90,
  },
  orgTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  orgTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  orgTypeButtonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#eaf3ff",
  },
  orgTypeText: {
    color: "#333",
    fontWeight: "600",
  },
  orgTypeTextActive: {
    color: "#007AFF",
  },
  submit: {
    marginTop: 18,
  },
});
