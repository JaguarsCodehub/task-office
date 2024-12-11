import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import Colors from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export default function ClientDetailsScreen() {
    const { id } = useLocalSearchParams();
    const isEditing = id !== 'new';

    const [client, setClient] = useState<Partial<Client>>({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (isEditing) {
            fetchClient();
        }
    }, [id]);

    const fetchClient = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) setClient(data);
        } catch (error) {
            console.error('Error fetching client:', error);
            Alert.alert('Error', 'Failed to load client data');
        }
    };

    const handleSave = async () => {
        try {
            if (!client.name) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            if (isEditing) {
                const { error } = await supabase
                    .from('clients')
                    .update(client)
                    .eq('id', id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert(client);

                if (error) throw error;
            }

            router.back();
            Alert.alert('Success', `Client ${isEditing ? 'updated' : 'created'} successfully`);
        } catch (error) {
            console.error('Error saving client:', error);
            Alert.alert('Error', 'Failed to save client');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                    style={styles.input}
                    value={client.name}
                    onChangeText={(text) => setClient({ ...client, name: text })}
                    placeholder="Client Name"
                />


                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>
                        {isEditing ? 'Update Client' : 'Create Client'}
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