import { ProfileScreenWrapper } from "@/components/profile/ProfileScreenWrapper";
import { Button } from "@/components/ui/Button";
import type { WorkflowPageProps } from "@/components/workflow/types";
import { useSellerOnboardingContext } from "@/components/workflow/seller/SellerOnboardingContext";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function SellerOnboardingEmailPage(props: WorkflowPageProps) {
  const { next } = props;
  const { hasEmail, email, initializing, bindingEmail, bindEmail } = useSellerOnboardingContext();
  const [emailInput, setEmailInput] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (email && emailInput.length === 0) {
      setEmailInput(email);
    }
  }, [email, emailInput.length]);

  useEffect(() => {
    if (!initializing && hasEmail) {
      void next({ skipHistory: true });
    }
  }, [hasEmail, initializing, next]);

  const canSubmit = useMemo(() => isValidEmail(emailInput), [emailInput]);

  const handleBindEmail = async () => {
    setErrorText(null);
    if (!canSubmit) {
      setErrorText("Введите корректный email");
      return;
    }

    try {
      await bindEmail(emailInput.trim());
      await next();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Не удалось привязать email");
    }
  };

  return (
    <ProfileScreenWrapper
      title="Email для заявки"
      showBackButton
      onBackPress={() => props.emit("back")}
      useScrollView={false}
    >
      <View style={styles.container}>
        {initializing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Проверяем данные пользователя...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.text}>
              Для регистрации продавца нужен email. У вашего аккаунта он пока не указан.
            </Text>

            <TextInput
              style={styles.input}
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="Введите email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {!!errorText && <Text style={styles.error}>{errorText}</Text>}

            <Button onPress={handleBindEmail} loading={bindingEmail} disabled={!canSubmit} fullWidth>
              Сохранить email
            </Button>
          </>
        )}
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
  center: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
    fontSize: 14,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    color: "#DC2626",
    marginBottom: 10,
    fontSize: 14,
  },
});
