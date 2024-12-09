import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // fetchDashboardData();
  }, []);

  // const fetchDashboardData = async () => {
  //   try {
  //     // Fetch task statistics
  //     const { data: tasksData, error: tasksError } = await supabase
  //       .from('tasks')
  //       .select('status')
  //       .eq('assigned_to', user?.id);

  //     if (tasksError) throw tasksError;

  //     const stats = tasksData.reduce(
  //       (acc, task) => {
  //         acc.total++;
  //         if (task.status === 'COMPLETED') acc.completed++;
  //         else if (task.status === 'IN_PROGRESS') acc.inProgress++;
  //         else acc.pending++;
  //         return acc;
  //       },
  //       { total: 0, completed: 0, inProgress: 0, pending: 0 }
  //     );

  //     setStats(stats);

  //     // Fetch recent tasks
  //     const { data: recentData, error: recentError } = await supabase
  //       .from('tasks')
  //       .select(`
  //         *,
  //         project:projects(name)
  //       `)
  //       .eq('assigned_to', user?.id)
  //       .order('created_at', { ascending: false })
  //       .limit(5);

  //     if (recentError) throw recentError;
  //     setRecentTasks(recentData);
  //   } catch (error) {
  //     console.error('Error fetching dashboard data:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <FontAwesome name={icon as any} size={24} color={color} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/tasks')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
          // onPress={() => router.push(`/tasks/${task.id}`)}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                <Text style={styles.statusText}>{task.status}</Text>
              </View>
            </View>
            <Text style={styles.projectName}>{task.project.name}</Text>
            <Text style={styles.dueDate}>Due {new Date(task.due_date).toLocaleDateString()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
          // onPress={() => router.push('/tasks/new')}
          >
            <FontAwesome name="plus" size={20} color={Colors.light.tint} />
            <Text style={styles.actionButtonText}>New Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
          // onPress={() => router.push('/projects/new')}
          >
            <FontAwesome name="folder" size={20} color={Colors.light.tint} />
            <Text style={styles.actionButtonText}>New Project</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#34C759';
    case 'IN_PROGRESS':
      return '#FF9500';
    default:
      return '#8E8E93';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: Colors.light.tint,
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
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  projectName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
  },
  quickActions: {
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});
