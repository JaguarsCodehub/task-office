import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
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
                <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
                <Text style={styles.userName}>{user.username}</Text>
                <Text style={styles.userEmail}>{user.full_name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
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

    const getRoleColor = (role: string) => {
        const colors = {
            'USER': '#14B8A6',
            'MANAGER': '#FFB020',
            'ADMIN': '#D14343'
        };
        return colors[role as keyof typeof colors] || Colors.light.tint;
    };

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
        backgroundColor: '#fff',
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
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    userInfo: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
        marginTop: 8,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        backgroundColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginTop: 8,
    },
});