import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Alert, Modal, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api, setAuthToken } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../components/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

type LanguageOption = { label: string; value: string; flag: string };
const LANGUAGES: LanguageOption[] = [
    { label: 'English', value: 'en', flag: '🇺🇸' },
    { label: 'Arabic', value: 'ar', flag: '🇸🇦' },
    { label: 'Urdu', value: 'ur', flag: '🇵🇰' },
    { label: 'French', value: 'fr', flag: '🇫🇷' },
    { label: 'Indonesian', value: 'id', flag: '🇮🇩' },
    { label: 'Turkish', value: 'tr', flag: '🇹🇷' },
];

const COUNTRY_CODES = [
    { code: '+966', flag: '🇸🇦' },
    { code: '+971', flag: '🇦🇪' },
    { code: '+20', flag: '🇪🇬' },
    { code: '+92', flag: '🇵🇰' },
    { code: '+91', flag: '🇮🇳' },
    { code: '+62', flag: '🇮🇩' },
    { code: '+1', flag: '🇺🇸' },
    { code: '+44', flag: '🇬🇧' },
];

export default function SignUpScreen({ navigation }: Props) {
    const { t, i18n } = useTranslation();
    const [fullName, setFullName] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    // Initialize language from current i18n language
    const currentLang = LANGUAGES.find(l => l.value === i18n.language) || LANGUAGES[0];
    const [selectedLanguage, setSelectedLanguage] = useState(currentLang);

    // Modals visibility
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleLanguageChange = (lang: LanguageOption) => {
        setSelectedLanguage(lang);
        changeLanguage(lang.value);
    };

    const handleSignUp = async () => {
        if (!fullName || !nationalId || !phoneNumber || !password) {
            showToast(t('fill_required'), 'error', { title: t('missing_fields') });
            return;
        }

        setLoading(true);
        try {
            const fullPhoneNumber = `${selectedCountryCode.code}${phoneNumber}`;
            console.log('Registering pilgrim:', nationalId, fullPhoneNumber);

            const response = await api.post('/auth/register', {
                full_name: fullName,
                national_id: nationalId,
                phone_number: fullPhoneNumber,
                password,
                email: email.trim() || undefined,
                medical_history: medicalHistory.trim() || undefined,
                language: selectedLanguage.value
            });

            const { token, role, user_id } = response.data;

            setAuthToken(token);

            showToast(
                t('account_created'),
                'success',
                {
                    title: t('welcome_munawwara'),
                    actionLabel: t('continue'),
                    onAction: () => navigation.replace('PilgrimDashboard', { userId: user_id })
                }
            );

            // Auto-navigate after showing success
            setTimeout(() => navigation.replace('PilgrimDashboard', { userId: user_id }), 2000);
        } catch (error: any) {
            console.error('Registration Error:', error);

            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstErrorField = Object.keys(errors)[0];
                const errorMessage = errors[firstErrorField];
                showToast(errorMessage, 'error', { title: t('validation_error') });
            } else {
                showToast(error.response?.data?.message || t('registration_failed'), 'error', { title: t('registration_failed') });
            }
        } finally {
            setLoading(false);
        }
    };

    const renderPickerModal = (
        visible: boolean,
        onClose: () => void,
        data: any[],
        onSelect: (item: any) => void,
        renderItem: (item: any) => React.ReactElement
    ) => (
        <Modal visible={visible} transparent animationType="slide">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <View style={[styles.modalHeader, (i18n.language === 'ar' || i18n.language === 'ur') && { flexDirection: 'row-reverse' }]}>
                        <Text style={styles.modalTitle}>{t('select_option')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.pickerItem, (i18n.language === 'ar' || i18n.language === 'ur') && { alignItems: 'flex-end' }]} onPress={() => { onSelect(item); onClose(); }}>
                                {renderItem(item)}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >

                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>{t('create_account')}</Text>
                        <Text style={styles.subtitle}>{t('join_munawwara')}</Text>
                    </View>

                    <View style={styles.formContainer}>
                        {/* Language Selector */}
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, (i18n.language === 'ar' || i18n.language === 'ur') && { textAlign: 'right' }]}>{t('language_preference')}</Text>
                            <TouchableOpacity style={[styles.pickerButton, (i18n.language === 'ar' || i18n.language === 'ur') && { flexDirection: 'row-reverse' }]} onPress={() => setShowLangPicker(true)}>
                                <Text style={styles.pickerButtonText}>{selectedLanguage.flag}  {selectedLanguage.label}</Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, (i18n.language === 'ar' || i18n.language === 'ur') && { textAlign: 'right' }]}>{t('full_name')} *</Text>
                            <TextInput
                                style={[styles.input, { textAlign: i18n.language === 'ar' || i18n.language === 'ur' ? 'right' : 'left' }]}
                                placeholder={t('full_name')}
                                placeholderTextColor="#999"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, (i18n.language === 'ar' || i18n.language === 'ur') && { textAlign: 'right' }]}>{t('national_id')} *</Text>
                            <TextInput
                                style={[styles.input, { textAlign: i18n.language === 'ar' || i18n.language === 'ur' ? 'right' : 'left' }]}
                                placeholder={t('national_id')}
                                placeholderTextColor="#999"
                                value={nationalId}
                                onChangeText={setNationalId}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, (i18n.language === 'ar' || i18n.language === 'ur') && { textAlign: 'right' }]}>{t('phone_number')} *</Text>
                            <View style={[styles.phoneInputContainer, (i18n.language === 'ar' || i18n.language === 'ur') && { flexDirection: 'row-reverse' }]}>
                                <TouchableOpacity style={[styles.countryCodeButton, (i18n.language === 'ar' || i18n.language === 'ur') && { marginRight: 0, marginLeft: 10, flexDirection: 'row-reverse' }]} onPress={() => setShowCountryPicker(true)}>
                                    <Text style={styles.countryCodeText}>{selectedCountryCode.flag} {selectedCountryCode.code}</Text>
                                    <Ionicons name="chevron-down" size={16} color="#666" />
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.phoneInput, { textAlign: 'left' }]} // Phone numbers usually LTR
                                    placeholder="50 123 4567"
                                    placeholderTextColor="#999"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, (i18n.language === 'ar' || i18n.language === 'ur') && { textAlign: 'right' }]}>{t('password_placeholder')} *</Text>
                            <TextInput
                                style={[styles.input, { textAlign: i18n.language === 'ar' || i18n.language === 'ur' ? 'right' : 'left' }]}
                                placeholder={t('password_placeholder')}
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, (i18n.language === 'ar' || i18n.language === 'ur') && { textAlign: 'right' }]}>{t('email_optional')}</Text>
                            <TextInput
                                style={[styles.input, { textAlign: i18n.language === 'ar' || i18n.language === 'ur' ? 'right' : 'left' }]}
                                placeholder={t('email_address_placeholder')}
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, (i18n.language === 'ar' || i18n.language === 'ur') && { textAlign: 'right' }]}>{t('medical_history')}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { textAlign: i18n.language === 'ar' || i18n.language === 'ur' ? 'right' : 'left' }]}
                                placeholder={t('medical_history')}
                                placeholderTextColor="#999"
                                value={medicalHistory}
                                onChangeText={setMedicalHistory}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>{loading ? t('registering') : t('sign_up')}</Text>
                        </TouchableOpacity>

                        <View style={[styles.footer, (i18n.language === 'ar' || i18n.language === 'ur') && { flexDirection: 'row-reverse' }]}>
                            <Text style={styles.footerText}>{t('already_have_account')} </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.linkText}>{t('login')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Language Picker Modal */}
            {renderPickerModal(showLangPicker, () => setShowLangPicker(false), LANGUAGES, handleLanguageChange, (item) => (
                <Text style={styles.pickerItemText}>{item.flag}  {item.label}</Text>
            ))}

            {/* Country Code Picker Modal */}
            {renderPickerModal(showCountryPicker, () => setShowCountryPicker(false), COUNTRY_CODES, setSelectedCountryCode, (item) => (
                <Text style={styles.pickerItemText}>{item.flag}  {item.code}</Text>
            ))}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E1E1E1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryCodeButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 100,
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    countryCodeText: {
        fontSize: 16,
        color: '#333',
    },
    phoneInput: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E1E1E1',
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    pickerButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#A0C4FF',
        shadowOpacity: 0,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    footerText: {
        fontSize: 15,
        color: '#666',
    },
    linkText: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    pickerItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    pickerItemText: {
        fontSize: 18,
        color: '#333',
    },
});
