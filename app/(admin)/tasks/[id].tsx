import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Task, Project } from '@/types';
import Colors from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';

export default function TaskDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const isEditing = id !== 'new';

    // Define constants to match database constraints exactly
    const PRIORITY_VALUES = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high'
    } as const;

    const STATUS_VALUES = {
        PENDING: 'pending',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed'
    } as const;

    const [task, setTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: PRIORITY_VALUES.MEDIUM,
        status: STATUS_VALUES.PENDING,  // Updated to match database constraint
        created_at: new Date().toISOString(),
        completed_at: undefined,
        image_url: '',
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        try {
            setIsLoading(true);
            if (!task.title) {
                Alert.alert('Error', 'Please fill in the title');
                return;
            }

            const taskData = {
                ...task,
                created_at: task.created_at || new Date().toISOString(),
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('tasks')
                    .update(taskData)
                    .eq('id', id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('tasks')
                    .insert(taskData);

                if (error) throw error;
            }

            router.back();
            Alert.alert('Success', `Task ${isEditing ? 'updated' : 'created'} successfully`);
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Error', 'Failed to save task');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = () => {
        // Navigate to assignment screen with task id
        router.push(`/tasks/assign/${id}`);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Edit Task' : 'New Task'}
                </Text>
            </View>

            <View style={styles.form}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={task.title}
                        onChangeText={(text) => setTask({ ...task, title: text })}
                        placeholder="Enter task title"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={task.description}
                        onChangeText={(text) => setTask({ ...task, description: text })}
                        placeholder="Enter task description"
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Priority</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={task.priority}
                            onValueChange={(value) => setTask({ ...task, priority: value })}
                            style={styles.picker}
                        >
                            <Picker.Item label="Low" value={PRIORITY_VALUES.LOW} />
                            <Picker.Item label="Medium" value={PRIORITY_VALUES.MEDIUM} />
                            <Picker.Item label="High" value={PRIORITY_VALUES.HIGH} />
                        </Picker>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Status</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={task.status}
                            onValueChange={(value) => {
                                const completed_at = value === STATUS_VALUES.COMPLETED ? new Date().toISOString() : undefined;
                                setTask({ ...task, status: value, completed_at });
                            }}
                            style={styles.picker}
                        >
                            <Picker.Item label="Pending" value={STATUS_VALUES.PENDING} />
                            <Picker.Item label="In Progress" value={STATUS_VALUES.IN_PROGRESS} />
                            <Picker.Item label="Completed" value={STATUS_VALUES.COMPLETED} />
                        </Picker>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Image URL (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={task.image_url}
                        onChangeText={(text) => setTask({ ...task, image_url: text })}
                        placeholder="Enter image URL"
                        placeholderTextColor="#666"
                    />
                </View>

                {isEditing && (
                    <TouchableOpacity
                        style={styles.assignButton}
                        onPress={handleAssign}
                    >
                        <FontAwesome name="user-plus" size={20} color="#fff" style={styles.assignIcon} />
                        <Text style={styles.assignButtonText}>Assign Task</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Text style={styles.saveButtonText}>
                        {isLoading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    form: {
        padding: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
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
    saveButton: {
        backgroundColor: Colors.light.tint,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
    formGroup: {
        marginBottom: 16,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    dateButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 16,
    },
    dateButtonText: {
        fontSize: 16,
    },
    assignButton: {
        backgroundColor: Colors.light.tint,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    assignButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    assignIcon: {
        marginRight: 8,
    },
});