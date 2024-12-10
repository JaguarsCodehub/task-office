import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { format, subDays } from 'date-fns';

interface TaskAssignment {
    id: string;
    task_id: string;
    assigned_by: string;
    assigned_to: string;
    assigned_at: string;
    due_date: string;
    task: {
        title: string;
        priority: string;
        status: string;
    };
    assigned_by_user: {
        full_name: string;
    };
    assigned_to_user: {
        full_name: string;
        id: string;
    };
}

export default function TaskAssignmentsScreen() {
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [filteredAssignments, setFilteredAssignments] = useState<TaskAssignment[]>([]);
    const [users, setUsers] = useState<{ id: string; full_name: string; }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [dueDateFilter, setDueDateFilter] = useState('all');
    const [assignedToFilter, setAssignedToFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assignmentsData, usersData] = await Promise.all([
                supabase
                    .from('task_assignments')
                    .select(`
                        *,
                        task:tasks(title, priority, status),
                        assigned_by_user:users!task_assignments_assigned_by_fkey(full_name),
                        assigned_to_user:users!task_assignments_assigned_to_fkey(id, full_name)
                    `)
                    .order('assigned_at', { ascending: false }),
                supabase
                    .from('users')
                    .select('id, full_name')
                    .order('full_name')
            ]);

            if (assignmentsData.error) throw assignmentsData.error;
            if (usersData.error) throw usersData.error;

            setAssignments(assignmentsData.data || []);
            setFilteredAssignments(assignmentsData.data || []);
            setUsers(usersData.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load assignments');
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...assignments];

        // Apply date filter
        if (dueDateFilter !== 'all') {
            const today = new Date();
            const filterDate = subDays(today, dueDateFilter === '15' ? 15 : 30);
            filtered = filtered.filter(assignment => {
                const dueDate = new Date(assignment.due_date);
                return dueDate >= filterDate && dueDate <= today;
            });
        }

        // Apply user filter
        if (assignedToFilter) {
            filtered = filtered.filter(assignment =>
                assignment.assigned_to_user.id === assignedToFilter
            );
        }

        setFilteredAssignments(filtered);
    };

    useEffect(() => {
        applyFilters();
    }, [dueDateFilter, assignedToFilter, assignments]);

    const handleRemoveAssignment = async (assignmentId: string) => {
        Alert.alert(
            'Confirm Removal',
            'Are you sure you want to remove this assignment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('task_assignments')
                                .delete()
                                .eq('id', assignmentId);

                            if (error) throw error;
                            fetchData();
                        } catch (error) {
                            console.error('Error removing assignment:', error);
                            Alert.alert('Error', 'Failed to remove assignment');
                        }
                    },
                },
            ]
        );
    };

    const FilterSection = () => (
        <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filters</Text>
            <View style={styles.filterRow}>
                <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Due Date Range</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={dueDateFilter}
                            onValueChange={setDueDateFilter}
                            style={styles.picker}
                        >
                            <Picker.Item label="All Time" value="all" />
                            <Picker.Item label="Last 15 Days" value="15" />
                            <Picker.Item label="Last 30 Days" value="30" />
                        </Picker>
                    </View>
                </View>

                <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Assigned To</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={assignedToFilter}
                            onValueChange={setAssignedToFilter}
                            style={styles.picker}
                        >
                            <Picker.Item label="All Users" value="" />
                            {users.map(user => (
                                <Picker.Item
                                    key={user.id}
                                    label={user.full_name}
                                    value={user.id}
                                />
                            ))}
                        </Picker>
                    </View>
                </View>
            </View>
        </View>
    );

    const AssignmentCard = ({ assignment }: { assignment: TaskAssignment }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerContent}>
                    <FontAwesome5
                        name={getStatusIcon(assignment.task.status)}
                        size={16}
                        color={getStatusColor(assignment.task.status)}
                        style={styles.statusIcon}
                    />
                    <Text style={styles.taskTitle}>{assignment.task.title}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleRemoveAssignment(assignment.id)}
                    style={styles.removeButton}
                >
                    <FontAwesome5 name="times" size={16} color="#FF4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                    <FontAwesome5 name="user" size={14} color="#666" />
                    <Text style={styles.infoText}>
                        Assigned to {assignment.assigned_to_user.full_name}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <FontAwesome5 name="user-check" size={14} color="#666" />
                    <Text style={styles.infoText}>
                        By {assignment.assigned_by_user.full_name}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <FontAwesome5 name="calendar-alt" size={14} color="#666" />
                    <Text style={styles.infoText}>
                        Due {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                    </Text>
                </View>

                <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: getPriorityColor(assignment.task.priority) }]}>
                        <Text style={styles.badgeText}>{assignment.task.priority}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(assignment.task.status) }]}>
                        <Text style={styles.badgeText}>{assignment.task.status}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Task Assignments</Text>
                <Text style={styles.headerSubtitle}>
                    {filteredAssignments.length} assignments found
                </Text>
            </View>

            <FilterSection />

            <View style={styles.content}>
                {filteredAssignments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="tasks" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No assignments found</Text>
                    </View>
                ) : (
                    filteredAssignments.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed':
            return '#4CAF50';
        case 'in_progress':
            return '#FF9800';
        case 'todo':
            return '#2196F3';
        default:
            return '#757575';
    }
};

const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'check-circle';
        case 'in_progress':
            return 'clock';
        case 'todo':
            return 'circle';
        default:
            return 'question-circle';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'high':
            return '#f44336';
        case 'medium':
            return '#ff9800';
        case 'low':
            return '#4caf50';
        default:
            return '#757575';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: Colors.light.tint,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    filterSection: {
        margin: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    filterTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 12,
    },
    filterItem: {
        flex: 1,
    },
    filterLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    pickerContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        overflow: 'hidden',
    },
    picker: {
        height: 60,
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusIcon: {
        marginRight: 8,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    cardContent: {
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 14,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    removeButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});