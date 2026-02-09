import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api } from '../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeratorMessagesScreen'>;

interface Message {
    _id: string;
    type: 'text' | 'voice' | 'tts';
    content?: string;
    media_url?: string;
    original_text?: string;
    is_urgent?: boolean;
    sender_id: {
        _id: string;
        full_name: string;
        role?: string;
    };
    sender_model: 'User' | 'Pilgrim';
    created_at: string;
}

export default function ModeratorMessagesScreen({ navigation, route }: Props) {
    const { groupId, groupName } = route.params;
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/messages/group/${groupId}`);

            // Sort messages by createdAt descending (newest first for moderator view)
            const fetchedMessages = response.data.data.sort((a: Message, b: Message) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setMessages(fetchedMessages);
        } catch (error) {
            console.error('Fetch messages error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (messageId: string) => {
        Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/messages/${messageId}`);
                            setMessages(prev => prev.filter(msg => msg._id !== messageId));
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete message');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isVoice = item.type === 'voice';
        const isTts = item.type === 'tts';

        return (
            <View style={[
                styles.messageCard,
                item.is_urgent && styles.urgentMessage
            ]}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <Ionicons
                            name={
                                isTts ? "volume-high" :
                                    isVoice ? "mic" :
                                        "chatbubble-ellipses"
                            }
                            size={18}
                            color={item.is_urgent ? "#EF4444" : "#3B82F6"}
                        />
                        <Text style={styles.typeLabel}>
                            {isTts ? 'TTS' : isVoice ? 'Voice' : 'Text'}
                        </Text>
                        {item.is_urgent && (
                            <View style={styles.urgentBadge}>
                                <Text style={styles.urgentText}>URGENT</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDelete(item._id)}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                {item.type === 'text' && (
                    <Text style={styles.content}>{item.content}</Text>
                )}

                {isTts && (
                    <Text style={styles.content}>{item.original_text}</Text>
                )}

                {isVoice && (
                    <Text style={styles.voiceIndicator}>🎤 Voice message</Text>
                )}

                <View style={styles.footer}>
                    <Text style={styles.time}>
                        {new Date(item.created_at).toLocaleString()}
                    </Text>
                    <Text style={styles.sender}>
                        Sent by: {item.sender_id.full_name}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>{groupName}</Text>
                    <Text style={styles.subtitle}>Sent Messages</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
            ) : (
                <FlatList
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No messages sent yet.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        marginRight: 16,
        padding: 4,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    list: {
        padding: 16,
        paddingBottom: 32,
    },
    loader: {
        marginTop: 50,
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#94A3B8',
        fontSize: 15,
    },
    messageCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    urgentMessage: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    typeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    urgentBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginLeft: 8,
    },
    urgentText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    deleteButton: {
        padding: 8,
    },
    content: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 21,
        marginBottom: 10,
    },
    voiceIndicator: {
        fontSize: 14,
        color: '#64748B',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    time: {
        fontSize: 11,
        color: '#94A3B8',
    },
    sender: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
});
