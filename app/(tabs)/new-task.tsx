import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, View, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { Picker } from '@react-native-picker/picker';

interface User {
    id: string;
    full_name: string;
}

export default function CreateTaskRequestScreen() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name')
                .not('id', 'eq', user?.id)
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to load users');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.description.trim() || !formData.assigned_to) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('user_requests')
                .insert({
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    user_id: user?.id,
                    assigned_to: formData.assigned_to,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                });

            if (error) throw error;

            Alert.alert('Success', 'Task request created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error creating task request:', error);
            Alert.alert('Error', 'Failed to create task request');
        } finally {
            setIsLoading(false);
            setFormData({ title: '', description: '', assigned_to: '' })
        }
    };

    return (
        <ScrollView style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Create User Request to others</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    value={formData.title}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                    placeholder="Enter task title"
                    placeholderTextColor="#999"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder="Enter task description"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <Text style={styles.label}>Assign To</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.assigned_to}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select a user" value="" />
                        {users.map(user => (
                            <Picker.Item
                                key={user.id}
                                label={user.full_name}
                                value={user.id}
                            />
                        ))}
                    </Picker>
                </View>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (isLoading || !formData.title || !formData.description || !formData.assigned_to) &&
                        styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isLoading || !formData.title || !formData.description || !formData.assigned_to}
                >
                    <Text style={styles.submitButtonText}>
                        {isLoading ? 'Creating...' : 'Create Request'}
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
    header: {
        padding: 16,
        backgroundColor: Colors.light.tint,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
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
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
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
    submitButton: {
        backgroundColor: Colors.light.tint,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});