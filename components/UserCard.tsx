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
      <View style={styles.userIconContainer}>
        <IconSymbol 
          name="person.circle.fill" 
          size={60} 
          color="#007AFF" 
          style={styles.userIcon}
        />
      </View>
      <Text style={styles.userEmail}>
        {user.phone || user.email || 'Не указан'}
      </Text>
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, user.verified ? styles.verified : styles.unverified]}>
          <Text style={styles.statusText}>
            {user.verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
        <View style={[styles.statusBadge, user.active ? styles.active : styles.inactive]}>
          <Text style={styles.statusText}>
            {user.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    marginBottom: 12,
  },
  userIconContainer: {
    alignSelf: 'center',
    marginBottom: 15,
    borderRadius: 28,
    overflow: 'hidden',
  },
  userIcon: {
    alignSelf: 'center',
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verified: {
    backgroundColor: '#d4edda',
  },
  unverified: {
    backgroundColor: '#f8d7da',
  },
  active: {
    backgroundColor: '#d1ecf1',
  },
  inactive: {
    backgroundColor: '#f5c6cb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
});
