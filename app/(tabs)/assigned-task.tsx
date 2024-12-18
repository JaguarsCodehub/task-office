import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { format, subDays, isAfter, isBefore, parseISO } from 'date-fns';

interface TaskAssignment {
    id: string;
    assigned_at: string;
    project_id: string;
    client_id: string;
    start_date: string;
    due_date: string;
    narration?: string;
    projects: {
        id: string;
        name: string;
    };
    clients: {
        id: string;
        name: string;
    };
    tasks: {
        id: string;
        title: string;
        description: string;
        priority: string;
        status: string;
    };
    assigned_by_user: {
        id: string;
        full_name: string;
    };
}

const DATE_FILTERS = {
    ALL: 'all',
    TODAY: 'today',
    LAST_5_DAYS: 'last_5_days',
    UPCOMING: 'upcoming',
};

const STATUS_FILTERS = {
    ALL: 'all',
    COMPLETED: 'completed',
    IN_PROGRESS: 'in_progress',
    PENDING: 'pending',
};

const AssignedTasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskAssignment[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<TaskAssignment[]>([]);
    const [dateFilter, setDateFilter] = useState(DATE_FILTERS.ALL);
    const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS.ALL);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        filterTasks();
    }, [dateFilter, tasks, statusFilter]);

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('task_assignments')
                .select(`
                    id,
                    assigned_at,
                    project_id,
                    client_id,
                    start_date,
                    due_date,
                    narration,
                    projects:projects!task_assignments_project_id_fkey (
                        id,
                        name
                    ),
                    clients:clients!task_assignments_client_id_fkey (
                        id,
                        name
                    ),
                    tasks (
                        id,
                        title,
                        description,
                        priority,
                        status
                    ),
                    assigned_by_user:users!task_assignments_assigned_by_fkey (
                        id,
                        full_name
                    )
                `)
                .eq('assigned_to', user?.id)
                .order('assigned_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
            console.log('Fetched tasks:', data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterTasks = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filtered = tasks.filter(task => {
            if (!task.due_date) {
                return dateFilter === DATE_FILTERS.ALL;
            }

            const dueDate = parseISO(task.due_date);

            const dateMatch = (() => {
                switch (dateFilter) {
                    case DATE_FILTERS.TODAY:
                        return format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                    case DATE_FILTERS.LAST_5_DAYS:
                        const fiveDaysAgo = subDays(today, 5);
                        return isBefore(dueDate, today) && isAfter(dueDate, fiveDaysAgo);
                    case DATE_FILTERS.UPCOMING:
                        return isAfter(dueDate, today);
                    default:
                        return true;
                }
            })();

            const statusMatch = statusFilter === STATUS_FILTERS.ALL || task.tasks.status.toLowerCase() === statusFilter;

            return dateMatch && statusMatch;
        });

        setFilteredTasks(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTasks();
        setRefreshing(false);
    };

    const TaskCard = ({ task }: { task: TaskAssignment }) => (
        <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.tasks.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.tasks.priority) }]}>
                    <Text style={styles.priorityText}>{task.tasks.priority}</Text>
                </View>
            </View>
            <Text style={styles.description}>{task.tasks.description}</Text>

            {task.projects?.name && (
                <Text style={styles.projectName}>Project: {task.projects.name}</Text>
            )}
            {task.clients?.name && (
                <Text style={styles.clientName}>Client: {task.clients.name}</Text>
            )}
            <View style={styles.footer}>
                <Text style={styles.dueDate}>
                    {task.due_date
                        ? `Due: ${format(parseISO(task.due_date), 'MMM dd, yyyy')}`
                        : 'No due date set'
                    }
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.tasks.status) }]}>
                    <Text style={styles.statusText}>{task.tasks.status}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <Picker
                    selectedValue={dateFilter}
                    onValueChange={(value) => setDateFilter(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="All Tasks" value={DATE_FILTERS.ALL} />
                    <Picker.Item label="Today's Tasks" value={DATE_FILTERS.TODAY} />
                    <Picker.Item label="Last 5 Days" value={DATE_FILTERS.LAST_5_DAYS} />
                    <Picker.Item label="Upcoming Tasks" value={DATE_FILTERS.UPCOMING} />
                </Picker>
                <Picker
                    selectedValue={statusFilter}
                    onValueChange={(value) => setStatusFilter(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="All Status" value={STATUS_FILTERS.ALL} />
                    <Picker.Item label="Completed" value={STATUS_FILTERS.COMPLETED} />
                    <Picker.Item label="In Progress" value={STATUS_FILTERS.IN_PROGRESS} />
                    <Picker.Item label="Pending" value={STATUS_FILTERS.PENDING} />
                </Picker>
            </View>

            <ScrollView refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            } style={styles.taskList}>
                {isLoading ? (
                    <Text style={styles.loadingText}>Loading tasks...</Text>
                ) : filteredTasks.length === 0 ? (
                    <Text style={styles.emptyText}>No tasks found</Text>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))
                )}
            </ScrollView>
        </View>
    );
};

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

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed':
            return '#34C759';
        case 'in_progress':
            return '#FF9500';
        default:
            return '#8E8E93';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    filterContainer: {
        backgroundColor: '#fff',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    picker: {
        height: 50,
    },
    taskList: {
        padding: 16,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
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
        // marginBottom: 4,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priorityText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    projectName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        marginTop: 10
    },
    clientName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#444',
        marginBottom: 6,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dueDate: {
        fontSize: 12,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
});

export default AssignedTasks;