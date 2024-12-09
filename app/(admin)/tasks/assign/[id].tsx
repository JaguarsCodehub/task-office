import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { User, Task } from '@/types';
import Colors from '@/constants/Colors';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/context/AuthContext';

export default function AssignTaskScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [taskData, usersData] = await Promise.all([
                supabase.from('tasks').select('*').eq('id', id).single(),
                supabase.from('users').select('*').order('full_name')
            ]);

            if (taskData.error) throw taskData.error;
            if (usersData.error) throw usersData.error;

            setTask(taskData.data);
            setUsers(usersData.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load task details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = async () => {
        try {
            if (!selectedUserId) {
                Alert.alert('Error', 'Please select a user to assign');
                return;
            }

            setIsLoading(true);
            const { error } = await supabase
                .from('task_assignments')
                .insert({
                    task_id: id,
                    assigned_by: user?.id,
                    assigned_to: selectedUserId,
                    assigned_at: new Date().toISOString(),
                });

            if (error) throw error;

            Alert.alert('Success', 'Task assigned successfully');
            router.back();
        } catch (error) {
            console.error('Error assigning task:', error);
            Alert.alert('Error', 'Failed to assign task');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Assign Task</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.taskDetailsCard}>
                    <Text style={styles.taskTitle}>{task?.title}</Text>
                    <Text style={styles.taskDescription}>{task?.description || 'No description'}</Text>
                    <View style={styles.taskMetadata}>
                        <View style={styles.metadataItem}>
                            <Text style={styles.metadataLabel}>Priority:</Text>
                            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task?.priority) }]}>
                                <Text style={styles.priorityText}>{task?.priority}</Text>
                            </View>
                        </View>
                        <View style={styles.metadataItem}>
                            <Text style={styles.metadataLabel}>Status:</Text>
                            <Text style={styles.metadataValue}>{task?.status}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Assign To</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedUserId}
                        onValueChange={(value) => setSelectedUserId(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select a user" value="" />
                        {users.map(user => (
                            <Picker.Item
                                key={user.id}
                                label={user.full_name}
                                value={user.id}
                            />
                        ))}
                    </Picker>
                </View>

                <TouchableOpacity
                    style={[
                        styles.assignButton,
                        (!selectedUserId || isLoading) && styles.assignButtonDisabled
                    ]}
                    onPress={handleAssign}
                    disabled={!selectedUserId || isLoading}
                >
                    <Text style={styles.assignButtonText}>
                        {isLoading ? 'Assigning...' : 'Assign Task'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
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
        marginBottom: 8,
    },
    taskDetailsCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    taskDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    taskMetadata: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metadataLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    metadataValue: {
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    content: {
        padding: 16,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 16,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    assignButton: {
        backgroundColor: Colors.light.tint,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    assignButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    assignButtonDisabled: {
        opacity: 0.5,
    },
});