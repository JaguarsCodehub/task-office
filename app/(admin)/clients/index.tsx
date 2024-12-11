import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function ClientsScreen() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            Alert.alert('Error', 'Failed to fetch clients');
        } finally {
            setIsLoading(false);
        }
    };



    const ClientCard = ({ client }: { client: Client }) => (
        <TouchableOpacity
            style={styles.clientCard}
            onPress={() => router.push(`/(admin)/clients/${client.id}`)}
        >
            <View style={styles.clientHeader}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.clientDescription}>{client.description}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(admin)/clients/new')}
            >
                <FontAwesome name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Clients</Text>
                    <Text style={styles.subtitle}>{clients.length} total clients</Text>
                </View>

                {clients.map((client) => (
                    <ClientCard key={client.id} client={client} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
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
    clientCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    clientHeader: {
        marginBottom: 12,
    },
    clientName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    clientDescription: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
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