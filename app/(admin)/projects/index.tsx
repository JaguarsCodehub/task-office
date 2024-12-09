import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Project, Client } from '@/types';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function ProjectsScreen() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            Alert.alert('Error', 'Failed to fetch projects');
        } finally {
            setIsLoading(false);
        }
    };

    const ProjectCard = ({ project }: { project: Project }) => (
        <TouchableOpacity
            style={styles.projectCard}
            onPress={() => router.push(`/(admin)/projects/${project.id}`)}
        >
            <View style={styles.projectHeader}>
                <Text style={styles.projectTitle}>{project.name}</Text>
                <Text style={styles.projectTitle}>{project.description}</Text>
            </View>




        </TouchableOpacity>
    );

    const getStatusColor = (status: string) => {
        const colors = {
            'PLANNING': '#FFB020',
            'IN_PROGRESS': '#14B8A6',
            'ON_HOLD': '#D14343',
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
                onPress={() => router.push('/(admin)/projects/new')}
            >
                <FontAwesome name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Projects</Text>
                    <Text style={styles.subtitle}>{projects.length} total projects</Text>
                </View>

                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    projectCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    projectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    projectTitle: {
        fontSize: 18,
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
    clientName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    dates: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    budget: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.tint,
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