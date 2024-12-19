import { Stack, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export default function AdminLayout() {
    const { user, isAdmin } = useAuth();


    // Protect admin routes
    useEffect(() => {
        if (!user || !isAdmin) {
            // Redirect non-admin users to login or home
            router.replace('/(auth)/login');
        }
    }, [user, isAdmin]);

    useEffect(() => {
        const backAction = () => {
            if (isAdmin) {
                // If the user is an admin, navigate to the auth screen
                router.push('/(auth)/login');
                return true; // Prevent default back action
            }
            return false; // Allow default back action
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove(); // Cleanup the event listener
    }, [isAdmin, router]);

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerTitle: "Admin Dashboard",
                headerBackVisible: true, // Disable back button
                gestureEnabled: true, // Disable swipe back gesture
            }}
        >
            <Stack.Screen
                name="index"
                options={{
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
            {/* <Stack.Screen
                name="users/index"
                options={{
                    title: 'Manage Users',
                    headerShown: true,
                }}
            /> */}
        </Stack>
    );
}