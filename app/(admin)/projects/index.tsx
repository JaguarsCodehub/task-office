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
                <Text style={styles.projectDescription}>{project.description}</Text>
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
        backgroundColor: '#fff',
        paddingHorizontal: 20,
    },
    content: {
        paddingVertical: 20,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    projectCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    projectHeader: {
        marginBottom: 12,
    },
    projectTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    projectDescription: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    projectFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    priorityText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        zIndex: 1,
    },
});