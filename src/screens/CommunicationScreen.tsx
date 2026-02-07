import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/ToastContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunicationScreen'>;

interface Session {
    _id: string;
    type: 'voice_call' | 'video_call' | 'walkie_talkie';
    initiator_id: {
        _id: string;
        full_name: string;
    };
    status: 'active' | 'ended';
    started_at: string;
}

export default function CommunicationScreen({ navigation, route }: Props) {
    const { groupId } = route.params;
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await api.get(`/communication/sessions/${groupId}`);
            setSessions(response.data.data);
        } catch (error) {
            console.error('Fetch sessions error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSession = async (sessionId: string) => {
        try {
            await api.post('/communication/join-session', { session_id: sessionId });
            showToast('Joined session (Simulation)', 'success');
            // In a real app, this would navigate to a WebRTC screen or activate audio
        } catch (error: any) {
            showToast('Failed to join session', 'error');
        }
    };

    const renderItem = ({ item }: { item: Session }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name={item.type === 'walkie_talkie' ? 'radio' : 'call'}
                    size={24}
                    color="#2563eb"
                />
            </View>
            <View style={styles.info}>
                <Text style={styles.type}>
                    {item.type === 'walkie_talkie' ? 'Walkie Talkie' : 'Voice Call'}
                </Text>
                <Text style={styles.initiator}>Started by: {item.initiator_id.full_name}</Text>
                <Text style={styles.time}>{new Date(item.started_at).toLocaleTimeString()}</Text>
            </View>
            <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinSession(item._id)}
            >
                <Text style={styles.joinText}>Join</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.title}>Active Sessions</Text>
            </View>

            <FlatList
                data={sessions}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchSessions} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="headset-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No active communication sessions</Text>
                    </View>
                }
            />
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
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    type: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    initiator: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
    },
    time: {
        fontSize: 12,
        color: '#94a3b8',
    },
    joinButton: {
        backgroundColor: '#22c55e',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    joinText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    empty: {
        alignItems: 'center',
        marginTop: 64,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
    },
});
