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
        ><View style={styles.contentWrapper}>
          {children}</View>
        </ScrollView>
      
    </SafeAreaView>
  );
}

const createStyles = (colors: any, topInset: number) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eee',
    // backgroundColor: '#123',
    overflow: 'visible',
  },
  topBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
    paddingTop: 20,
    backgroundColor: colors.background.default,
    // backgroundColor: '#f00',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background.default,
    // backgroundColor: '#0f0',
  },
  contentWrapper: {
    flex: 1,
    // backgroundColor: '#00f',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 0,
    paddingTop: 40,
    overflow: 'hidden',
    zIndex: 1,
    position: 'relative',
  },
  content: {
    // zIndex: 1233,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
});
