import { Alert, StyleSheet, Text, View, ActivityIndicator, RefreshControl, ScrollView, Modal, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

interface Request {
    id: string;
    title: string;
    description: string;
    created_at: string;
    status: string;
    assigned_to: string;
    assigned_to_user: {
        full_name: string;
    };
    user: {
        full_name: string;
    };
}

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
];

const Requests = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [statusModalVisible, setStatusModalVisible] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('user_requests')
                .select(`
                    *,
                    assigned_to_user:users!user_requests_assigned_to_fkey(full_name),
                    user:users!user_requests_user_id_fkey(full_name)
                `)
                .eq('assigned_to', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            Alert.alert('Error', 'Failed to fetch requests');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }

    const updateRequestStatus = async (requestId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('user_requests')
                .update({ status: newStatus })
                .eq('id', requestId);

            if (error) throw error;

            // Update local state
            setRequests(requests.map(request =>
                request.id === requestId
                    ? { ...request, status: newStatus }
                    : request
            ));

            Alert.alert('Success', 'Request status updated successfully');
        } catch (error) {
            console.error('Error updating request status:', error);
            Alert.alert('Error', 'Failed to update request status');
        } finally {
            setStatusModalVisible(false);
            setSelectedRequest(null);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchRequests();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return '#ff9191';
            case 'in_progress':
                return '#48a6ff';
            case 'completed':
                return '#2ecc71';
            default:
                return '#95a5a6';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const StatusUpdateModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={statusModalVisible}
            onRequestClose={() => setStatusModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Update Status</Text>
                    <Text style={styles.modalSubtitle}>{selectedRequest?.title}</Text>

                    <View style={styles.statusOptions}>
                        {STATUS_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.statusOption,
                                    { backgroundColor: getStatusColor(option.value) }
                                ]}
                                onPress={() => updateRequestStatus(selectedRequest?.id!, option.value)}
                            >
                                <Text style={styles.statusOptionText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setStatusModalVisible(false)}
                    >
                        {/* <FontAwesome name="times" size={14} color="#000" /> */}
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderCard = (request: Request) => (
        <View key={request.id} style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.title}>{request.title}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setSelectedRequest(request);
                        setStatusModalVisible(true);
                    }}
                >
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                        <Text style={styles.statusText}>{request.status}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={styles.description}>{request.description}</Text>

            <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                    <FontAwesome name="user" size={14} color="#666" />
                    <Text style={styles.metaText}>From: {request.user?.full_name}</Text>
                </View>
                <View style={styles.metaItem}>
                    <FontAwesome name="calendar" size={14} color="#666" />
                    <Text style={styles.metaText}>{formatDate(request.created_at)}</Text>
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>User Requests</Text>
                    <Text style={styles.headerSubtitle}>{requests.length} total requests</Text>
                </View>

                {requests.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="inbox" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>No requests found</Text>
                    </View>
                ) : (
                    requests.map(renderCard)
                )}
            </ScrollView>
            <StatusUpdateModal />
        </>
    )
}

export default Requests

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 12,
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
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    modalOverlay: {
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        margin: 20,
        marginTop: 100,
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    statusOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginTop: 10,
    },
    statusOption: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    statusOptionText: {
        textAlign: 'center',
        alignItems: 'center',
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    cancelButton: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginHorizontal: 5,
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
})