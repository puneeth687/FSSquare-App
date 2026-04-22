// AccountDetailsScreen.js
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
    primary: "#0176D3",
    primaryDark: "#014486",
    primaryLight: "#E8F4FD",
    teal: "#0B827C",
    tealLight: "#E6F6F5",
    success: "#2E7D32",
    successLight: "#E8F5E9",
    warning: "#E65100",
    warningLight: "#FFF3E0",
    danger: "#C62828",
    dangerLight: "#FFEBEE",
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    border: "#E4E8EF",
    textPrimary: "#0D1B2A",
    textSecondary: "#4A5568",
    textMuted: "#8A94A6",
};

function AccountDetailsScreen({ route, navigation }) {
    const { account, sfToken, sfInstanceUrl } = route.params;
    const [showMore, setShowMore] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (value) => {
        if (!value) return 'Not specified';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const displayValue = (value, fallback = 'Not specified') => {
        if (value === undefined || value === null || value === '') return fallback;
        return String(value);
    };

    const handleCall = () => {
        if (account.Phone) {
            Linking.openURL(`tel:${account.Phone}`);
        } else {
            Alert.alert('No Phone Number', 'This account does not have a phone number');
        }
    };

    const handleEmail = () => {
        // Accounts don't have email directly, but could show contact list
        Alert.alert('Contacts', 'Contact list feature coming soon');
    };

    const handleNavigate = () => {
        if (account.BillingCity) {
            Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(
                [account.BillingStreet, account.BillingCity, account.BillingState, account.BillingCountry]
                    .filter(Boolean)
                    .join(', ')
            )}`);
        } else {
            Alert.alert('No Address', 'This account does not have an address');
        }
    };

    const getTypeColor = () => {
        switch (account.Type?.toLowerCase()) {
            case 'customer': return C.success;
            case 'partner': return C.teal;
            case 'competitor': return C.danger;
            default: return C.primary;
        }
    };

    const getRatingColor = () => {
        switch (account.Rating?.toLowerCase()) {
            case 'hot': return C.danger;
            case 'warm': return C.warning;
            default: return C.textMuted;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Card */}
                <View style={[styles.headerCard, { borderLeftColor: getTypeColor(), borderLeftWidth: 4 }]}>
                    <Text style={styles.accountName}>{displayValue(account.Name)}</Text>
                    <View style={styles.headerBadges}>
                        {account.Type && (
                            <View style={[styles.badge, { backgroundColor: getTypeColor() + '15' }]}>
                                <Text style={[styles.badgeText, { color: getTypeColor() }]}>{account.Type}</Text>
                            </View>
                        )}
                        {account.Rating && (
                            <View style={[styles.badge, { backgroundColor: getRatingColor() + '15' }]}>
                                <Text style={[styles.badgeText, { color: getRatingColor() }]}>{account.Rating}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Contact Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="call-outline" size={20} color={C.primary} />
                        <Text style={styles.cardTitle}>Contact Information</Text>
                    </View>
                    <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={[styles.infoValue, { color: C.primary }]}>{displayValue(account.Phone)}</Text>
                        <Ionicons name="call-outline" size={16} color={C.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.infoRow} onPress={handleEmail}>
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={[styles.infoValue, { color: C.primary }]}>Contact Sales Team</Text>
                        <Ionicons name="mail-outline" size={16} color={C.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.infoRow} onPress={handleNavigate}>
                        <Text style={styles.infoLabel}>Address:</Text>
                        <Text style={[styles.infoValue, { color: C.primary }]}>
                            {[account.BillingStreet, account.BillingCity, account.BillingState, account.BillingCountry]
                                .filter(Boolean)
                                .join(', ') || 'Not specified'}
                        </Text>
                        <Ionicons name="navigate-outline" size={16} color={C.primary} />
                    </TouchableOpacity>
                    {account.Website && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Website:</Text>
                            <Text style={styles.infoValue}>{displayValue(account.Website)}</Text>
                        </View>
                    )}
                </View>

                {/* Business Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="business-outline" size={20} color={C.primary} />
                        <Text style={styles.cardTitle}>Business Information</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Industry:</Text>
                        <Text style={styles.infoValue}>{displayValue(account.Industry)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Annual Revenue:</Text>
                        <Text style={styles.infoValue}>{formatCurrency(account.AnnualRevenue)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Employees:</Text>
                        <Text style={styles.infoValue}>{displayValue(account.NumberOfEmployees)}</Text>
                    </View>
                    {account.Owner?.Name && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Account Owner:</Text>
                            <Text style={styles.infoValue}>{account.Owner.Name}</Text>
                        </View>
                    )}
                </View>

                {/* View More Section */}
                <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => setShowMore(!showMore)}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={showMore ? "chevron-up-outline" : "chevron-down-outline"}
                        size={20}
                        color={C.primary}
                    />
                    <Text style={styles.viewMoreText}>{showMore ? "Show Less" : "View More Details"}</Text>
                </TouchableOpacity>

                {showMore && (
                    <>
                        {/* Additional Details */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="document-text-outline" size={20} color={C.primary} />
                                <Text style={styles.cardTitle}>Additional Details</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Account Number:</Text>
                                <Text style={styles.infoValue}>{displayValue(account.AccountNumber)}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Account Source:</Text>
                                <Text style={styles.infoValue}>{displayValue(account.AccountSource)}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Ownership:</Text>
                                <Text style={styles.infoValue}>{displayValue(account.Ownership)}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>SIC Code:</Text>
                                <Text style={styles.infoValue}>{displayValue(account.Sic)}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Created:</Text>
                                <Text style={styles.infoValue}>{formatDate(account.CreatedDate)}</Text>
                            </View>
                        </View>

                        {/* Description */}
                        {account.Description && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="chatbubble-outline" size={20} color={C.primary} />
                                    <Text style={styles.cardTitle}>Description</Text>
                                </View>
                                <Text style={styles.descriptionText}>{account.Description}</Text>
                            </View>
                        )}
                    </>
                )}

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: C.primary }]}
                        onPress={handleCall}
                    >
                        <Ionicons name="call-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: C.teal }]}
                        onPress={handleEmail}
                    >
                        <Ionicons name="mail-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Contacts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: C.success }]}
                        onPress={handleNavigate}
                    >
                        <Ionicons name="navigate-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Navigate</Text>
                    </TouchableOpacity>
                </View>
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
    headerCard: {
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    accountName: {
        fontSize: 20,
        fontWeight: '700',
        color: C.textPrimary,
        marginBottom: 8,
    },
    headerBadges: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    card: {
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: C.textPrimary,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    infoLabel: {
        fontSize: 13,
        color: C.textMuted,
        fontWeight: '500',
        width: 110,
    },
    infoValue: {
        fontSize: 13,
        color: C.textPrimary,
        flex: 1,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingVertical: 12,
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        gap: 8,
    },
    viewMoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.primary,
    },
    descriptionText: {
        fontSize: 14,
        color: C.textSecondary,
        lineHeight: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
        marginBottom: 20,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default AccountDetailsScreen;