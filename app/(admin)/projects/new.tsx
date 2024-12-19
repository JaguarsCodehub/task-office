import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Project, Client } from '@/types';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/context/AuthContext';

export default function NewProject() {
    const { user } = useAuth();
    const [project, setProject] = useState<Partial<Project>>({
        name: '',
        description: '',
    });

    const [clients, setClients] = useState<Client[]>([]);
    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name');

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            Alert.alert('Error', 'Failed to load clients');
        }
    };

    const handleSave = async () => {
        try {
            if (!project.name || !project.description) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            const { error } = await supabase
                .from('projects')
                .insert({
                    ...project,
                });

            if (error) throw error;

            router.back();
            Alert.alert('Success', 'Project created successfully');
        } catch (error) {
            console.error('Error creating project:', error);
            Alert.alert('Error', 'Failed to create project');
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
                    <Text style={styles.saveButtonText}>Create Project</Text>
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