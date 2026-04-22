// LeadsListScreen.js
import React, {useState, useEffect} from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    TextInput,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import CustomPopup from "./CustomPopup";

const C = {
    primary: "#0176D3",
    primaryDark: "#014486",
    primaryLight: "#E8F4FD",
    success: "#2E7D32",
    successLight: "#E8F5E9",
    warning: "#E65100",
    warningLight: "#FFF3E0",
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    border: "#E4E8EF",
    textPrimary: "#0D1B2A",
    textSecondary: "#4A5568",
    textMuted: "#8A94A6",
};

function LeadsListScreen({route, navigation}) {
    const {sfToken, sfInstanceUrl} = route.params;
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState("");
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState("success");

    useEffect(() => {
        fetchLeads();
    }, []);

    useEffect(() => {
        filterLeads();
    }, [searchText, leads]);

    const fetchLeads = async () => {
        try {
            const currentUserId = await getCurrentUserId();

            const query = encodeURIComponent(
                `SELECT Id, Name, FirstName, LastName, Company, Title, Email, Phone, LeadSource, Status, Rating, Industry, AnnualRevenue, NumberOfEmployees, Website, Description, CreatedDate FROM Lead WHERE OwnerId = '${currentUserId}' ORDER BY CreatedDate DESC LIMIT 100`
            );

            const response = await fetch(`${sfInstanceUrl}/services/data/v58.0/query?q=${query}`, {
                headers: {
                    Authorization: `Bearer ${sfToken}`,
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (result.records) {
                setLeads(result.records);
                setFilteredLeads(result.records);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
            setPopupTitle("Error");
            setPopupMessage("Failed to load leads");
            setPopupType("error");
            setPopupVisible(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterLeads = () => {
        if (!searchText.trim()) {
            setFilteredLeads(leads);
        } else {
            const filtered = leads.filter(
                (lead) =>
                    (lead.Company || "").toLowerCase().includes(searchText.toLowerCase()) ||
                    (lead.FirstName || "").toLowerCase().includes(searchText.toLowerCase()) ||
                    (lead.LastName || "").toLowerCase().includes(searchText.toLowerCase()) ||
                    (lead.Email || "").toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredLeads(filtered);
        }
    };

    const getCurrentUserId = async () => {
        try {
            const response = await fetch(`${sfInstanceUrl}/services/oauth2/userinfo`, {
                headers: {Authorization: `Bearer ${sfToken}`},
            });
            const userData = await response.json();
            if (userData.user_id) return userData.user_id;
            if (userData.sub) {
                const parts = userData.sub.split("/");
                return parts[parts.length - 1];
            }
            return null;
        } catch (error) {
            console.error("Error getting user ID:", error);
            return null;
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeads();
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "new": return C.warning;
            case "working": return C.primary;
            case "qualified": return C.teal;
            case "converted": return C.success;
            case "unqualified": return C.danger;
            default: return C.textMuted;
        }
    };

    const getStatusBg = (status) => {
        switch (status?.toLowerCase()) {
            case "new": return C.warningLight;
            case "working": return C.primaryLight;
            case "qualified": return C.tealLight;
            case "converted": return C.successLight;
            case "unqualified": return C.dangerLight;
            default: return C.border;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Unknown";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header with Create Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leads</Text>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => {
                        navigation.navigate("NewLead", {
                            sfToken: sfToken,
                            sfInstanceUrl: sfInstanceUrl,
                        });
                    }}
                >
                    <Ionicons name="add" size={28} color={C.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={C.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search leads by name, company or email..."
                    placeholderTextColor={C.textMuted}
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText !== "" && (
                    <TouchableOpacity onPress={() => setSearchText("")}>
                        <Ionicons name="close-circle" size={20} color={C.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Leads List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={styles.loadingText}>Loading leads...</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
                    }
                >
                    {filteredLeads.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={C.textMuted} />
                            <Text style={styles.emptyText}>{searchText ? "No leads found" : "No leads yet"}</Text>
                            {!searchText && (
                                <TouchableOpacity
                                    style={styles.emptyButton}
                                    onPress={() => navigation.navigate("NewLead", {sfToken, sfInstanceUrl})}
                                >
                                    <Text style={styles.emptyButtonText}>+ Create Your First Lead</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        filteredLeads.map((lead) => (
                            <TouchableOpacity
                                key={lead.Id}
                                style={styles.leadCard}
                                activeOpacity={0.7}
                                onPress={() => {
                                    // FIXED: Navigate to LeadDetails screen, not Alert
                                    navigation.navigate("LeadDetails", {
                                        lead: lead,
                                        sfToken: sfToken,
                                        sfInstanceUrl: sfInstanceUrl,
                                        onLeadUpdate: (updatedLead) => {
                                            setLeads((prevLeads) =>
                                                prevLeads.map((l) => (l.Id === updatedLead.Id ? updatedLead : l))
                                            );
                                            setFilteredLeads((prevFiltered) =>
                                                prevFiltered.map((l) => (l.Id === updatedLead.Id ? updatedLead : l))
                                            );
                                        },
                                    });
                                }}
                            >
                                <View style={styles.leadHeader}>
                                    <Text style={styles.leadCompany}>{lead.Company || "No Company"}</Text>
                                    <View style={[styles.statusBadge, {backgroundColor: getStatusBg(lead.Status)}]}>
                                        <Text style={[styles.statusText, {color: getStatusColor(lead.Status)}]}>
                                            {lead.Status || "New"}
                                        </Text>
                                    </View>
                                </View>

                                {(lead.FirstName || lead.LastName) && (
                                    <Text style={styles.leadName}>
                                        {[lead.FirstName, lead.LastName].filter(Boolean).join(" ")}
                                    </Text>
                                )}

                                <View style={styles.contactInfo}>
                                    {lead.Email && (
                                        <View style={styles.contactRow}>
                                            <Ionicons name="mail-outline" size={14} color={C.textMuted} />
                                            <Text style={styles.contactText}>{lead.Email}</Text>
                                        </View>
                                    )}
                                    {lead.Phone && (
                                        <View style={styles.contactRow}>
                                            <Ionicons name="call-outline" size={14} color={C.textMuted} />
                                            <Text style={styles.contactText}>{lead.Phone}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.leadFooter}>
                                    <View style={styles.contactRow}>
                                        <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
                                        <Text style={styles.footerText}>Created {formatDate(lead.CreatedDate)}</Text>
                                    </View>
                                    {lead.LeadSource && (
                                        <View style={styles.contactRow}>
                                            <Ionicons name="source" size={12} color={C.textMuted} />
                                            <Text style={styles.footerText}>{lead.LeadSource}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Custom Popup */}
            <CustomPopup
                visible={popupVisible}
                title={popupTitle}
                message={popupMessage}
                type={popupType}
                onClose={() => setPopupVisible(false)}
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
        fontSize: 20,
        fontWeight: "700",
        color: C.textPrimary,
    },
    createBtn: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: C.textMuted,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        color: C.textMuted,
        marginTop: 16,
        textAlign: "center",
    },
    emptyButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: C.primary,
        borderRadius: 25,
    },
    emptyButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    leadCard: {
        backgroundColor: C.surface,
        marginHorizontal: 16,
        marginBottom: 10,
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
    leadHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    leadCompany: {
        fontSize: 16,
        fontWeight: "700",
        color: C.textPrimary,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    leadName: {
        fontSize: 14,
        color: C.textSecondary,
        marginBottom: 8,
    },
    contactInfo: {
        marginBottom: 8,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    contactText: {
        fontSize: 13,
        color: C.textSecondary,
    },
    leadFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    footerText: {
        fontSize: 11,
        color: C.textMuted,
    },
});

export default LeadsListScreen;
