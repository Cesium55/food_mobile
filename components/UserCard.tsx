import { IconSymbol } from "@/components/ui/icon-symbol";
import { StyleSheet, Text, View } from "react-native";

interface User {
  id: number;
  email?: string | null;
  phone?: string | null;
  verified: boolean;
  active: boolean;
}

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <View style={styles.userCard}>
      <View style={styles.userRow}>
        <View style={styles.userIconContainer}>
          <IconSymbol 
            name="person.circle.fill" 
            size={48} 
            color="#007AFF" 
            style={styles.userIcon}
          />
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.phone || user.email || 'Не указан'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIconContainer: {
    marginRight: 10,
    borderRadius: 28,
    overflow: 'hidden',
  },
  userIcon: {
    alignSelf: 'flex-start',
  },
  userEmail: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
