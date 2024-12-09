import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Project, Client, User } from '@/types';
import Colors from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function ProjectDetailsScreen() {
    const { id } = useLocalSearchParams();
    const isEditing = id !== 'new';

    const [project, setProject] = useState<Partial<Project>>({
        name: '',
        description: '',
    });

    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [managers, setManagers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [clientsData, managersData] = await Promise.all([
                supabase.from('clients').select('*').eq('status', 'ACTIVE'),
                supabase.from('users').select('*').eq('role', 'MANAGER'),
            ]);

            if (clientsData.error) throw clientsData.error;
            if (managersData.error) throw managersData.error;

            setClients(clientsData.data || []);
            setManagers(managersData.data || []);

            if (isEditing) {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) setProject(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!project.name) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            if (isEditing) {
                const { error } = await supabase
                    .from('projects')
                    .update(project)
                    .eq('id', id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('projects')
                    .insert(project);

                if (error) throw error;
            }

            router.back();
            Alert.alert('Success', `Project ${isEditing ? 'updated' : 'created'} successfully`);
        } catch (error) {
            console.error('Error saving project:', error);
            Alert.alert('Error', 'Failed to save project');
        }
    };

    const handleDateChange = (event: any, selectedDate: Date | undefined, dateType: 'start' | 'end') => {
        if (Platform.OS === 'android') {
            setShowStartDate(false);
            setShowEndDate(false);
        }

        if (selectedDate) {
            setProject({
                ...project,
                [dateType === 'start' ? 'start_date' : 'end_date']: selectedDate.toISOString(),
            });
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    value={project.name}
                    onChangeText={(text) => setProject({ ...project, name: text })}
                    placeholder="Project Title"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={project.description}
                    onChangeText={(text) => setProject({ ...project, description: text })}
                    placeholder="Project Description"
                    multiline
                    numberOfLines={4}
                />


                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>
                        {isEditing ? 'Update Project' : 'Create Project'}
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
    dateButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 16,
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
});