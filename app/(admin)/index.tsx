import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
    totalProjects: number;
    totalClients: number;
    totalTasks: number;
    activeUsers: number;
    totalTaskAssignments: number;
    totalRequests: number;
}

export default function AdminDashboard() {
    const { signOut } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        totalClients: 0,
        totalTasks: 0,
        activeUsers: 0,
        totalTaskAssignments: 0,
        totalRequests: 0,
    });

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const [projects, clients, tasks, users, taskAssignments, requests] = await Promise.all([
                supabase.from('projects').select('count', { count: 'exact' }),
                supabase.from('clients').select('count', { count: 'exact' }),
                supabase.from('tasks').select('count', { count: 'exact' }),
                supabase.from('users').select('count', { count: 'exact' }),
                supabase.from('task_assignments').select('count', { count: 'exact' }),
                supabase.from('user_requests').select('count', { count: 'exact' }),
            ]);

            setStats({
                totalProjects: projects.count || 0,
                totalClients: clients.count || 0,
                totalTasks: tasks.count || 0,
                activeUsers: users.count || 0,
                totalTaskAssignments: taskAssignments.count || 0,
                totalRequests: requests.count || 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

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

    const AdminCard = ({ title, count, icon, onPress }: { title: string; count: number; icon: string; onPress: () => void }) => (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <FontAwesome name={icon as any} size={28} color={Colors.light.tint} />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardCount}>{count}</Text>
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const QuickAction = ({ title, icon, onPress, disabled }: { title: string; icon: string; onPress: () => void; disabled?: boolean }) => (
        <TouchableOpacity
            style={[styles.actionButton, disabled && styles.disabledButton]}
            onPress={onPress}
            disabled={disabled}
        >
            <View style={styles.actionIconContainer}>
                <FontAwesome name={icon as any} size={24} color={disabled ? '#999' : '#ffffff'} />
            </View>
            <Text style={[styles.actionText, disabled && styles.disabledText]}>{title}</Text>
        </TouchableOpacity>
    );

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
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.title}>Admin Dashboard</Text>
                        <Text style={styles.subtitle}>Overview & Quick Actions</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(admin)/profile')} style={styles.signOutButton}>
                        <FontAwesome name="user" size={24} color={Colors.light.tabIconSelected} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                        <FontAwesome name="sign-out" size={24} color={Colors.light.tint} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <AdminCard
                    title="Projects"
                    count={stats.totalProjects}
                    icon="folder"
                    onPress={() => router.push('/(admin)/projects')}
                />
                <AdminCard
                    title="Clients"
                    count={stats.totalClients}
                    icon="building"
                    onPress={() => router.push('/(admin)/clients')}
                />
                <AdminCard
                    title="Tasks"
                    count={stats.totalTasks}
                    icon="tasks"
                    onPress={() => router.push('/(admin)/tasks')}
                />
                <AdminCard
                    title="Users"
                    count={stats.activeUsers}
                    icon="users"
                    onPress={() => router.push('/(admin)/users')}
                />
                <AdminCard
                    title="Task Assignments"
                    count={stats.totalTaskAssignments}
                    icon="user"
                    onPress={() => router.push('/(admin)/assign')}
                />
                <AdminCard
                    title="Requests"
                    count={stats.totalRequests}
                    icon="user"
                    onPress={() => router.push('/(admin)/requests')}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.menu}>
                    <MenuItem
                        title="Add Client"
                        icon="user-plus"
                        onPress={() => router.push('/(admin)/clients/new')}
                    />
                    <MenuItem
                        title="New Project"
                        icon="plus-circle"
                        onPress={() => router.push('/(admin)/projects/new')}
                    />
                    <MenuItem
                        title="Create Task"
                        icon="plus-square"
                        onPress={() => router.push('/(admin)/tasks/new')}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        marginBottom: 30,
        backgroundColor: 'transparent',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        // backgroundColor: 'transparent',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a1a1a',
        // marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    signOutButton: {
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.1,
        // shadowRadius: 8,
        // elevation: 5,
    },
    cardContent: {
        padding: 20,
    },
    iconContainer: {
        backgroundColor: '#f0f4ff',
        padding: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    cardTextContainer: {
        gap: 4,
    },
    cardCount: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    cardTitle: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '31%',
        backgroundColor: Colors.light.tint,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    actionIconContainer: {
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    disabledButton: {
        backgroundColor: '#e0e0e0',
    },
    disabledText: {
        color: '#999',
    },
    menu: {
        backgroundColor: '#fff',
        borderRadius: 12,
        // marginHorizontal: 16,
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