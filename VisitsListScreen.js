// VisitsListScreen.js - Updated with search
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
    primary: "#0176D3",
    teal: "#0B827C",
    tealLight: "#E6F6F5",
    success: "#2E7D32",
    successLight: "#E8F5E9",
    warning: "#E65100",
    warningLight: "#FFF3E0",
    purple: "#6B34AC",
    purpleLight: "#F3EEFB",
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    border: "#E4E8EF",
    textPrimary: "#0D1B2A",
    textSecondary: "#4A5568",
    textMuted: "#8A94A6",
};

function VisitsListScreen({ route, navigation }) {
    const { visits, title, filterType, sfToken, sfInstanceUrl } = route.params;
    const [searchText, setSearchText] = useState('');
    
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "completed": return C.success;
            case "planned": return C.teal;
            default: return C.primary;
        }
    };

    const getStatusBg = (status) => {
        switch (status?.toLowerCase()) {
            case "completed": return C.successLight;
            case "planned": return C.tealLight;
            default: return C.primaryLight;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'TBD';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Filter visits based on search text
    const filteredVisits = visits.filter(visit => 
        visit.Account?.Name?.toLowerCase().includes(searchText.toLowerCase()) ||
        visit.cgcloud__Account_City__c?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={C.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by customer or location..."
                    placeholderTextColor={C.textMuted}
                    value={searchText}
                    onChangeText={setSearchText}
                    clearButtonMode="while-editing"
                />
                {searchText !== '' && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close-circle" size={20} color={C.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {filteredVisits.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color={C.textMuted} />
                        <Text style={styles.emptyText}>
                            {searchText ? 'No matching visits found' : `No ${filterType.toLowerCase()} visits found`}
                        </Text>
                    </View>
                ) : (
                    filteredVisits.map((visit, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.visitCard}
                            activeOpacity={0.8}
                            onPress={() => {
                                const visitItem = {
                                    type: visit.VisitType?.Name || "Field Visit",
                                    customer: visit.Account?.Name || "Unknown Account",
                                    location: visit.cgcloud__Account_City__c || "Location TBD",
                                    time: formatTime(visit.PlannedVisitStartTime),
                                    status: visit.Status || "Planned",
                                    statusColor: getStatusColor(visit.Status),
                                    statusBg: getStatusBg(visit.Status),
                                    id: visit.Id,
                                    subject: visit.cgcloud__Subject__c || "",
                                    note: visit.cgcloud__Note__c || "",
                                    address: visit.cgcloud__Account_Street__c || "",
                                    plannedStartTime: visit.PlannedVisitStartTime,
                                    plannedEndTime: visit.PlannedVisitEndTime,
                                    actualStartTime: visit.ActualStartTime__c,
                                    actualEndTime: visit.Actual_End_Time__c,
                                    name: visit.Name,
                                    visitTemplate: visit.VisitType?.Name,
                                    responsible: visit.cgcloud__Responsible__c,
                                    accountable: visit.cgcloud__Accountable__c,
                                    creationMode: visit.cgcloud__Creation_Mode__c,
                                    creationDateTime: visit.cgcloud__Creation_Date_and_Time__c,
                                    tour: visit.cgcloud__Tour__c,
                                    week: visit.cgcloud__Week__c,
                                    durationEffective: visit.cgcloud__Duration_Effective__c,
                                    isAllDayEvent: visit.cgcloud__IsAllDayEvent__c,
                                    distributionRateAll: visit.cgcloud__Distribution_Rate_All__c,
                                    oosRateAll: visit.cgcloud__OOS_Rate_All__c,
                                    distributionIssue: visit.cgcloud__Distribution_Issues__c,
                                    oosIssue: visit.cgcloud__OOS_Issues__c,
                                };
                                navigation.navigate('VisitDetails', {
                                    visit: visitItem,
                                    sfToken: sfToken,
                                    sfInstanceUrl: sfInstanceUrl,
                                });
                            }}
                        >
                            <View style={styles.visitLeft}>
                                <View style={[styles.statusPill, { backgroundColor: getStatusBg(visit.Status) }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(visit.Status) }]}>
                                        {visit.Status || "Planned"}
                                    </Text>
                                </View>
                                <Text style={styles.customerName}>{visit.Account?.Name || "Unknown"}</Text>
                                <View style={styles.metaRow}>
                                    <Ionicons name="location-outline" size={12} color={C.textMuted} />
                                    <Text style={styles.metaText}>{visit.cgcloud__Account_City__c || "Location TBD"}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="time-outline" size={12} color={C.textMuted} />
                                    <Text style={styles.metaText}>{formatTime(visit.PlannedVisitStartTime)}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
                        </TouchableOpacity>
                    ))
                )}
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
        paddingTop: 16,
        paddingBottom: 12,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
},
searchIcon: {
    marginRight: 8,
},
searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    padding: 0,
},
scrollContent: {
    paddingBottom: 20,
},
visitCard: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
},
visitLeft: {
    flex: 1,
},
statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
},
statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
},
customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 6,
},
metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
},
metaText: {
    fontSize: 12,
    color: C.textMuted,
},
emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
},
emptyText: {
    fontSize: 16,
    color: C.textMuted,
    marginTop: 16,
},
});

export default VisitsListScreen;