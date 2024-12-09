import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
    const { user, isAdmin } = useAuth();

    // Redirect if not authenticated or not an admin
    if (!user || !isAdmin) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Admin Dashboard',
                    headerShown: true,
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