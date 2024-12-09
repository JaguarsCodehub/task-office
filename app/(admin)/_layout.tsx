import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AdminLayout() {
    const { user, isAdmin } = useAuth();

    // Protect admin routes
    useEffect(() => {
        if (!user || !isAdmin) {
            // Redirect non-admin users to login or home
            router.replace('/');
        }
    }, [user, isAdmin]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerBackVisible: false, // Disable back button
                gestureEnabled: false, // Disable swipe back gesture
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="users"
                options={{
                    title: 'Manage Users',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="tasks"
                options={{
                    title: 'Manage Tasks',
                    headerShown: true,
                }}
            />
        </Stack>
    );
}