import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { User } from '@/types';

export default function ManageUsers() {
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
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Refresh users list
            fetchUsers();
            Alert.alert('Success', 'User role updated successfully');
        } catch (error) {
            console.error('Error updating user role:', error);
            Alert.alert('Error', 'Failed to update user role');
        }
    };

    const UserCard = ({ user }: { user: User }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user.role}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                {user.role !== 'ADMIN' && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            Alert.alert(
                                'Update Role',
                                `Change ${user.full_name}'s role to:`,
                                [
                                    {
                                        text: 'Manager',
                                        onPress: () => updateUserRole(user.id, 'MANAGER'),
                                    },
                                    {
                                        text: 'User',
                                        onPress: () => updateUserRole(user.id, 'USER'),
                                    },
                                    {
                                        text: 'Cancel',
                                        style: 'cancel',
                                    },
                                ]
                            );
                        }}
                    >
                        <Text style={styles.actionButtonText}>Change Role</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Users</Text>
                <Text style={styles.subtitle}>{users.length} total users</Text>
            </View>

            {users.map((user) => (
                <UserCard key={user.id} user={user} />
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    userCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfo: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    roleBadge: {
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionButtonText: {
        color: Colors.light.tint,
        fontSize: 14,
        fontWeight: '500',
    },
});