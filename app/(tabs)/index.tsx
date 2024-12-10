import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
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
  project?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    due_date: string;
  };
  assigned_by_user: {
    id: string;
    full_name: string;
  };
}

interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

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
                    )
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
      onPress={() => router.push(`/tasks/${assignment.task.id}`)}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{assignment.task.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(assignment.task.priority) }]}>
          <Text style={styles.priorityText}>{assignment.task.priority}</Text>
        </View>
      </View>
      {assignment.project?.name && (
        <Text style={styles.projectName}>Project: {assignment.project.name}</Text>
      )}
      {assignment.client?.name && (
        <Text style={styles.clientName}>Client: {assignment.client.name}</Text>
      )}
      <Text style={styles.assignedBy}>
        Assigned by {assignment.assigned_by_user?.full_name || 'Unknown'}
      </Text>
      {assignment.task.due_date && (
        <Text style={styles.dueDate}>
          Due {new Date(assignment.task.due_date).toLocaleDateString()}
        </Text>
      )}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment.task.status) }]}>
        <Text style={styles.statusText}>{assignment.task.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
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
});
