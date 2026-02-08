import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api, setAuthToken } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../components/ToastContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
    const [fullName, setFullName] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSignUp = async () => {
        if (!fullName || !nationalId || !phoneNumber || !password) {
            showToast('Please fill in all required fields.', 'error', { title: 'Missing Fields' });
            return;
        }

        setLoading(true);
        try {
            console.log('Registering pilgrim:', nationalId);
            const response = await api.post('/auth/register', {
                full_name: fullName,
                national_id: nationalId,
                phone_number: phoneNumber,
                password,
                email: email.trim() || undefined,
                medical_history: medicalHistory.trim() || undefined
            });

            const { token, role, user_id } = response.data;

            // Set auth token and navigate directly to dashboard
            setAuthToken(token);

            showToast(
                'Account created successfully!',
                'success',
                {
                    title: 'Welcome to Munawwara Care',
                    actionLabel: 'Continue',
                    onAction: () => navigation.replace('PilgrimDashboard', { userId: user_id })
                }
            );

            // Auto-navigate after showing success
            setTimeout(() => navigation.replace('PilgrimDashboard', { userId: user_id }), 2000);
        } catch (error: any) {
            console.error('Registration Error:', error);

            // Handle structured validation errors from backend
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstErrorField = Object.keys(errors)[0];
                const errorMessage = errors[firstErrorField];
                showToast(errorMessage, 'error', { title: 'Validation Error' });
            } else {
                showToast(error.response?.data?.message || 'Something went wrong', 'error', { title: 'Registration Failed' });
            }
        } finally {
            setLoading(false);
        }
    };

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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Munawwara Care as a Pilgrim</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Abdullah Al-Fahad"
                                placeholderTextColor="#999"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>National ID *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your national ID"
                                placeholderTextColor="#999"
                                value={nationalId}
                                onChangeText={setNationalId}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+966 50 123 4567"
                                placeholderTextColor="#999"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Password *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Min 6 characters"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Email (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Medical History (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Any medical conditions we should know about"
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
                            <Text style={styles.buttonText}>{loading ? "Creating Account..." : "Sign Up"}</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.linkText}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingVertical: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 10,
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
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 14,
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
});
