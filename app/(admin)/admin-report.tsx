import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
interface Project {
    id: string;
    name: string;
}

interface User {
    id: string;
    full_name: string;
}

interface TaskReport {
    id: string;
    task: {
        title: string;
        status: string;
    };
    assigned_to_user: {
        full_name: string;
    };
    projects: {
        name: string;
    };
    clients: {
        name: string;
    };
    hours: number;
    assigned_at: string;
    due_date: string;
    completed_at: string;
}

const AdminReport = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [reportData, setReportData] = useState<TaskReport[]>([]);
    const [totalHours, setTotalHours] = useState(0);


    const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30))); // Default to 30 days ago
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);


    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [selectedProject, selectedUser, startDate, endDate]);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name')
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };



    const fetchReportData = async () => {
        try {
            setIsLoading(true);
            let query = supabase
                .from('task_assignments')
                .select(`
                    id,
                    task:tasks (
                        title,
                        status
                    ),
                    assigned_to_user:users!task_assignments_assigned_to_fkey (
                        full_name
                    ),
                    projects!task_assignments_project_id_fkey (
                        id,
                        name
                    ),
                    clients!task_assignments_client_id_fkey (
                        id,
                        name
                    ),
                    hours,
                    assigned_at,
                    due_date,
                    completed_at
                    `)
                .gte('assigned_at', startDate.toISOString())
                .lte('assigned_at', endDate.toISOString())
                .order('assigned_at', { ascending: false });


            if (selectedProject) {
                query = query.eq('project_id', selectedProject);
            }
            if (selectedUser) {
                query = query.eq('assigned_to', selectedUser);
            }

            const { data, error } = await query;

            if (error) throw error;

            setReportData(data || []);

            // Calculate total hours
            const total = (data || []).reduce((sum, item) => sum + (item.hours || 0), 0);
            setTotalHours(total);
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(false);
        if (selectedDate) {
            // Set the start date to the beginning of the selected day
            const newDate = new Date(selectedDate);
            newDate.setHours(0, 0, 0, 0);
            setStartDate(newDate);
            // Trigger data refresh
            fetchReportData();
        }
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(false);
        if (selectedDate) {
            // Set the end date to the end of the selected day
            const newDate = new Date(selectedDate);
            newDate.setHours(23, 59, 59, 999);
            setEndDate(newDate);
            // Trigger data refresh
            fetchReportData();
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Admin Task Report</Text>
            </View>

            <View style={styles.filters}>
                <View style={styles.dateFilters}>
                    <View style={styles.datePickerContainer}>
                        <Text style={styles.label}>Start Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <FontAwesome name="calendar" size={16} color="#666" style={styles.dateIcon} />
                            <Text style={styles.dateText}>
                                {startDate.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.datePickerContainer}>
                        <Text style={styles.label}>End Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <FontAwesome name="calendar" size={16} color="#666" style={styles.dateIcon} />
                            <Text style={styles.dateText}>
                                {endDate.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Project</Text>
                    <Picker
                        selectedValue={selectedProject}
                        onValueChange={setSelectedProject}
                        style={styles.picker}
                    >
                        <Picker.Item label="All Projects" value="" />
                        {projects.map(project => (
                            <Picker.Item key={project.id} label={project.name} value={project.id} />
                        ))}
                    </Picker>
                </View>

                <View style={styles.pickerContainer}>
                    <Text style={styles.label}>User</Text>
                    <Picker
                        selectedValue={selectedUser}
                        onValueChange={setSelectedUser}
                        style={styles.picker}
                    >
                        <Picker.Item label="All Users" value="" />
                        {users.map(user => (
                            <Picker.Item key={user.id} label={user.full_name} value={user.id} />
                        ))}
                    </Picker>
                </View>
            </View>

            {Platform.OS === 'ios' ? (
                <>
                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display="inline"
                            onChange={onStartDateChange}
                            maximumDate={endDate}
                        />
                    )}

                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            display="inline"
                            onChange={onEndDateChange}
                            minimumDate={startDate}
                            maximumDate={new Date()}
                        />
                    )}
                </>
            ) : (
                <>
                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display="default"
                            onChange={onStartDateChange}
                            maximumDate={endDate}
                        />
                    )}

                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            display="default"
                            onChange={onEndDateChange}
                            minimumDate={startDate}
                            maximumDate={new Date()}
                        />
                    )}
                </>
            )}


            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Tasks</Text>
                    <Text style={styles.statValue}>{reportData.length}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Hours</Text>
                    <Text style={styles.statValue}>{totalHours.toFixed(1)}</Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.light.tint} style={styles.loader} />
            ) : (
                <View style={styles.taskList}>
                    {reportData.map((item) => (
                        <View key={item.id} style={styles.taskCard}>
                            <Text style={styles.taskTitle}>{item.task.title}</Text>
                            <View style={styles.taskDetails}>
                                <Text style={styles.taskDetail}>
                                    Project: {item.projects?.name || 'N/A'}
                                </Text>
                                <Text style={styles.taskDetail}>
                                    Client: {item.clients?.name || 'N/A'}
                                </Text>
                                <Text style={styles.taskDetail}>
                                    Assigned to: {item.assigned_to_user?.full_name}
                                </Text>
                                <Text style={styles.taskDetail}>
                                    Assigned at: {new Date(item.assigned_at).toLocaleDateString()}
                                </Text>
                                <Text style={styles.taskDetail}>
                                    Due date: {new Date(item.due_date).toLocaleDateString()}
                                </Text>
                                <Text style={styles.taskDetail}>
                                    Completed at: {new Date(item.completed_at).toLocaleDateString()}
                                </Text>
                                <Text style={styles.taskDetail}>
                                    Hours: {item.hours || 0}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.task.status) }]}>
                                <Text style={styles.statusText}>{item.task.status}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
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
        backgroundColor: '#F2F2F7',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    filters: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    pickerContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    picker: {
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.tint,
    },
    loader: {
        marginTop: 32,
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
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    taskDetails: {
        marginBottom: 8,
    },
    taskDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    dateFilters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    datePickerContainer: {
        flex: 1,
        marginRight: 8,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    dateIcon: {
        marginRight: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#000',
    }
});

export default AdminReport;