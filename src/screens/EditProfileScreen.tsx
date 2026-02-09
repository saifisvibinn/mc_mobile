import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView, Platform, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/types';
import { api, BASE_URL } from '../services/api';
import { useToast } from '../components/ToastContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
    const { t, i18n } = useTranslation();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isPilgrim, setIsPilgrim] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data) {
                setName(response.data.full_name);
                setPhone(response.data.phone_number);

                // Check if this is a pilgrim (has national_id field)
                if (response.data.national_id) {
                    setIsPilgrim(true);
                    setAge(response.data.age?.toString() || '');
                    setGender(response.data.gender || '');
                    setMedicalHistory(response.data.medical_history || '');
                }

                if (response.data.profile_picture) {
                    setProfileImage(`${BASE_URL.replace('/api', '')}/uploads/${response.data.profile_picture}`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
            showToast(t('failed_load_profile'), 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name || !phone) {
            showToast(t('name_phone_required'), 'error');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('full_name', name);
            formData.append('phone_number', phone);

            // Add pilgrim-specific fields if user is a pilgrim
            if (isPilgrim) {
                if (age) formData.append('age', age);
                if (gender) formData.append('gender', gender);
                if (medicalHistory !== undefined) formData.append('medical_history', medicalHistory);
            }

            if (profileImage && !profileImage.startsWith('http')) {
                // It's a new local image
                const filename = profileImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('profile_picture', {
                    uri: profileImage,
                    name: filename || 'profile.jpg',
                    type,
                } as any);
            }

            await api.put('/auth/update-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showToast(t('profile_updated_success'), 'success');
            navigation.goBack();
        } catch (error: any) {
            console.error('Update error:', error);
            showToast(error.response?.data?.message || t('failed_update_profile'), 'error');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const isRTL = i18n.language === 'ar' || i18n.language === 'ur';
    const alignStyle = { textAlign: isRTL ? 'right' : 'left' } as const;

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header} edges={['top']}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('edit_profile')}</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
                    {loading ? <ActivityIndicator size="small" color="#007AFF" /> : <Text style={styles.saveButtonText}>{t('save')}</Text>}
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.imageContainer}>
                    <View style={styles.imageWrapper}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={[styles.profileImage, styles.placeholderImage]}>
                                <Text style={styles.placeholderText}>{name.charAt(0)}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.editIconBadge} onPress={pickImage}>
                            <Ionicons name="camera" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={pickImage}>
                        <Text style={styles.changePhotoText}>{t('change_profile_photo')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>{t('full_name')}</Text>
                    <TextInput
                        style={[styles.input, alignStyle]}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('full_name_placeholder')}
                    />

                    <Text style={styles.label}>{t('phone_number')}</Text>
                    <TextInput
                        style={[styles.input, { textAlign: 'left' }]} // Phone usually LTR
                        value={phone}
                        onChangeText={setPhone}
                        placeholder={t('phone_number_placeholder')}
                        keyboardType="phone-pad"
                    />

                    {isPilgrim && (
                        <>
                            <Text style={styles.label}>{t('age_optional')}</Text>
                            <TextInput
                                style={[styles.input, alignStyle]}
                                value={age}
                                onChangeText={setAge}
                                placeholder={t('age_placeholder')}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>{t('gender_optional')}</Text>
                            <View style={styles.genderContainer}>
                                <TouchableOpacity
                                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                                    onPress={() => setGender('male')}
                                >
                                    <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>{t('male')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                                    onPress={() => setGender('female')}
                                >
                                    <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>{t('female')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
                                    onPress={() => setGender('other')}
                                >
                                    <Text style={[styles.genderButtonText, gender === 'other' && styles.genderButtonTextActive]}>{t('other')}</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>{t('medical_history')}</Text>

                            <TextInput
                                style={[styles.input, styles.textArea, alignStyle]}
                                value={medicalHistory}
                                onChangeText={setMedicalHistory}
                                placeholder={t('medical_history_placeholder')}
                                multiline
                                numberOfLines={4}
                            />
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

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
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        fontSize: 16,
        color: '#666',
    },
    saveButton: {
        padding: 5,
    },
    saveButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    imageWrapper: {
        position: 'relative',
        marginBottom: 10,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E1E1E1',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
    },
    placeholderText: {
        fontSize: 40,
        color: 'white',
        fontWeight: 'bold',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    editIconText: {
        fontSize: 14,
    },
    changePhotoText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    form: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    genderButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
    },
    genderButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    genderButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    genderButtonTextActive: {
        color: 'white',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
});
