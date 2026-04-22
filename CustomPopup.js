// CustomPopup.js - Salesforce Blue themed popup
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
    primary: "#0176D3",        // Salesforce Blue
    primaryDark: "#014486",
    success: "#2E7D32",
    danger: "#C62828",
    surface: "#FFFFFF",
    textPrimary: "#0D1B2A",
    textSecondary: "#4A5568",
};

function CustomPopup({ visible, title, message, type, onClose, loading }) {
    const getIcon = () => {
        if (type === 'success') return 'checkmark-circle';
        if (type === 'error') return 'close-circle';
        if (type === 'loading') return null;
        return 'information-circle';
    };

    const getIconColor = () => {
        if (type === 'success') return C.success;
        if (type === 'error') return C.danger;
        return C.primary;
    };

    const getButtonColor = () => {
        if (type === 'success') return C.success;
        if (type === 'error') return C.danger;
        return C.primary;
    };

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.popupContainer}>
                    {loading ? (
                        <>
                            <ActivityIndicator size="large" color={C.primary} />
                            <Text style={styles.loadingTitle}>{title || 'Processing...'}</Text>
                            {message && <Text style={styles.loadingMessage}>{message}</Text>}
                        </>
                    ) : (
                        <>
                            {getIcon() && (
                                <View style={[styles.iconCircle, { backgroundColor: getIconColor() + '15' }]}>
                                    <Ionicons 
                                        name={getIcon()} 
                                        size={50} 
                                        color={getIconColor()} 
                                    />
                                </View>
                            )}
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>
                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: getButtonColor() }]} 
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>Got it</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupContainer: {
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 24,
        width: '80%',
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: C.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: C.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 30,
        minWidth: 120,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    loadingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: C.textPrimary,
        marginTop: 16,
        textAlign: 'center',
    },
    loadingMessage: {
        fontSize: 13,
        color: C.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
});

export default CustomPopup;