import { IconSymbol } from "@/components/ui/icon-symbol";
import { spacing } from "@/constants/tokens";
import { useColors } from "@/contexts/ThemeContext";
import { useUser } from "@/hooks/useUser";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Search from "./search/search";

interface TopBarProps {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  showSearch?: boolean;
}

export function TopBar({ 
  searchValue, 
  onSearchChange,
  showSearch = true 
}: TopBarProps) {
  const colors = useColors();
  const user = useUser();
  const [localSearchValue, setLocalSearchValue] = useState(searchValue || '');

  const handleSearchChange = (text: string) => {
    setLocalSearchValue(text);
    onSearchChange?.(text);
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/(profile)');
  };

  return (
    // <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.container, { backgroundColor: colors.background.default }]}>
        {/* Кнопка профиля */}
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#FF6B00' }]}>
            <IconSymbol 
              name="person.fill" 
              color="#fff"
              size={20}
            />
          </View>
        </TouchableOpacity>
        
        {/* Поиск */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Search
              placeholder="Поиск в SaveFood"
              value={localSearchValue}
              onChangeText={handleSearchChange}
            />
          </View>
        )}
      </View>
    //  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        paddingTop: spacing.xl,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        gap: spacing.md,
        marginBottom: 0,
      },
  searchContainer: {
    flex: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
