import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/ToastContext';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinGroup'>;

export default function JoinGroupScreen({ navigation, route }: Props) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const userId = route.params?.userId; // Assuming passed from previous screen or context

    const handleJoin = async () => {
        if (!code) {
            showToast('Please enter the group code', 'error');
            return;
        }

        if (code.length !== 6) {
            showToast('Code must be 6 characters', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/groups/join', { group_code: code });

            showToast(response.data.message || 'Joined group successfully!', 'success');

            // Navigate to Dashboard with refresh param or similar
            navigation.replace('PilgrimDashboard', { userId });

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to join group';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.title}>Join a Group</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="qr-code-outline" size={64} color="#2563eb" />
                </View>

                <Text style={styles.instructions}>
                    Enter the 6-character code provided by your group moderator.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="e.g. AB12CD"
                    placeholderTextColor="#94a3b8"
                    value={code}
                    onChangeText={(text) => setCode(text.toUpperCase())}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />

                <TouchableOpacity
                    style={[styles.button, (!code || loading) && styles.buttonDisabled]}
                    onPress={handleJoin}
                    disabled={!code || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Join Group</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        paddingTop: 60,
    },
    iconContainer: {
        width: 120,
        height: 120,
        backgroundColor: '#eff6ff',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    instructions: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'center',
        letterSpacing: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    button: {
        width: '100%',
        backgroundColor: '#2563eb',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
