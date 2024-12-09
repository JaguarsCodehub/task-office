import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
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
        <View style={styles.clientCard}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => router.push(`/(admin)/clients/${client.id}`)}
            >
                <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <Text style={styles.companyName}>{client.description}</Text>
                </View>


            </TouchableOpacity>
        </View>
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
    clientCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContent: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    companyName: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    phone: {
        fontSize: 14,
        color: '#666',
    },
    statusContainer: {
        justifyContent: 'center',
        marginLeft: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
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