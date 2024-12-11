import React from 'react';
import { StyleSheet, TouchableOpacity, Alert, View, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut, isAdmin, isManager } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon, title, onPress, color = Colors.light.tint }: { icon: string, title: string, onPress: () => void, color?: string }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        <FontAwesome name={icon as any} size={20} color={color} />
        <Text style={[styles.menuItemText, { color }]}>{title}</Text>
      </View>
      <FontAwesome name="chevron-right" size={16} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user?.full_name}</Text>
            <Text style={styles.email}>{user?.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {isAdmin ? 'Admin' : isManager ? 'Manager' : 'User'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        {isAdmin && (
          <MenuItem
            icon="cog"
            title="Admin Dashboard"
            onPress={() => router.push('/(admin)/index')}
          />
        )}

        <MenuItem
          icon="user"
          title="Edit Profile"
          onPress={() => router.push('/(tabs)/profile/edit')}
        />

        <MenuItem
          icon="moon-o"
          title="Dark Mode"
          onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon!')}
        />

        <MenuItem
          icon="sign-out"
          title="Sign Out"
          onPress={handleSignOut}
          color="#FF3B30"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
});
