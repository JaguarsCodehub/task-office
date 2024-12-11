import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, Image, ScrollView, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { uploadImageAsync } from '@/lib/uploadImage';
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker for selecting images
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function UserProfileScreen() {
    const { user } = useAuth();
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [newUsername, setNewUsername] = useState('');
    const [newFullName, setNewFullName] = useState('');

    const handleUpdateProfile = async () => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ full_name: fullName, username, avatar_url: avatarUrl })
                .eq('id', user?.id);

            if (error) throw error;

            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert("Permission required", "You need to grant permission to access the media library.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });

        if (!result.canceled) {
            const { uri } = result.assets[0];
            try {
                const imageUrl = await uploadImageAsync(uri);
                if (imageUrl) {
                    setAvatarUrl(imageUrl);
                } else {
                    Alert.alert('Error', 'Could not upload image');
                }
            } catch (error) {
                Alert.alert('Error', 'Could not upload image');
                console.error(error);
            }
        }
    };


    const updateProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    username: newUsername,
                    full_name: newFullName,
                    avatar_url: avatarUrl
                })
                .eq('id', user?.id);

            if (error) {
                throw error;
            } else {
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not update profile');
            console.error(error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{
                headerShown: false,
            }} />
            <Text style={styles.title}>User Profile</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />

            <View style={{ marginTop: 4, backgroundColor: 'transparent' }}>
                <Text style={{ fontSize: 20, fontFamily: "MontserratSemibold" }}>Your Profile Photo</Text>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: avatarUrl }}
                        style={styles.profileImage}
                        resizeMode='cover'
                    />
                    <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
                        <Ionicons name="camera" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>


            <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
                <Text style={styles.buttonText}>Update Profile</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    button: {
        backgroundColor: Colors.light.tint,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 50
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    imageContainer: {
        position: 'relative',
        width: 200,
        height: 200,
        marginTop: 10,
        backgroundColor: 'transparent',
    },
    profileImage: {
        borderRadius: 100,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
    editIcon: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: '#00000080',
        padding: 5,
        borderRadius: 20,
    },
});