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
}

export default function AdminDashboard() {
    const { signOut } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        totalClients: 0,
        totalTasks: 0,
        activeUsers: 0,
        totalTaskAssignments: 0,
    });

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const [projects, clients, tasks, users, taskAssignments] = await Promise.all([
                supabase.from('projects').select('count', { count: 'exact' }),
                supabase.from('clients').select('count', { count: 'exact' }),
                supabase.from('tasks').select('count', { count: 'exact' }),
                supabase.from('users').select('count', { count: 'exact' }),
                supabase.from('task_assignments').select('count', { count: 'exact' }),
            ]);

            setStats({
                totalProjects: projects.count || 0,
                totalClients: clients.count || 0,
                totalTasks: tasks.count || 0,
                activeUsers: users.count || 0,
                totalTaskAssignments: taskAssignments.count || 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace('/');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const AdminCard = ({ title, count, icon, onPress }: { title: string; count: number; icon: string; onPress: () => void }) => (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardHeader}>
                <FontAwesome name={icon as any} size={24} color={Colors.light.tint} />
                <Text style={styles.cardCount}>{count}</Text>
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
        </TouchableOpacity>
    );

    const QuickAction = ({ title, icon, onPress, disabled }: { title: string; icon: string; onPress: () => void; disabled?: boolean }) => (
        <TouchableOpacity
            style={[styles.actionButton, disabled && styles.disabledButton]}
            onPress={onPress}
            disabled={disabled}
        >
            <FontAwesome name={icon as any} size={20} color={disabled ? '#999' : Colors.light.tint} />
            <Text style={[styles.actionText, disabled && styles.disabledText]}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Admin Dashboard</Text>
                    <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                        <FontAwesome name="sign-out" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Overview & Quick Actions</Text>
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
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                    <QuickAction
                        title="Add Client"
                        icon="user-plus"
                        onPress={() => router.push('/(admin)/clients/new')}
                    />
                    <QuickAction
                        title="New Project"
                        icon="plus-circle"
                        onPress={() => router.push('/(admin)/projects/new')}
                    // disabled={stats.totalClients === 0}
                    />
                    <QuickAction
                        title="Create Task"
                        icon="plus-square"
                        onPress={() => router.push('/(admin)/tasks/new')}
                    // disabled={stats.totalProjects === 0}
                    />
                </View>
            </View>
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardCount: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '30%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 8,
    },
    disabledButton: {
        backgroundColor: '#f0f0f0',
    },
    disabledText: {
        color: '#999',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    signOutButton: {
        padding: 8,
    },
});