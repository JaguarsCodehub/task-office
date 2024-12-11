import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
}

export default function UsersManagementScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(users.map(user =>
                user.id === userId
                    ? { ...user, is_active: !currentStatus }
                    : user
            ));

            Alert.alert(
                'Success',
                `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error) {
            console.error('Error updating user status:', error);
            Alert.alert('Error', 'Failed to update user status');
        }
    };

    const UserCard = ({ user }: { user: User }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userRole}>Role: {user.role}</Text>
            </View>
            <View style={styles.actionContainer}>
                <Text style={styles.statusLabel}>
                    {user.is_active ? 'Active' : 'Inactive'}
                </Text>
                <Switch
                    value={user.is_active}
                    onValueChange={() => toggleUserStatus(user.id, user.is_active)}
                    trackColor={{ false: '#767577', true: Colors.light.tint }}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                {users.map(user => (
                    <UserCard key={user.id} user={user} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#666',
    },
    actionContainer: {
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 12,
        marginBottom: 4,
        color: '#666',
    },
});