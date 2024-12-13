import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { User, Task, Project, Client } from '@/types';
import Colors from '@/constants/Colors';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5 } from '@expo/vector-icons';

export default function AssignTaskScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [dueDate, setDueDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [taskData, usersData, projectsData, clientsData] = await Promise.all([
                supabase.from('tasks').select('*').eq('id', id).single(),
                supabase.from('users').select('*').order('full_name'),
                supabase.from('projects').select('*').order('name'),
                supabase.from('clients').select('*').order('name')
            ]);

            if (taskData.error) throw taskData.error;
            if (usersData.error) throw usersData.error;
            if (projectsData.error) throw projectsData.error;
            if (clientsData.error) throw clientsData.error;

            setTask(taskData.data);
            setUsers(usersData.data || []);
            setProjects(projectsData.data || []);
            setClients(clientsData.data || []);
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
                    project_id: selectedProjectId,
                    client_id: selectedClientId,
                    start_date: startDate.toISOString(),
                    due_date: dueDate.toISOString(),
                    assigned_at: new Date().toISOString(),
                });

            if (error) throw error;

            // Get user's push token
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('push_token')
                .eq('id', selectedUserId)
                .single();

            console.log('User push token:', userData?.push_token);

            if (userData?.push_token) {
                // Use Expo's push notification service directly
                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: userData.push_token,
                        title: 'New Task Assigned',
                        body: `You have been assigned a new task: ${task?.title}`,
                        data: { taskId: id },
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to send notification');
                }
            }

            Alert.alert('Success', 'Task assigned successfully');
            router.back();
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'Failed to assign task');
        } finally {
            setIsLoading(false);
        }
    };

    const SelectField = ({
        label,
        items,
        selectedValue,
        onValueChange,
        placeholder
    }: {
        label: string;
        items: any[];
        selectedValue: string;
        onValueChange: (value: string) => void;
        placeholder: string;
    }) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange}
                    style={styles.picker}
                >
                    <Picker.Item label={placeholder} value="" />
                    {items.map(item => (
                        <Picker.Item
                            key={item.id}
                            label={item.name || item.full_name}
                            value={item.id}
                        />
                    ))}
                </Picker>
            </View>
        </View>
    );

    const DateField = ({
        label,
        value,
        onPress,
        showPicker,
        onDateChange,
        minimumDate
    }: {
        label: string;
        value: Date;
        onPress: () => void;
        showPicker: boolean;
        onDateChange: (event: any, date?: Date) => void;
        minimumDate?: Date;
    }) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TouchableOpacity
                style={styles.datePickerButton}
                onPress={onPress}
            >
                <FontAwesome5 name="calendar-alt" size={16} color={Colors.light.tint} />
                <Text style={styles.dateText}>
                    {value.toLocaleDateString()}
                </Text>
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    value={value}
                    mode="date"
                    onChange={(event, date) => {
                        if (date) onDateChange(event, date);
                        if (label.includes('Start')) {
                            setShowStartDatePicker(false);
                        } else {
                            setShowDueDatePicker(false);
                        }
                    }}
                    minimumDate={minimumDate}
                />
            )}
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
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Assign Task' }} />
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
                    </View>
                </View>

                <SelectField
                    label="Assign To"
                    items={users}
                    selectedValue={selectedUserId}
                    onValueChange={setSelectedUserId}
                    placeholder="Select a user"
                />

                <SelectField
                    label="Project"
                    items={projects}
                    selectedValue={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    placeholder="Select a project"
                />

                <SelectField
                    label="Client"
                    items={clients}
                    selectedValue={selectedClientId}
                    onValueChange={setSelectedClientId}
                    placeholder="Select a client"
                />

                <DateField
                    label="Start Date"
                    value={startDate}
                    onPress={() => setShowStartDatePicker(true)}
                    showPicker={showStartDatePicker}
                    onDateChange={(_, date) => {
                        if (date) setStartDate(date);
                    }}
                    minimumDate={new Date()}
                />

                <DateField
                    label="Due Date"
                    value={dueDate}
                    onPress={() => setShowDueDatePicker(true)}
                    showPicker={showDueDatePicker}
                    onDateChange={(_, date) => {
                        if (date) setDueDate(date);
                    }}
                    minimumDate={startDate}
                />

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
    content: {
        padding: 16,
    },
    taskDetailsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    assignButton: {
        backgroundColor: Colors.light.tint,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    assignButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    assignButtonDisabled: {
        opacity: 0.5,
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
});