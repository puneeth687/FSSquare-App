// NewLeadScreen.js - COMPLETE FIXED VERSION
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomPopup from './CustomPopup';

const C = {
    primary: "#0176D3",
    primaryDark: "#014486",
    primaryLight: "#E8F4FD",
    success: "#2E7D32",
    successLight: "#E8F5E9",
    danger: "#C62828",
    dangerLight: "#FFEBEE",
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    border: "#E4E8EF",
    textPrimary: "#0D1B2A",
    textSecondary: "#4A5568",
    textMuted: "#8A94A6",
};

function NewLeadScreen({ route, navigation }) {
    const { sfToken, sfInstanceUrl } = route.params;
    
    const [company, setCompany] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [leadSource, setLeadSource] = useState('Mobile App');
    
    // Popup states
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState('');
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState('success');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!company.trim()) {
            setPopupTitle('Missing Information');
            setPopupMessage('Company name is required');
            setPopupType('error');
            setPopupVisible(true);
            return;
        }

        // Show loading on entire screen
        setLoading(true);
        setPopupVisible(true);
        setPopupTitle('Creating Lead...');
        setPopupMessage('Please wait while we save to Salesforce');
        setPopupType('loading');
        
        try {
            const currentUserId = await getCurrentUserId();
            
            // Create Lead record in Salesforce
            const leadBody = {
                Company: company.trim(),
                FirstName: firstName.trim() || null,
                LastName: lastName.trim() || null,
                Email: email.trim() || null,
                Phone: phone.trim() || null,
                Description: description.trim() || null,
                LeadSource: leadSource,
                Status: 'Open - Not Contacted',
                OwnerId: currentUserId,
            };
            
            console.log('Creating lead with data:', leadBody);
            
            const response = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Lead`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadBody),
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                console.error('Salesforce error:', result);
                throw new Error(result[0]?.message || 'Failed to create lead');
            }
            
            console.log('Lead created successfully:', result);
            
            // Success popup with Lead ID
            setPopupTitle('✓ Lead Created!');
            setPopupMessage(`"${company}" has been added to Salesforce.\nLead ID: ${result.id || result.Id || 'Created'}`);
            setPopupType('success');
            setLoading(false);
            
            // Reset form after 2 seconds
            setTimeout(() => {
                setPopupVisible(false);
                resetForm();
                navigation.goBack();
            }, 2500);
            
        } catch (error) {
            console.error('Create lead error:', error);
            setPopupTitle('Creation Failed');
            setPopupMessage(error.message);
            setPopupType('error');
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCompany('');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setDescription('');
        setLeadSource('Mobile App');
    };

    const getCurrentUserId = async () => {
        try {
            const response = await fetch(`${sfInstanceUrl}/services/oauth2/userinfo`, {
                headers: { 'Authorization': `Bearer ${sfToken}` },
            });
            const userData = await response.json();
            // Extract user ID from the response
            if (userData.user_id) return userData.user_id;
            if (userData.sub) {
                const parts = userData.sub.split('/');
                return parts[parts.length - 1];
            }
            return null;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Lead</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Disable interaction while loading */}
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                pointerEvents={loading ? 'none' : 'auto'}
            >
                
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="person-add-outline" size={20} color={C.primary} />
                    <Text style={styles.infoText}>
                        Capture a new potential customer
                    </Text>
                </View>

                {/* Required Fields */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Company Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={company}
                        onChangeText={setCompany}
                        placeholder="Enter company name"
                        placeholderTextColor={C.textMuted}
                        editable={!loading}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="First name"
                            placeholderTextColor={C.textMuted}
                            editable={!loading}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Last name"
                            placeholderTextColor={C.textMuted}
                            editable={!loading}
                        />
                    </View>
                </View>

                {/* Contact Fields */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email@company.com"
                        placeholderTextColor={C.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Phone number"
                        placeholderTextColor={C.textMuted}
                        keyboardType="phone-pad"
                        editable={!loading}
                    />
                </View>

                {/* Lead Source */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lead Source</Text>
                    <View style={styles.sourceContainer}>
                        {['Mobile App', 'Web', 'Referral', 'Event', 'Cold Call'].map((source) => (
                            <TouchableOpacity
                                key={source}
                                style={[
                                    styles.sourceButton,
                                    leadSource === source && { backgroundColor: C.primary }
                                ]}
                                onPress={() => setLeadSource(source)}
                                disabled={loading}
                            >
                                <Text style={[
                                    styles.sourceText,
                                    leadSource === source && { color: '#fff' }
                                ]}>{source}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes / Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Additional notes about this lead..."
                        placeholderTextColor={C.textMuted}
                        multiline={true}
                        numberOfLines={4}
                        textAlignVertical="top"
                        editable={!loading}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[styles.submitButton, loading && { opacity: 0.6 }]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitText}>Create Lead</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Custom Popup */}
            <CustomPopup
                visible={popupVisible}
                title={popupTitle}
                message={popupMessage}
                type={popupType}
                onClose={() => {
                    setPopupVisible(false);
                    if (popupType === 'success') {
                        navigation.goBack();
                    }
                }}
                loading={popupType === 'loading'}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: C.textPrimary,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.primaryLight,
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    infoText: {
        fontSize: 14,
        color: C.textSecondary,
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: C.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: C.textPrimary,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    sourceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    sourceButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
    },
    sourceText: {
        fontSize: 13,
        color: C.textSecondary,
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: C.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default NewLeadScreen;