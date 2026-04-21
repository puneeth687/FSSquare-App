// VisitDetailsScreen.js - Create this new file in your project root
import React from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Linking,
    Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";

const C = {
    primary: "#0176D3",
    primaryDark: "#014486",
    primaryLight: "#E8F4FD",
    teal: "#0B827C",
    tealLight: "#E6F6F5",
    purple: "#6B34AC",
    purpleLight: "#F3EEFB",
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

// ─── VISIT DETAILS SCREEN (COMPLETE WITH ALL FIELDS) ─────────────────────────
// ─── VISIT DETAILS SCREEN (SHOWS ALL SECTIONS) ─────────────────────────────
function VisitDetailsScreen({ route, navigation }) {
    const { visit, sfToken, sfInstanceUrl } = route.params;

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleCheckIn = () => {
        Alert.alert('Check In', `Check in to ${visit.customer}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Check In', onPress: () => Alert.alert('Success', 'Checked in successfully!') }
        ]);
    };

    const handleComplete = () => {
        Alert.alert('Complete Visit', `Mark ${visit.customer} as completed?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete', onPress: () => Alert.alert('Success', 'Visit marked as completed!') }
        ]);
    };

    const handleNavigate = () => {
        if (visit.address) {
            Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(visit.address)}`);
        }
    };

    return (
        <SafeAreaView style={[styles.container, {paddingTop: 0}]}>
            <StatusBar style="dark" />
            
            <View style={styles.detailsHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.detailsBackBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.detailsHeaderTitle}>Visit Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>
                {/* Status Card */}
                <View style={[styles.detailsStatusCard, { backgroundColor: visit.statusBg || C.tealLight }]}>
                    <View style={styles.detailsStatusRow}>
                        <Ionicons name="time-outline" size={20} color={visit.statusColor || C.teal} />
                        <Text style={[styles.detailsStatusText, { color: visit.statusColor || C.teal }]}>{visit.status || 'Planned'}</Text>
                    </View>
                    <Text style={styles.detailsVisitType}>{visit.type || 'Field Visit'}</Text>
                </View>

                {/* Customer Information */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="business-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Customer Information</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Account:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.customer || 'Not specified'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Location:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.location || 'Not specified'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleNavigate} style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Address:</Text>
                        <Text style={[styles.detailsInfoValue, {color: C.primary}]}>{visit.address || 'Not specified'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Schedule Information */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="calendar-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Schedule</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Planned Start Time:</Text>
                        <Text style={styles.detailsInfoValue}>{formatDate(visit.plannedStartTime)}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Planned End Time:</Text>
                        <Text style={styles.detailsInfoValue}>{formatDate(visit.plannedEndTime)}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Actual Start Time:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.actualStartTime ? formatDate(visit.actualStartTime) : 'Not started'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Actual End Time:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.actualEndTime ? formatDate(visit.actualEndTime) : 'Not completed'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Creation Date & Time:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.creationDateTime ? formatDate(visit.creationDateTime) : 'Not set'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Week:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.week || 'Not set'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Duration Effective:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.durationEffective || '0'} minutes</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>All-Day Event:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.isAllDayEvent ? 'Yes' : 'No'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Fixed Visit Date:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.fixedVisitDate || 'No'}</Text>
                    </View>
                </View>

                {/* Visit Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="document-text-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Visit Details</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Visit Number:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.name || 'Not assigned'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Subject:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.subject || 'No subject'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Visit Template:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.visitTemplate || 'Standard'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Responsible:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.responsible || 'Unassigned'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Accountable:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.accountable || 'Unassigned'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Creation Mode:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.creationMode || 'Manual'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Tour:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.tour || 'Default'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Location Status:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.locationStatus || 'Active'}</Text>
                    </View>
                </View>

                {/* Notes Section */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="chatbubble-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Notes</Text>
                    </View>
                    <Text style={styles.detailsNotesText}>{visit.note || 'No notes available'}</Text>
                </View>

                {/* Customer KPIs */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="stats-chart-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Customer KPIs</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Distribution Rate All:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.distributionRateAll || '0'}%</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Distribution Rate Focus:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.distributionRateFocus || '0'}%</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>OoS Rate All:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.oosRateAll || '0'}%</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>OoS Rate Focus:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.oosRateFocus || '0'}%</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>PSI:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.psi || '0'}%</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>PSQ Rate:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.psqRate || '0'}%</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Distribution Issue:</Text>
                        <Text style={[styles.detailsInfoValue, visit.distributionIssue ? {color: C.danger} : {}]}>
                            {visit.distributionIssue ? 'Yes' : 'No'}
                        </Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>OoS Issue:</Text>
                        <Text style={[styles.detailsInfoValue, visit.oosIssue ? {color: C.danger} : {}]}>
                            {visit.oosIssue ? 'Yes' : 'No'}
                        </Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Distribution Issue Value:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.distributionIssueValue || '0'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>OoS Issue Value:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.oosIssueValue || '0'}</Text>
                    </View>
                </View>

                {/* Geolocation Information */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="location-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Geolocation</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Start Geolocation:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.startGeolocation || 'Not tracked'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Geolocation:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.geolocation || 'Not tracked'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Visit Completed Outside Range:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.visitCompletedOutsideRange ? 'Yes' : 'No'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Visit Start Outside Range:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.visitStartOutsideRange ? 'Yes' : 'No'}</Text>
                    </View>
                </View>

                {/* System Information */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="information-circle-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>System Information</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Created By:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.createdBy || 'Unknown'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Created Date:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.createdDate ? formatDate(visit.createdDate) : 'Not set'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Last Modified By:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.lastModifiedBy || 'Unknown'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Last Modified Date:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.lastModifiedDate ? formatDate(visit.lastModifiedDate) : 'Not set'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Owner:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.ownerName || 'Unknown'}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Record Type:</Text>
                        <Text style={styles.detailsInfoValue}>{visit.recordType || 'Standard'}</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.detailsActionsContainer}>
                    <TouchableOpacity style={[styles.detailsActionBtn, { backgroundColor: C.teal }]} onPress={handleCheckIn}>
                        <Ionicons name="checkbox-outline" size={22} color="#fff" />
                        <Text style={styles.detailsActionBtnText}>Check In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.detailsActionBtn, { backgroundColor: C.success }]} onPress={handleComplete}>
                        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                        <Text style={styles.detailsActionBtnText}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.detailsActionBtn, { backgroundColor: C.primary }]} onPress={handleNavigate}>
                        <Ionicons name="navigate-outline" size={22} color="#fff" />
                        <Text style={styles.detailsActionBtnText}>Navigate</Text>
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
        fontWeight: "700",
        color: C.textPrimary,
    },
    statusCard: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "600",
    },
    visitType: {
        fontSize: 20,
        fontWeight: "700",
        color: C.textPrimary,
        marginTop: 8,
    },
    card: {
        backgroundColor: C.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: C.textPrimary,
    },
    customerName: {
        fontSize: 18,
        fontWeight: "600",
        color: C.textPrimary,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: C.textSecondary,
        flex: 1,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    infoLabel: {
        fontSize: 13,
        color: C.textMuted,
        fontWeight: "500",
    },
    infoValue: {
        fontSize: 13,
        color: C.textPrimary,
        fontWeight: "400",
        flex: 1,
        textAlign: "right",
    },
    notesText: {
        fontSize: 14,
        color: C.textSecondary,
        lineHeight: 20,
    },
    actionsContainer: {
        flexDirection: "row",
        marginHorizontal: 16,
        marginTop: 8,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    actionBtnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
});

export default VisitDetailsScreen;
