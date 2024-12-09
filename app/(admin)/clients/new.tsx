import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';

export default function NewClient() {
    const [client, setClient] = useState<Partial<Client>>({
        name: '',
        description: '',
    });

    const handleSave = async () => {
        try {
            if (!client.name) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            const { error } = await supabase
                .from('clients')
                .insert(client);
            if (error) throw error;

            router.back();
            Alert.alert('Success', 'Client created successfully');
        } catch (error) {
            console.error('Error creating client:', error);
            Alert.alert('Error', 'Failed to create client');
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

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    value={client.description}
                    onChangeText={(text) => setClient({ ...client, description: text })}
                    placeholder="Description"
                    multiline
                    numberOfLines={3}
                />

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>Create Client</Text>
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