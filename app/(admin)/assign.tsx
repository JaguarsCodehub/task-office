import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

interface TaskAssignment {
    id: string;
    task_id: string;
    assigned_by: string;
    assigned_to: string;
    assigned_at: string;
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
    };
}

export default function TaskAssignmentsScreen() {
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const { data, error } = await supabase
                .from('task_assignments')
                .select(`
                    *,
                    task:tasks(title, priority, status),
                    assigned_by_user:users!task_assignments_assigned_by_fkey(full_name),
                    assigned_to_user:users!task_assignments_assigned_to_fkey(full_name)
                `)
                .order('assigned_at', { ascending: false });

            if (error) throw error;
            setAssignments(data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            Alert.alert('Error', 'Failed to load task assignments');
        } finally {
            setIsLoading(false);
        }
    };

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
                            fetchAssignments(); // Refresh the list
                        } catch (error) {
                            console.error('Error removing assignment:', error);
                            Alert.alert('Error', 'Failed to remove assignment');
                        }
                    },
                },
            ]
        );
    };

    const AssignmentCard = ({ assignment }: { assignment: TaskAssignment }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.taskTitle}>{assignment.task.title}</Text>
                <TouchableOpacity
                    onPress={() => handleRemoveAssignment(assignment.id)}
                    style={styles.removeButton}
                >
                    <FontAwesome name="times" size={20} color="#FF4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Assigned To:</Text>
                    <Text style={styles.value}>{assignment.assigned_to_user.full_name}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Assigned By:</Text>
                    <Text style={styles.value}>{assignment.assigned_by_user.full_name}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Assigned At:</Text>
                    <Text style={styles.value}>
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Task Status:</Text>
                    <Text style={styles.value}>{assignment.task.status}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Priority:</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(assignment.task.priority) }]}>
                        <Text style={styles.priorityText}>{assignment.task.priority}</Text>
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
            </View>

            <View style={styles.content}>
                {assignments.length === 0 ? (
                    <Text style={styles.emptyText}>No task assignments found</Text>
                ) : (
                    assignments.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'high':
            return '#FF4444';
        case 'medium':
            return '#FFA000';
        case 'low':
            return '#4CAF50';
        default:
            return '#999999';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        backgroundColor: Colors.light.tint,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cardContent: {
        padding: 16,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    priorityText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    removeButton: {
        padding: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 24,
        fontSize: 16,
    },
});