import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types';
import { router } from 'expo-router';

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
    isManager: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and subscribe to auth changes
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchUserData(session.user.id);
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                await fetchUserData(session.user.id);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Add effect to handle routing when user state changes
    useEffect(() => {
        if (user) {
            console.log('User role:', user.role); // Debug log
            if (user.role.toUpperCase() === 'ADMIN') {
                router.replace('/(admin)');
            } else {
                router.replace('/(tabs)');
            }
        }
    }, [user]);

    const fetchUserData = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                console.log('Fetched user data:', data);

                // Check if user is inactive
                if (!data.is_active) {
                    await supabase.auth.signOut();
                    throw new Error('Your account has been deactivated. Please contact your administrator.');
                }

                setUser(data);
                console.log('User role:', data.role);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Check if user is active
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('is_active, role')
                .eq('id', authData.session?.user.id)
                .single();

            if (userError) throw userError;

            if (userData.is_active === false) {
                await supabase.auth.signOut();
                throw new Error('Your account has been deactivated. Please contact your administrator.');
            }

            // Fetch complete user data
            await fetchUserData(authData.session?.user.id);

            // Handle routing based on role
            if (userData.role.toUpperCase() === 'ADMIN') {
                router.replace('/(admin)');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error) {
            throw error;
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        router.replace('/(auth)/login');
    };

    const value = {
        user,
        isLoading,
        signIn,
        signOut,
        isAdmin: user?.role?.toUpperCase() === 'ADMIN',
        isManager: user?.role?.toUpperCase() === 'MANAGER',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};