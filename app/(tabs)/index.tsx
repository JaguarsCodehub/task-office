import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Text, View, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

interface TaskAssignment {
  id: string;
  assigned_at: string;
  project_id: string;
  client_id: string;
  projects: {
    id: string;
    name: string;
  };
  clients: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;

    narration?: string;
  };
  assigned_by_user: {
    id: string;
    full_name: string;
  };
  hours_taken?: number;
  due_date: string;
}

interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

interface TaskStatus {
  value: string;
  label: string;
}

const TASK_STATUSES: TaskStatus[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [taskNarration, setTaskNarration] = useState('');
  const [taskStatus, setTaskStatus] = useState('');

  const [totalHoursTaken, setTotalHoursTaken] = useState(0);
  const [hoursInput, setHoursInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  const fetchAssignedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
                    id,
                    assigned_at,
                    project_id,
                    client_id,
                    projects!task_assignments_project_id_fkey (
                        id,
                        name
                    ),
                    clients!task_assignments_client_id_fkey (
                      id,
                      name
                    ),
                    task:tasks (
                        id,
                        title,
                        description,
                        priority,
                        status
                    ),
                    assigned_by_user:users!task_assignments_assigned_by_fkey (
                        id,
                        full_name
                    ),
                    narration,
                    due_date
                `)
        .eq('assigned_to', user?.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      setAssignments(data || []);

      // Calculate stats
      const taskStats = (data || []).reduce(
        (acc, assignment) => {
          acc.total++;
          switch (assignment.task.status.toLowerCase()) {
            case 'completed':
              acc.completed++;
              break;
            case 'in_progress':
              acc.inProgress++;
              break;
            default:
              acc.pending++;
          }
          return acc;
        },
        { total: 0, completed: 0, inProgress: 0, pending: 0 }
      );

      setStats(taskStats);
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = async () => {
    if (!hoursInput) {
      Alert.alert("Add Hours First", "You need to first add the hours")
    }
    try {

      const updates = [];

      // Update narration in task_assignments table
      updates.push(
        supabase
          .from('task_assignments')
          .update({
            narration: taskNarration,
            hours: hoursInput ? parseFloat(hoursInput) : null,
            completed_at: new Date().toISOString()
          })
          .eq('id', selectedTask?.id)
      );

      // Update status in tasks table
      updates.push(
        supabase
          .from('tasks')
          .update({ status: taskStatus })
          .eq('id', selectedTask?.task.id)
      );

      // Execute all updates
      const results = await Promise.all(updates);

      // Check for errors in any of the updates
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      // Refresh the task list
      await fetchAssignedTasks();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <FontAwesome name={icon as any} size={24} color={color} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const TaskCard = ({ assignment }: { assignment: TaskAssignment }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => {
        setSelectedTask(assignment);
        setTaskStatus(assignment.task.status);
        setTaskNarration(assignment.task.narration || '');
        setHoursInput(assignment.hours_taken?.toString() || '');
        setIsModalVisible(true);
      }}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{assignment.task.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(assignment.task.priority) }]}>
          <Text style={styles.priorityText}>{assignment.task.priority}</Text>
        </View>
      </View>
      {assignment.projects?.name && (
        <Text style={styles.projectName}>Project: {assignment.projects.name}</Text>
      )}
      {assignment.clients?.name && (
        <Text style={styles.clientName}>Client: {assignment.clients.name}</Text>
      )}
      <Text style={styles.assignedBy}>
        Assigned by {assignment.assigned_by_user?.full_name || 'Unknown'}
      </Text>
      {assignment.due_date && (
        <Text style={styles.dueDate}>
          Due {new Date(assignment.due_date).toLocaleDateString()}
        </Text>
      )}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment.task.status) }]}>
        <Text style={styles.statusText}>{assignment.task.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssignedTasks();
    setRefreshing(false);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user?.full_name}</Text>
        </View>

        <View style={styles.statsContainer}>
          <StatCard title="Total Tasks" value={stats.total} icon="tasks" color="#007AFF" />
          <StatCard title="In Progress" value={stats.inProgress} icon="spinner" color="#FF9500" />
          <StatCard title="Completed" value={stats.completed} icon="check-circle" color="#34C759" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Assigned Tasks</Text>
          {assignments.length === 0 ? (
            <Text style={styles.emptyText}>No tasks assigned yet</Text>
          ) : (
            assignments.map((assignment) => (
              <TaskCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Task</Text>

            <Text style={styles.modalLabel}>Status</Text>
            <View style={styles.statusButtons}>
              {TASK_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusButton,
                    taskStatus === status.value && styles.statusButtonActive,
                  ]}
                  onPress={() => setTaskStatus(status.value)}
                >
                  <Text style={[
                    styles.statusButtonText,
                    taskStatus === status.value && styles.statusButtonTextActive,
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Hours Taken</Text>
            <TextInput
              style={styles.hoursInput}
              keyboardType="numeric"
              value={hoursInput}
              onChangeText={setHoursInput}
              placeholder="Enter hours taken"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleTaskUpdate}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  assignedBy: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
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
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  statusButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusButton: {
    flex: 1,
    padding: 5,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 5
  },
  statusButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  statusButtonText: {
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  narrationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  hoursInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    height: 45,
  },
});
