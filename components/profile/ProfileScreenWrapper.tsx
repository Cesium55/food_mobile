import { IconSymbol } from "@/components/ui/icon-symbol";
import { spacing, typography } from "@/constants/tokens";
import { useColors } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ProfileScreenWrapperProps {
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
}

export function ProfileScreenWrapper({ 
  title, 
  children, 
  showBackButton = true,
  onBackPress,
  onRefresh,
  refreshing = false
}: ProfileScreenWrapperProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Верхняя панель с заголовком и кнопкой назад */}
      <View style={styles.topBarWrapper}>
        <View style={styles.topBar}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <IconSymbol 
                name="arrow.left" 
                color={colors.text.primary}
                size={24}
              />
            </TouchableOpacity>
          )}
          {!showBackButton && <View style={styles.spacer} />}
          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
          <View style={styles.spacer} />
        </View>
      </View>

      {/* Контент */}
      <View style={styles.contentWrapper}>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary?.[500] || '#4CAF50'}
                colors={[colors.primary?.[500] || '#4CAF50']}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, topInset: number) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBarWrapper: {
    overflow: 'hidden',
    zIndex: 10,
    paddingTop: topInset > 0 ? 0 : 20, // Если нет inset, добавляем отступ
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.background.default,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#eeeeee',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
