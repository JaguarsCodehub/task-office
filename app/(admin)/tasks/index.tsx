import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Task, Project, User } from '@/types';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

interface TaskWithDetails extends Task {
    project: { name: string };
    creator: { full_name: string };
}

export default function TasksScreen() {
    const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedPriority, setSelectedPriority] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksData, projectsData, usersData] = await Promise.all([
                supabase
                    .from('tasks')
                    .select(`
                        *
                    `)
                    .order('created_at', { ascending: false }),
                supabase.from('projects').select('*'),
                supabase.from('users').select('*'),
            ]);

            if (tasksData.error) throw tasksData.error;
            if (projectsData.error) throw projectsData.error;
            if (usersData.error) throw usersData.error;

            setTasks(tasksData.data || []);
            setProjects(projectsData.data || []);
            setUsers(usersData.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch tasks');
        } finally {
            setIsLoading(false);
        }
    };

    const getFilteredTasks = () => {
        return tasks.filter(task => {
            const matchesProject = !selectedProject || task.project_id === selectedProject;
            const matchesStatus = !selectedStatus || task.status === selectedStatus;
            const matchesPriority = !selectedPriority || task.priority === selectedPriority;
            const matchesSearch = !searchQuery ||
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesProject && matchesStatus && matchesPriority && matchesSearch;
        });
    };

    const TaskCard = ({ task }: { task: TaskWithDetails }) => (
        <TouchableOpacity
            style={styles.taskCard}
            onPress={() => router.push({
                pathname: "/(admin)/tasks/assign/[id]",
                params: { id: task.id }
            })}
        >
            <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                    <Text style={styles.priorityText}>{task.priority}</Text>
                </View>
            </View>
            <Text style={styles.projectName}>Description: {task.description}</Text>
            <View style={styles.footer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                    <Text style={styles.statusText}>{(task.status).toUpperCase()}</Text>
                </View>
                <Text style={styles.dueDate}>
                    Created at: {new Date(task.created_at).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const getStatusColor = (status: string) => {
        const colors = {
            'TODO': '#FFB020',
            'IN_PROGRESS': '#14B8A6',
            'REVIEW': '#9333EA',
            'COMPLETED': '#43A047'
        };
        return colors[status as keyof typeof colors] || Colors.light.tint;
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            'LOW': '#14B8A6',
            'MEDIUM': '#FFB020',
            'HIGH': '#D14343'
        };
        return colors[priority as keyof typeof colors] || Colors.light.tint;
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(admin)/tasks/new')}
            >
                <FontAwesome name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Tasks</Text>
                    <Text style={styles.subtitle}>{tasks.length} total tasks</Text>
                </View>

                <View style={styles.filters}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    <View style={styles.filterRow}>
                        <View style={styles.filterPicker}>
                            <Picker
                                selectedValue={selectedStatus}
                                onValueChange={setSelectedStatus}
                                style={styles.picker}
                            >
                                <Picker.Item label="All Statuses" value="" />
                                <Picker.Item label="PENDING" value="pending" />
                                <Picker.Item label="IN_PROGRESS" value="in_progress" />
                                <Picker.Item label="COMPLETED" value="completed" />
                            </Picker>
                        </View>

                        <View style={styles.filterPicker}>
                            <Picker
                                selectedValue={selectedPriority}
                                onValueChange={setSelectedPriority}
                                style={styles.picker}
                            >
                                <Picker.Item label="All Priorities" value="" />
                                <Picker.Item label="Low" value="low" />
                                <Picker.Item label="Medium" value="medium" />
                                <Picker.Item label="High" value="high" />
                            </Picker>
                        </View>
                    </View>
                </View>

                {getFilteredTasks().map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    content: {
        paddingVertical: 20,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
    filters: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchInput: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 12,
    },
    filterPicker: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    picker: {
        height: 60,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    projectName: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#e0e0e0',
    },
    priorityText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#e0e0e0',
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    dueDate: {
        fontSize: 14,
        color: '#666',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: Colors.light.tint,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        zIndex: 1,
    },
});