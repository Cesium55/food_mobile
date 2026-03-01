import { IconSymbol } from "@/components/ui/icon-symbol";
import { spacing, typography } from "@/constants/tokens";
import { useColors } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ScreenTopBarProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function ScreenTopBar({
  title,
  showBackButton = true,
  onBackPress,
}: ScreenTopBarProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    router.back();
  };

  return (
    <View style={styles.topBarWrapper}>
      <View style={styles.topBar}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <IconSymbol name="arrow.left" color={colors.text.primary} size={24} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    topBarWrapper: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      overflow: "hidden",
      zIndex: 10,
      paddingTop: 20,
      backgroundColor: colors.background.default,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      paddingTop: spacing.sm,
      backgroundColor: colors.background.default,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: typography.fontSize.xxl,
      fontFamily: typography.fontFamily.bold,
      flex: 1,
      textAlign: "center",
    },
    spacer: {
      width: 40,
    },
  });
