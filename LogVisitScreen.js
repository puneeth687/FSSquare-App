// LogVisitScreen.js
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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

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

function LogVisitScreen({ route, navigation }) {
    const { visit, sfToken, sfInstanceUrl, accountId, accountName } = route.params;
    
    const [subject, setSubject] = useState(`Store Visit - ${accountName || 'Customer'}`);
    const [description, setDescription] = useState('');
    const [followUpDate, setFollowUpDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [priority, setPriority] = useState('Normal');
    const [status, setStatus] = useState('Completed');

    const handleSubmit = async () => {
        if (!subject.trim()) {
            Alert.alert('Error', 'Please enter a subject');
            return;
        }

        setLoading(true);
        
        try {
            // Create Task record in Salesforce
            const taskBody = {
                Subject: subject,
                Description: description,
                ActivityDate: followUpDate.toISOString().split('T')[0],
                Status: status,
                Priority: priority,
                WhatId: accountId, // Link to Account
                // WhatId: visit.id, // If you want to link to Visit instead
                OwnerId: await getCurrentUserId(),
                Type: 'Visit',
                CallType: 'Store Visit',
            };
            
            const response = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Task`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskBody),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData[0]?.message || 'Failed to log visit');
            }
            
            const result = await response.json();
            
            Alert.alert(
                '✓ Visit Logged!',
                `Your visit to ${accountName} has been recorded.\nTask ID: ${result.Id}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            
        } catch (error) {
            console.error('Log visit error:', error);
            Alert.alert('Error', `Failed to log visit: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentUserId = async () => {
        try {
            const response = await fetch(`${sfInstanceUrl}/services/oauth2/userinfo`, {
                headers: { 'Authorization': `Bearer ${sfToken}` },
            });
            const userData = await response.json();
            return userData.user_id || userData.sub?.split('/').pop();
        } catch (error) {
            console.error('Error getting user ID:', error);
            return null;
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFollowUpDate(selectedDate);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Log a Visit</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Account Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="business-outline" size={20} color={C.primary} />
                    <Text style={styles.infoText}>
                        Logging visit for: <Text style={styles.infoBold}>{accountName || 'Unknown Account'}</Text>
                    </Text>
                </View>

                {/* Subject Field */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subject *</Text>
                    <TextInput
                        style={styles.input}
                        value={subject}
                        onChangeText={setSubject}
                        placeholder="e.g., Product Demo, Quarterly Review"
                        placeholderTextColor={C.textMuted}
                    />
                </View>

                {/* Description Field */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description / Notes</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What was discussed? Products shown? Customer feedback?"
                        placeholderTextColor={C.textMuted}
                        multiline={true}
                        numberOfLines={5}
                        textAlignVertical="top"
                    />
                </View>

                {/* Follow-up Date */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Follow-up Date</Text>
                    <TouchableOpacity 
                        style={styles.dateButton} 
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color={C.primary} />
                        <Text style={styles.dateText}>
                            {followUpDate.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={followUpDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />
                    )}
                </View>

                {/* Priority Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Priority</Text>
                    <View style={styles.priorityContainer}>
                        {['Low', 'Normal', 'High'].map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    styles.priorityButton,
                                    priority === p && { backgroundColor: C.primary }
                                ]}
                                onPress={() => setPriority(p)}
                            >
                                <Text style={[
                                    styles.priorityText,
                                    priority === p && { color: '#fff' }
                                ]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Status Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Status</Text>
                    <View style={styles.priorityContainer}>
                        {['Not Started', 'In Progress', 'Completed'].map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[
                                    styles.priorityButton,
                                    status === s && { backgroundColor: C.success }
                                ]}
                                onPress={() => setStatus(s)}
                            >
                                <Text style={[
                                    styles.priorityText,
                                    status === s && { color: '#fff' }
                                ]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[styles.submitButton, loading && { opacity: 0.7 }]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={22} color="#fff" />
                            <Text style={styles.submitText}>Log Visit</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
    infoBold: {
        fontWeight: '700',
        color: C.primary,
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
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    dateText: {
        fontSize: 15,
        color: C.textPrimary,
        flex: 1,
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    priorityButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
    },
    priorityText: {
        fontSize: 14,
        color: C.textSecondary,
        fontWeight: '500',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.primary,
        paddingVertical: 16,
        borderRadius: 14,
        gap: 10,
        marginTop: 10,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default LogVisitScreen;