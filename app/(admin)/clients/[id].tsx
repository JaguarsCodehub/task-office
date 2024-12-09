import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
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
        email: '',
        phone: '',
        company: '',
        address: '',
        status: 'ACTIVE',
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
            if (!client.name || !client.email) {
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

                <Text style={styles.label}>Company</Text>
                <TextInput
                    style={styles.input}
                    value={client.company}
                    onChangeText={(text) => setClient({ ...client, company: text })}
                    placeholder="Company Name"
                />

                <Text style={styles.label}>Email *</Text>
                <TextInput
                    style={styles.input}
                    value={client.email}
                    onChangeText={(text) => setClient({ ...client, email: text })}
                    placeholder="Email Address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Phone</Text>
                <TextInput
                    style={styles.input}
                    value={client.phone}
                    onChangeText={(text) => setClient({ ...client, phone: text })}
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Address</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={client.address}
                    onChangeText={(text) => setClient({ ...client, address: text })}
                    placeholder="Address"
                    multiline
                    numberOfLines={3}
                />

                <Text style={styles.label}>Status</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={client.status}
                        onValueChange={(value) => setClient({ ...client, status: value })}
                        style={styles.picker}
                    >
                        <Picker.Item label="Active" value="ACTIVE" />
                        <Picker.Item label="Inactive" value="INACTIVE" />
                    </Picker>
                </View>

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