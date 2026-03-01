import { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useColors } from "@/contexts/ThemeContext";

interface ScreenContentProps {
  children: ReactNode;
  useScrollView?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
}

export function ScreenContent({
  children,
  useScrollView = true,
  onRefresh,
  refreshing = false,
}: ScreenContentProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  if (useScrollView) {
    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary?.[500] || "#4CAF50"}
              colors={[colors.primary?.[500] || "#4CAF50"]}
            />
          ) : undefined
        }
      >
        <View style={styles.contentWrapper}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.contentWrapper}>{children}</View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    contentWrapper: {
      flex: 1,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      marginTop: 0,
      paddingTop: 40,
      overflow: "hidden",
      zIndex: 1,
      position: "relative",
      backgroundColor: colors.background.default,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });
