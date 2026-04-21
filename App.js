import {StatusBar} from "expo-status-bar";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    ActivityIndicator,
    TextInput,
    Alert,
    Linking,
} from "react-native";
import {Modal} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import * as WebBrowser from "expo-web-browser";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";

WebBrowser.maybeCompleteAuthSession();

const SF_CLIENT_ID = "YOUR_SALESFORCE_CONSUMER_KEY";
const SF_CLIENT_SECRET = "YOUR_SALESFORCE_CONSUMER_SECRET";
const SF_BASE_URL = "YOUR_SALESFORCE_INSTANCE_URL"; // e.g., https://yourdomain.my.salesforce.com/
// ============================================================================

const Stack = createNativeStackNavigator();

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

const ROLES = {
    technician: {
        label: "Field Technician",
        subtitle: "Service & Maintenance",
        icon: "construct-outline",
        color: C.teal,
        light: C.tealLight,
        tabs: [
            {key: "home", icon: "home-outline", label: "Home"},
            {key: "jobs", icon: "briefcase-outline", label: "My Jobs"},
            {key: "map", icon: "map-outline", label: "Map"},
            {key: "parts", icon: "cube-outline", label: "Parts"},
            {key: "me", icon: "person-outline", label: "Me"},
        ],
        alert: {
            type: "warning",
            message: "Reliance Industries — open complaint logged 3 days ago. Review before arrival.",
        },
        actions: [
            {icon: "checkbox-outline", label: "Check In"},
            {icon: "camera-outline", label: "Add Photo"},
            {icon: "document-text-outline", label: "Log Job"},
            {icon: "flag-outline", label: "Flag Deal"},
        ],
    },
    salesrep: {
        label: "Sales Representative",
        subtitle: "Field Sales",
        icon: "trending-up-outline",
        color: C.primary,
        light: C.primaryLight,
        tabs: [
            {key: "home", icon: "home-outline", label: "Home"},
            {key: "customers", icon: "people-outline", label: "Customers"},
            {key: "pipeline", icon: "trending-up-outline", label: "Pipeline"},
            {key: "schedule", icon: "calendar-outline", label: "Schedule"},
            {key: "me", icon: "person-outline", label: "Me"},
        ],
        alert: {
            type: "warning",
            message: "Infosys Limited — 2 open service tickets before your 2pm visit. Be prepared.",
        },
        actions: [
            {icon: "create-outline", label: "Log Visit"},
            {icon: "person-add-outline", label: "New Lead"},
            {icon: "trending-up-outline", label: "New Deal"},
            {icon: "flag-outline", label: "Flag Opp"},
        ],
    },
    manager: {
        label: "Field Manager",
        subtitle: "Sales & Service Oversight",
        icon: "grid-outline",
        color: C.purple,
        light: C.purpleLight,
        tabs: [
            {key: "home", icon: "home-outline", label: "Home"},
            {key: "team", icon: "people-outline", label: "Team"},
            {key: "pipeline", icon: "trending-up-outline", label: "Pipeline"},
            {key: "operations", icon: "briefcase-outline", label: "Operations"},
            {key: "insights", icon: "bar-chart-outline", label: "Insights"},
        ],
        alert: {
            type: "danger",
            message: "Technician Rahul — Work Order WO-2041 is overdue by 2 hours. Immediate attention needed.",
        },
        actions: [
            {icon: "map-outline", label: "Live Map"},
            {icon: "swap-horizontal-outline", label: "Reassign"},
            {icon: "bar-chart-outline", label: "Insights"},
            {icon: "alert-circle-outline", label: "Alerts"},
        ],
    },
};

// ─── SALESFORCE LOGIN ────────────────────────────────────────────────────────
function SalesforceLogin({roleKey, role, onLoginSuccess, onBack}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const redirectUri = "fsquared://oauthredirect";

            const authUrl =
                `${SF_BASE_URL}/services/oauth2/authorize?` +
                `response_type=token` +
                `&client_id=${SF_CLIENT_ID}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&display=touch`;

            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

            if (result.type === "success") {
                const accessTokenMatch = result.url.match(/access_token=([^&]*)/);
                const instanceUrlMatch = result.url.match(/instance_url=([^&]*)/);

                if (accessTokenMatch && instanceUrlMatch) {
                    const accessToken = decodeURIComponent(accessTokenMatch[1]);
                    const instanceUrl = decodeURIComponent(instanceUrlMatch[1]);

                    const userRes = await fetch(`${instanceUrl}/services/oauth2/userinfo`, {
                        headers: {Authorization: `Bearer ${accessToken}`},
                    });
                    const userData = await userRes.json();

                    await AsyncStorage.setItem("sf_access_token", accessToken);
                    await AsyncStorage.setItem("sf_instance_url", instanceUrl);
                    await AsyncStorage.setItem("sf_role", roleKey);
                    await AsyncStorage.setItem("sf_user_name", userData.name || "User");

                    onLoginSuccess(accessToken, instanceUrl, {name: userData.name || "User"});
                } else {
                    setError("No access token received");
                }
            } else if (result.type === "cancel") {
                setError("Login cancelled");
            }
        } catch (err) {
            console.error("OAuth error:", err);
            setError(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <SafeAreaView style={styles.loginContainer}>
            <StatusBar style="dark" />
            <TouchableOpacity onPress={onBack} style={styles.loginBackBtn}>
                <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
                <Text style={styles.loginBackText}>Back to Roles</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.loginContent}>
                <View style={[styles.loginIconBox, {backgroundColor: role.light}]}>
                    <Ionicons name={role.icon} size={48} color={role.color} />
                </View>
                <Text style={styles.loginTitle}>Sign in as</Text>
                <Text style={[styles.loginRoleName, {color: role.color}]}>{role.label}</Text>
                <Text style={styles.loginSubtitle}>You'll be redirected to Salesforce to log in.</Text>

                {error ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={18} color={C.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[styles.loginBtn, {backgroundColor: role.color}, isLoading && {opacity: 0.7}]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.85}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="cloud-outline" size={20} color="#fff" />
                            <Text style={styles.loginBtnText}>Login with Salesforce</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── ROLE SELECTOR ───────────────────────────────────────────────────────────
function RoleSelector({onSelectRole}) {
    return (
        <SafeAreaView style={styles.roleScreen}>
            <StatusBar style="dark" />
            <View style={styles.roleHeader}>
                <Text style={styles.roleAppName}>FS²</Text>
                <Text style={styles.roleAppFull}>Field Sales & Service</Text>
                <Text style={styles.rolePrompt}>Select your role to continue</Text>
            </View>
            <View style={styles.roleCards}>
                {Object.entries(ROLES).map(([key, role]) => (
                    <TouchableOpacity
                        key={key}
                        style={styles.roleCard}
                        onPress={() => onSelectRole(key)}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.roleIconBox, {backgroundColor: role.light}]}>
                            <Ionicons name={role.icon} size={28} color={role.color} />
                        </View>
                        <View style={styles.roleCardText}>
                            <Text style={styles.roleCardLabel}>{role.label}</Text>
                            <Text style={styles.roleCardSub}>{role.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.roleFooter}>
                <View style={[styles.footerDot, {backgroundColor: C.primary}]} />
                <View style={[styles.footerDot, {backgroundColor: C.teal}]} />
                <View style={[styles.footerDot, {backgroundColor: C.purple}]} />
                <Text style={styles.footerText}> Powered by Salesforce</Text>
            </View>
        </SafeAreaView>
    );
}

// ─── VISIT DETAILS SCREEN (Only Notes editable) ─────────────────────────────
function VisitDetailsScreen({route, navigation}) {
    const {visit, sfToken, sfInstanceUrl, onVisitUpdate} = route.params;
    const [showMore, setShowMore] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingValue, setEditingValue] = useState("");
    const [updating, setUpdating] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleCheckIn = async () => {
        try {
            // Request location permissions
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Denied", "Location permission is required to check in");
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const {latitude, longitude} = location.coords;

            setUpdating(true);

            // Get current user ID
            const userId = await getCurrentUserId();

            if (!userId) {
                throw new Error("Could not get current user ID");
            }

            // Create Attendance record only (don't update Visit status)
            const attendanceBody = {
                Employee_Name__c: userId,
                Login_Time__c: new Date().toISOString(),
                Latitude__c: latitude.toString(),
                Longitude__c: longitude.toString(),
                Status__c: "Present",
            };

            console.log("Creating Attendance record with:", attendanceBody);

            const attendanceResponse = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Attendence__c`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${sfToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(attendanceBody),
            });

            const attendanceResult = await attendanceResponse.json();

            if (!attendanceResponse.ok) {
                console.error("Attendance API Error:", attendanceResult);
                throw new Error(attendanceResult[0]?.message || "Failed to create attendance record");
            }

            console.log("Attendance created:", attendanceResult);

            // Show success message - no Visit status update
            Alert.alert("Success", "Checked in successfully! Attendance record created.");
        } catch (error) {
            console.error("Check In error:", error);
            Alert.alert("Error", `Failed to check in: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleComplete = async () => {
        Alert.alert("Complete Visit", `Mark ${visit.customer} as completed?`, [
            {text: "Cancel", style: "cancel"},
            {
                text: "Complete",
                onPress: async () => {
                    setUpdating(true);
                    try {
                        // Update Visit status to "Completed"
                        const response = await fetch(
                            `${sfInstanceUrl}/services/data/v58.0/sobjects/Visit/${visit.id}`,
                            {
                                method: "PATCH",
                                headers: {
                                    Authorization: `Bearer ${sfToken}`,
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({Status: "Completed"}),
                            }
                        );

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData[0]?.message || "Failed to complete visit");
                        }

                        // Update local visit object
                        visit.status = "Completed";
                        visit.statusColor = getStatusColor("Completed");
                        visit.statusBg = getStatusBg("Completed");

                        // Update parent component
                        if (onVisitUpdate) {
                            onVisitUpdate(visit);
                        }

                        Alert.alert("🎉 Visit Completed!", `Great job! ${visit.customer} visit has been completed.`, [
                            {text: "OK", onPress: () => navigation.goBack()},
                        ]);
                    } catch (error) {
                        console.error("Complete error:", error);
                        Alert.alert("Error", `Failed to complete visit: ${error.message}`);
                    } finally {
                        setUpdating(false);
                    }
                },
            },
        ]);
    };

    const getCurrentUserId = async () => {
        try {
            const response = await fetch(`${sfInstanceUrl}/services/oauth2/userinfo`, {
                headers: {Authorization: `Bearer ${sfToken}`},
            });
            const userData = await response.json();
            return userData.user_id || userData.sub?.split("/").pop();
        } catch (error) {
            console.error("Error getting user ID:", error);
            return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return C.success;
            case "checked in":
                return C.teal;
            case "in progress":
                return C.warning;
            case "planned":
                return C.primary;
            case "cancelled":
                return C.danger;
            default:
                return C.primary;
        }
    };

    const getStatusBg = (status) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return C.successLight;
            case "checked in":
                return C.tealLight;
            case "in progress":
                return C.warningLight;
            case "planned":
                return C.primaryLight;
            case "cancelled":
                return C.dangerLight;
            default:
                return C.primaryLight;
        }
    };

    const handleNavigate = () => {
        if (visit.address) {
            Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(visit.address)}`);
        }
    };

    const handleEditNotes = () => {
        setEditingValue(visit.note || "");
        setModalVisible(true);
    };

    const handleSaveNotes = async () => {
        if (updating) return;
        setUpdating(true);

        try {
            const response = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Visit/${visit.id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${sfToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({cgcloud__Note__c: editingValue}),
            });

            if (response.ok) {
                visit.note = editingValue;
                if (onVisitUpdate) {
                    onVisitUpdate(visit);
                }
                Alert.alert("Success", "Notes updated successfully!");
                setModalVisible(false);
                navigation.setParams({visit: {...visit}});
            } else {
                const errorData = await response.json();
                Alert.alert("Error", `Failed to update: ${errorData[0]?.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Update error:", error);
            Alert.alert("Error", `Failed to update: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const displayValue = (value, fallback = "Not specified") => {
        if (value === undefined || value === null || value === "") return fallback;
        return value;
    };

    // Get dynamic status color for display
    const currentStatusColor = getStatusColor(visit.status);
    const currentStatusBg = getStatusBg(visit.status);

    return (
        <SafeAreaView style={[styles.container, {paddingTop: 0}]}>
            <StatusBar style="dark" />

            <View style={styles.detailsHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.detailsBackBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.detailsHeaderTitle}>Visit Details</Text>
                <View style={{width: 40}} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>
                {/* Status Card - Dynamic based on current status */}
                <View style={[styles.detailsStatusCard, {backgroundColor: currentStatusBg}]}>
                    <View style={styles.detailsStatusRow}>
                        <Ionicons name="time-outline" size={20} color={currentStatusColor} />
                        <Text style={[styles.detailsStatusText, {color: currentStatusColor}]}>
                            {displayValue(visit.status, "Planned")}
                        </Text>
                    </View>
                    <Text style={styles.detailsVisitType}>{displayValue(visit.type, "Field Visit")}</Text>
                </View>

                {/* Customer Information */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="business-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Customer Information</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Account:</Text>
                        <Text style={styles.detailsInfoValue}>{displayValue(visit.customer)}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Location:</Text>
                        <Text style={styles.detailsInfoValue}>{displayValue(visit.location)}</Text>
                    </View>
                    <TouchableOpacity onPress={handleNavigate} style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Address:</Text>
                        <Text style={[styles.detailsInfoValue, {color: C.primary}]}>{displayValue(visit.address)}</Text>
                    </TouchableOpacity>
                </View>

                {/* Schedule */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="calendar-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Schedule</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Planned Start:</Text>
                        <Text style={styles.detailsInfoValue}>{formatDate(visit.plannedStartTime)}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Planned End:</Text>
                        <Text style={styles.detailsInfoValue}>{formatDate(visit.plannedEndTime)}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Subject:</Text>
                        <Text style={styles.detailsInfoValue}>{displayValue(visit.subject)}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Visit Template:</Text>
                        <Text style={styles.detailsInfoValue}>{displayValue(visit.visitTemplate)}</Text>
                    </View>
                    <View style={styles.detailsInfoRow}>
                        <Text style={styles.detailsInfoLabel}>Responsible:</Text>
                        <Text style={styles.detailsInfoValue}>{displayValue(visit.responsible)}</Text>
                    </View>
                </View>

                {/* Notes (Editable) */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailsCardHeader}>
                        <Ionicons name="chatbubble-outline" size={20} color={C.primary} />
                        <Text style={styles.detailsCardTitle}>Notes</Text>
                        <TouchableOpacity onPress={handleEditNotes} style={styles.editIcon}>
                            <Ionicons name="pencil-outline" size={18} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.detailsNotesText}>{displayValue(visit.note, "No notes available")}</Text>
                </View>

                {/* Action Buttons - Check In & Complete */}
                <View style={styles.detailsActionsContainer}>
                    <TouchableOpacity
                        style={[styles.detailsActionBtn, {backgroundColor: C.teal}]}
                        onPress={handleCheckIn}
                        disabled={updating || visit.status === "Checked In" || visit.status === "Completed"}
                    >
                        <Ionicons name="checkbox-outline" size={22} color="#fff" />
                        <Text style={styles.detailsActionBtnText}>
                            {visit.status === "Checked In" ? "Checked In ✓" : "Check In"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.detailsActionBtn, {backgroundColor: C.success}]}
                        onPress={handleComplete}
                        disabled={updating || visit.status === "Completed"}
                    >
                        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                        <Text style={styles.detailsActionBtnText}>
                            {visit.status === "Completed" ? "Completed ✓" : "Complete Visit"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.detailsActionBtn, {backgroundColor: C.primary}]}
                        onPress={handleNavigate}
                    >
                        <Ionicons name="navigate-outline" size={22} color="#fff" />
                        <Text style={styles.detailsActionBtnText}>Navigate</Text>
                    </TouchableOpacity>
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
                        {/* Additional Visit Details */}
                        <View style={styles.detailsCard}>
                            <View style={styles.detailsCardHeader}>
                                <Ionicons name="document-text-outline" size={20} color={C.primary} />
                                <Text style={styles.detailsCardTitle}>Additional Details</Text>
                            </View>
                            <View style={styles.detailsInfoRow}>
                                <Text style={styles.detailsInfoLabel}>Visit Number:</Text>
                                <Text style={styles.detailsInfoValue}>{displayValue(visit.name)}</Text>
                            </View>
                            <View style={styles.detailsInfoRow}>
                                <Text style={styles.detailsInfoLabel}>Accountable:</Text>
                                <Text style={styles.detailsInfoValue}>{displayValue(visit.accountable)}</Text>
                            </View>
                            <View style={styles.detailsInfoRow}>
                                <Text style={styles.detailsInfoLabel}>Tour:</Text>
                                <Text style={styles.detailsInfoValue}>{displayValue(visit.tour)}</Text>
                            </View>
                            <View style={styles.detailsInfoRow}>
                                <Text style={styles.detailsInfoLabel}>Duration:</Text>
                                <Text style={styles.detailsInfoValue}>
                                    {displayValue(visit.durationEffective)} minutes
                                </Text>
                            </View>
                        </View>

                        {/* Customer KPIs */}
                        <View style={styles.detailsCard}>
                            <View style={styles.detailsCardHeader}>
                                <Ionicons name="stats-chart-outline" size={20} color={C.primary} />
                                <Text style={styles.detailsCardTitle}>Customer KPIs</Text>
                            </View>
                            <View style={styles.detailsInfoRow}>
                                <Text style={styles.detailsInfoLabel}>Distribution Rate All:</Text>
                                <Text style={styles.detailsInfoValue}>
                                    {displayValue(visit.distributionRateAll, "0")}%
                                </Text>
                            </View>
                            <View style={styles.detailsInfoRow}>
                                <Text style={styles.detailsInfoLabel}>OoS Rate All:</Text>
                                <Text style={styles.detailsInfoValue}>{displayValue(visit.oosRateAll, "0")}%</Text>
                            </View>
                            <View style={styles.detailsInfoRow}>
                                <Text style={styles.detailsInfoLabel}>Distribution Issue:</Text>
                                <Text
                                    style={[styles.detailsInfoValue, visit.distributionIssue ? {color: C.danger} : {}]}
                                >
                                    {visit.distributionIssue ? "Yes" : "No"}
                                </Text>
                            </View>
                            <View style={styles.detailsInfoRow}>
                                <Text style={styles.detailsInfoLabel}>OoS Issue:</Text>
                                <Text style={[styles.detailsInfoValue, visit.oosIssue ? {color: C.danger} : {}]}>
                                    {visit.oosIssue ? "Yes" : "No"}
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Edit Notes Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Edit Notes</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close-outline" size={24} color={C.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={[styles.modalInput, {minHeight: 100, textAlignVertical: "top"}]}
                                value={editingValue}
                                onChangeText={setEditingValue}
                                placeholder="Enter notes..."
                                placeholderTextColor={C.textMuted}
                                multiline={true}
                                numberOfLines={4}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalCancelButton]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalSaveButton]}
                                    onPress={handleSaveNotes}
                                    disabled={updating}
                                >
                                    <Text style={styles.modalSaveText}>{updating ? "Saving..." : "Save"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}
// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({roleKey, userInfo, sfToken, sfInstanceUrl, onLogout, navigation}) {
    const role = ROLES[roleKey];
    const [activeTab, setActiveTab] = useState("home");
    const [realData, setRealData] = useState({
        visits: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (sfToken && sfInstanceUrl) {
            fetchSalesforceData();
        }
    }, [sfToken, sfInstanceUrl]);

    const fetchSalesforceData = async () => {
        setRealData((prev) => ({...prev, loading: true, error: null}));
        try {
            const visitQuery = encodeURIComponent(
                "SELECT Id, Name, cgcloud__Subject__c, Status, PlannedVisitStartTime, PlannedVisitEndTime, ActualVisitStartTime, ActualVisitEndTime, Account.Name, AccountId, cgcloud__Account_City__c, cgcloud__Account_Street__c, Place.Name, VisitType.Name, cgcloud__Note__c, cgcloud__Responsible__c, cgcloud__Accountable__c, cgcloud__Creation_Mode__c, cgcloud__Creation_Date_and_Time__c, cgcloud__Tour__c, cgcloud__Week__c, cgcloud__Duration_Effective__c, cgcloud__IsAllDayEvent__c, cgcloud__Fixed_Visit_Date__c, cgcloud__Location_Status__c, cgcloud__Distribution_Rate_All__c, cgcloud__Distribution_Rate_Focus__c, cgcloud__OOS_Rate_All__c, cgcloud__OOS_Rate_Focus__c, cgcloud__PSI__c, cgcloud__PSQ_Rate__c, cgcloud__Distribution_Issues__c, cgcloud__OOS_Issues__c, cgcloud__Distribution_Issue__c, cgcloud__OOS_Issue__c, cgcloud__Start_Geolocation__c, cgcloud__Geolocation__c, cgcloud__Is_Vst_Cmpl_Osid_Range__c, cgcloud__Is_Vst_Start_Osid_Range__c, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate, Owner.Name, RecordType.Name FROM Visit ORDER BY CreatedDate DESC LIMIT 100"
            );
            const visitResponse = await fetch(`${sfInstanceUrl}/services/data/v58.0/query?q=${visitQuery}`, {
                headers: {
                    Authorization: `Bearer ${sfToken}`,
                    "Content-Type": "application/json",
                },
            });
            const visitData = await visitResponse.json();

            if (visitData.error) {
                throw new Error(visitData.error_description || visitData.message);
            }

            setRealData({
                visits: visitData.records || [],
                loading: false,
                error: null,
            });
            // Debug: Log all visits and their dates
            console.log("=== ALL VISITS FROM SALESFORCE ===");
            visitData.records.forEach((visit, index) => {
                console.log(`${index + 1}. ${visit.Account?.Name} - ${visit.PlannedVisitStartTime} - ${visit.Status}`);
            });
            console.log("===================================");
        } catch (error) {
            console.error("Error fetching Salesforce data:", error);
            setRealData((prev) => ({
                ...prev,
                loading: false,
                error: error.message || "Failed to load Salesforce data",
            }));
        }
    };

    const getScheduleFromRealData = () => {
        const scheduleItems = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (realData.visits && Array.isArray(realData.visits)) {
            realData.visits.forEach((visit) => {
                let shouldShow = false;
                let displayLabel = "";

                if (visit.PlannedVisitStartTime) {
                    const visitDate = new Date(visit.PlannedVisitStartTime);
                    // Compare date only (ignoring time and timezone)
                    const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
                    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const tomorrowDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

                    if (visitDateOnly.getTime() === todayDateOnly.getTime()) {
                        shouldShow = true;
                        displayLabel = "Today";
                    } else if (visitDateOnly.getTime() === tomorrowDateOnly.getTime()) {
                        shouldShow = true;
                        displayLabel = "Tomorrow";
                    }

                    console.log(
                        `Visit: ${visit.Account?.Name}, UTC: ${
                            visit.PlannedVisitStartTime
                        }, DateOnly: ${visitDateOnly.toDateString()}, Label: ${displayLabel || "No"}`
                    );
                }

                if (shouldShow) {
                    scheduleItems.push({
                        type: visit.VisitType?.Name || "Field Visit",
                        customer: visit.Account?.Name || "Unknown Account",
                        location: visit.cgcloud__Account_City__c || visit.Place?.Name || "Location TBD",
                        time: visit.PlannedVisitStartTime
                            ? new Date(visit.PlannedVisitStartTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })
                            : "TBD",
                        status: visit.Status || "Planned",
                        statusColor: getStatusColor(visit.Status),
                        statusBg: getStatusBg(visit.Status),
                        id: visit.Id,
                        recordType: "Visit",
                        subject: visit.cgcloud__Subject__c || "",
                        note: visit.cgcloud__Note__c || "",
                        address: visit.cgcloud__Account_Street__c || "",
                        plannedStartTime: visit.PlannedVisitStartTime,
                        plannedEndTime: visit.PlannedVisitEndTime,
                        actualStartTime: visit.ActualVisitStartTime,
                        actualEndTime: visit.ActualVisitEndTime,
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
                        fixedVisitDate: visit.cgcloud__Fixed_Visit_Date__c,
                        locationStatus: visit.cgcloud__Location_Status__c,
                        distributionRateAll: visit.cgcloud__Distribution_Rate_All__c,
                        distributionRateFocus: visit.cgcloud__Distribution_Rate_Focus__c,
                        oosRateAll: visit.cgcloud__OOS_Rate_All__c,
                        oosRateFocus: visit.cgcloud__OOS_Rate_Focus__c,
                        psi: visit.cgcloud__PSI__c,
                        psqRate: visit.cgcloud__PSQ_Rate__c,
                        distributionIssue: visit.cgcloud__Distribution_Issues__c,
                        oosIssue: visit.cgcloud__OOS_Issues__c,
                        distributionIssueValue: visit.cgcloud__Distribution_Issue__c,
                        oosIssueValue: visit.cgcloud__OOS_Issue__c,
                        startGeolocation: visit.cgcloud__Start_Geolocation__c,
                        geolocation: visit.cgcloud__Geolocation__c,
                        visitCompletedOutsideRange: visit.cgcloud__Is_Vst_Cmpl_Osid_Range__c,
                        visitStartOutsideRange: visit.cgcloud__Is_Vst_Start_Osid_Range__c,
                        createdBy: visit.CreatedBy?.Name,
                        createdDate: visit.CreatedDate,
                        lastModifiedBy: visit.LastModifiedBy?.Name,
                        lastModifiedDate: visit.LastModifiedDate,
                        ownerName: visit.Owner?.Name,
                        recordType: visit.RecordType?.Name,
                        displayLabel: displayLabel,
                    });
                }
            });
        }

        console.log(`Total visits for today/tomorrow: ${scheduleItems.length}`);
        return scheduleItems.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 10);
    };
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return C.success;
            case "in progress":
                return C.warning;
            case "planned":
                return C.teal;
            case "cancelled":
                return C.danger;
            default:
                return C.primary;
        }
    };

    const getStatusBg = (status) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return C.successLight;
            case "in progress":
                return C.warningLight;
            case "planned":
                return C.tealLight;
            case "cancelled":
                return C.dangerLight;
            default:
                return C.primaryLight;
        }
    };
    const getRealStats = () => {
        const todayVisits = realData.visits.filter((visit) => {
            if (!visit.PlannedVisitStartTime) return false;
            const visitDate = new Date(visit.PlannedVisitStartTime);
            const today = new Date();
            return visitDate.toDateString() === today.toDateString();
        }).length;

        const plannedVisits = realData.visits.filter((visit) => visit.Status?.toLowerCase() === "planned").length;
        const completedVisits = realData.visits.filter((visit) => visit.Status?.toLowerCase() === "completed").length;

        return [
            {value: todayVisits.toString(), label: "Visits Today", color: C.primary, icon: "people-outline"},
            {value: plannedVisits.toString(), label: "Planned Visits", color: C.warning, icon: "calendar-outline"},
            {value: completedVisits.toString(), label: "Completed", color: C.success, icon: "checkmark-circle-outline"},
        ];
    };

    const getRealAlert = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueVisits = realData.visits.filter((visit) => {
            if (!visit.PlannedVisitStartTime) return false;
            const visitDate = new Date(visit.PlannedVisitStartTime);
            return visitDate < new Date() && visit.Status?.toLowerCase() !== "completed";
        });

        if (overdueVisits.length > 0) {
            return {type: "danger", message: `${overdueVisits[0].Account?.Name || "A visit"} is overdue.`};
        }

        const todayVisits = realData.visits.filter((visit) => {
            if (!visit.PlannedVisitStartTime) return false;
            const visitDate = new Date(visit.PlannedVisitStartTime);
            visitDate.setHours(0, 0, 0, 0);
            return visitDate.getTime() === today.getTime();
        }).length;

        if (todayVisits === 0) {
            return {type: "info", message: "No visits scheduled for today."};
        }

        return {
            type: "success",
            message: `You have ${todayVisits} visit${todayVisits > 1 ? "s" : ""} scheduled for today.`,
        };
    };

    const alertColor = realData.error
        ? C.danger
        : realData.loading
        ? C.textMuted
        : getRealAlert().type === "danger"
        ? C.danger
        : C.success;
    const alertBg = realData.error
        ? C.dangerLight
        : realData.loading
        ? C.border
        : getRealAlert().type === "danger"
        ? C.dangerLight
        : C.successLight;
    const displayStats = realData.loading
        ? [
              {value: "...", label: "Visits Today", color: C.primary, icon: "people-outline"},
              {value: "...", label: "Planned Visits", color: C.warning, icon: "calendar-outline"},
              {value: "...", label: "Completed", color: C.success, icon: "checkmark-circle-outline"},
          ]
        : getRealStats();
    const displayAlert = realData.error
        ? {type: "danger", message: realData.error}
        : realData.loading
        ? {type: "info", message: "Loading Salesforce visits..."}
        : getRealAlert();
    const displaySchedule = realData.loading ? [] : getScheduleFromRealData() || [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={[styles.header, {backgroundColor: role.color}]}>
                <TouchableOpacity onPress={onLogout} style={styles.headerBackBtn}>
                    <Ionicons name="log-out-outline" size={18} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerAppName}>FS²</Text>
                    <Text style={styles.headerRoleLabel}>{role.label}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.notifBtn}>
                        <Ionicons name="notifications-outline" size={22} color="#fff" />
                        <View style={styles.notifBadge} />
                    </TouchableOpacity>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(userInfo?.name || "U")[0].toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: 100}}
            >
                <View style={styles.greetingRow}>
                    <View style={{flex: 1}}>
                        <Text style={styles.greetingName}>
                            Good Morning, {userInfo?.name?.split(" ")[0] || "User"} 👋
                        </Text>
                        <Text style={styles.greetingDate}>
                            {new Date().toLocaleDateString("en-IN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </Text>
                    </View>
                    <View style={[styles.rolePill, {backgroundColor: role.light}]}>
                        <Ionicons name={role.icon} size={12} color={role.color} />
                        <Text style={[styles.rolePillText, {color: role.color}]}>{role.subtitle}</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    {displayStats &&
                        displayStats.map((s, i) => (
                            <View key={i} style={styles.statCard}>
                                <View style={[styles.statIconBox, {backgroundColor: s.color + "18"}]}>
                                    <Ionicons name={s.icon} size={18} color={s.color} />
                                </View>
                                <Text style={[styles.statValue, {color: s.color}]}>
                                    {realData.loading ? "..." : s.value}
                                </Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                </View>

                <View style={[styles.alertCard, {backgroundColor: alertBg, borderLeftColor: alertColor}]}>
                    <Ionicons name="alert-circle" size={18} color={alertColor} style={{marginRight: 10}} />
                    <View style={{flex: 1}}>
                        <Text style={[styles.alertTitle, {color: alertColor}]}>
                            {realData.error ? "Error" : realData.loading ? "Loading" : "Smart Alert"}
                        </Text>
                        <Text style={[styles.alertMsg, {color: alertColor + "CC"}]}>{displayAlert.message}</Text>
                    </View>
                    {!realData.loading && !realData.error && (
                        <TouchableOpacity onPress={fetchSalesforceData}>
                            <Ionicons name="refresh-outline" size={18} color={alertColor} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Schedule</Text>
                    <TouchableOpacity onPress={fetchSalesforceData}>
                        <Text style={[styles.sectionLink, {color: role.color}]}>
                            {realData.loading ? "Loading..." : "Refresh"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {(!displaySchedule || displaySchedule.length === 0) && !realData.loading ? (
                    <View style={[styles.scheduleCard, {justifyContent: "center", alignItems: "center", padding: 30}]}>
                        <Text style={{color: C.textMuted}}>No visits scheduled</Text>
                        <TouchableOpacity onPress={fetchSalesforceData} style={{marginTop: 10}}>
                            <Text style={{color: role.color}}>Tap to refresh</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    displaySchedule.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.scheduleCard}
                            activeOpacity={0.8}
                            onPress={() => {
                                navigation.navigate("VisitDetails", {
                                    visit: item,
                                    sfToken: sfToken,
                                    sfInstanceUrl: sfInstanceUrl,
                                    onVisitUpdate: (updatedVisit) => {
                                        // Update the visit in the local state
                                        setRealData((prev) => ({
                                            ...prev,
                                            visits: prev.visits.map((v) =>
                                                v.Id === updatedVisit.id ? {...v, ...updatedVisit} : v
                                            ),
                                        }));
                                    },
                                });
                            }}
                        >
                            <View style={styles.scheduleLeft}>
                                <View style={[styles.scheduleTypePill, {backgroundColor: role.light}]}>
                                    <Text style={[styles.scheduleTypeText, {color: role.color}]}>{item.type}</Text>
                                </View>
                                {item.displayLabel && (
                                    <View
                                        style={[
                                            styles.scheduleTypePill,
                                            {
                                                backgroundColor:
                                                    item.displayLabel === "Today" ? C.successLight : C.warningLight,
                                                marginTop: 4,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.scheduleTypeText,
                                                {color: item.displayLabel === "Today" ? C.success : C.warning},
                                            ]}
                                        >
                                            {item.displayLabel}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.scheduleCustomer}>{item.customer}</Text>
                                <View style={styles.scheduleMetaRow}>
                                    <Ionicons name="location-outline" size={12} color={C.textMuted} />
                                    <Text style={styles.scheduleMeta}>{item.location}</Text>
                                </View>
                                <View style={styles.scheduleMetaRow}>
                                    <Ionicons name="time-outline" size={12} color={C.textMuted} />
                                    <Text style={styles.scheduleMeta}>{item.time}</Text>
                                </View>
                            </View>
                            <View style={styles.scheduleRight}>
                                <View style={[styles.statusPill, {backgroundColor: item.statusBg}]}>
                                    <Text style={[styles.statusText, {color: item.statusColor}]}>{item.status}</Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={16}
                                    color={C.textMuted}
                                    style={{marginTop: 10}}
                                />
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <Text style={[styles.sectionTitle, {marginTop: 8, marginBottom: 12}]}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    {role.actions.map((a, i) => (
                        <TouchableOpacity key={i} style={styles.actionCard} activeOpacity={0.8}>
                            <View style={[styles.actionIconBox, {backgroundColor: role.light}]}>
                                <Ionicons name={a.icon} size={22} color={role.color} />
                            </View>
                            <Text style={styles.actionLabel}>{a.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.tabBar}>
                {role.tabs.map((tab) => {
                    const active = tab.key === activeTab;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={styles.tabItem}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={tab.icon} size={22} color={active ? role.color : C.textMuted} />
                            <Text style={[styles.tabLabel, active && {color: role.color, fontWeight: "700"}]}>
                                {tab.label}
                            </Text>
                            {active && <View style={[styles.tabActiveBar, {backgroundColor: role.color}]} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

// ─── ROOT APP WITH NAVIGATION ────────────────────────────────────────────────
function AppNavigator() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [sfToken, setSfToken] = useState(null);
    const [sfInstanceUrl, setSfInstanceUrl] = useState(null);
    const [sfUserInfo, setSfUserInfo] = useState(null);

    useEffect(() => {
        checkExistingSession();
    }, []);

    const checkExistingSession = async () => {
        try {
            const token = await AsyncStorage.getItem("sf_access_token");
            const instanceUrl = await AsyncStorage.getItem("sf_instance_url");
            const role = await AsyncStorage.getItem("sf_role");
            const userName = await AsyncStorage.getItem("sf_user_name");
            if (token && instanceUrl && role) {
                setSfToken(token);
                setSfInstanceUrl(instanceUrl);
                setSfUserInfo({name: userName || "User"});
                setSelectedRole(role);
                setIsLoggedIn(true);
            }
        } catch (err) {
            console.log("No existing session");
        }
    };

    const handleLoginSuccess = (token, instanceUrl, userInfo, roleKey) => {
        setSfToken(token);
        setSfInstanceUrl(instanceUrl);
        setSfUserInfo(userInfo);
        setSelectedRole(roleKey);
        setIsLoggedIn(true);
    };

    const handleLogout = async () => {
        await AsyncStorage.multiRemove([
            "sf_access_token",
            "sf_refresh_token",
            "sf_instance_url",
            "sf_role",
            "sf_user_name",
        ]);
        setSelectedRole(null);
        setIsLoggedIn(false);
        setSfToken(null);
        setSfInstanceUrl(null);
        setSfUserInfo(null);
    };

    if (selectedRole && !isLoggedIn) {
        return (
            <SalesforceLogin
                roleKey={selectedRole}
                role={ROLES[selectedRole]}
                onLoginSuccess={(token, instanceUrl, userInfo) =>
                    handleLoginSuccess(token, instanceUrl, userInfo, selectedRole)
                }
                onBack={() => setSelectedRole(null)}
            />
        );
    }

    if (selectedRole && isLoggedIn && sfToken) {
        return (
            <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Dashboard">
                    {(props) => (
                        <Dashboard
                            {...props}
                            roleKey={selectedRole}
                            userInfo={sfUserInfo}
                            sfToken={sfToken}
                            sfInstanceUrl={sfInstanceUrl}
                            onLogout={handleLogout}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="VisitDetails" component={VisitDetailsScreen} />
            </Stack.Navigator>
        );
    }

    return <RoleSelector onSelectRole={setSelectedRole} />;
}

export default function App() {
    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    roleScreen: {flex: 1, backgroundColor: C.bg},
    roleHeader: {paddingTop: 48, paddingBottom: 32, paddingHorizontal: 28},
    roleAppName: {fontSize: 42, fontWeight: "800", color: C.primary, letterSpacing: 2},
    roleAppFull: {
        fontSize: 15,
        color: C.textSecondary,
        fontWeight: "500",
        marginTop: 2,
        marginBottom: 24,
        letterSpacing: 0.5,
    },
    rolePrompt: {fontSize: 13, color: C.textMuted, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1},
    roleCards: {paddingHorizontal: 20, gap: 12},
    roleCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    roleIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    roleCardText: {flex: 1},
    roleCardLabel: {fontSize: 16, fontWeight: "700", color: C.textPrimary, marginBottom: 3},
    roleCardSub: {fontSize: 13, color: C.textMuted},
    roleFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 40,
        paddingBottom: 20,
    },
    footerDot: {width: 8, height: 8, borderRadius: 4},
    footerText: {fontSize: 12, color: C.textMuted, fontWeight: "500"},
    loginContainer: {flex: 1, backgroundColor: C.bg},
    loginBackBtn: {flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, gap: 8},
    loginBackText: {fontSize: 16, color: C.textPrimary, fontWeight: "500"},
    loginContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
        paddingBottom: 60,
        paddingTop: 20,
    },
    loginIconBox: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    loginTitle: {fontSize: 22, fontWeight: "600", color: C.textSecondary, marginBottom: 4},
    loginRoleName: {fontSize: 28, fontWeight: "800", marginBottom: 12},
    loginSubtitle: {fontSize: 14, color: C.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 32},
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.dangerLight,
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
        width: "100%",
    },
    errorText: {fontSize: 13, color: C.danger, flex: 1},
    inputGroup: {width: "100%", marginBottom: 16},
    inputLabel: {fontSize: 13, fontWeight: "600", color: C.textSecondary, marginBottom: 6},
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 14,
    },
    inputIcon: {marginRight: 10},
    input: {flex: 1, fontSize: 15, color: C.textPrimary, paddingVertical: 14},
    loginBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 14,
        gap: 12,
        width: "100%",
    },
    loginBtnText: {fontSize: 16, fontWeight: "700", color: "#fff"},
    clearText: {fontSize: 13, color: C.textMuted, textDecorationLine: "underline"},
    container: {flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === "android" ? 25 : 0},
    header: {flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10},
    headerBackBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "#FFFFFF20",
        justifyContent: "center",
        alignItems: "center",
    },
    headerCenter: {flex: 1},
    headerAppName: {fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 1},
    headerRoleLabel: {fontSize: 11, color: "#FFFFFFAA", fontWeight: "500", marginTop: 1},
    headerRight: {flexDirection: "row", alignItems: "center", gap: 10},
    notifBtn: {position: "relative"},
    notifBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FF3B30",
        borderWidth: 1.5,
        borderColor: "#fff",
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FFFFFF25",
        borderWidth: 2,
        borderColor: "#FFFFFF50",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {color: "#fff", fontWeight: "700", fontSize: 13},
    scroll: {flex: 1},
    greetingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    greetingName: {fontSize: 18, fontWeight: "700", color: C.textPrimary},
    greetingDate: {fontSize: 13, color: C.textMuted, marginTop: 3},
    rolePill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    rolePillText: {fontSize: 11, fontWeight: "700"},
    statsRow: {flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 16},
    statCard: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    statIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    statValue: {fontSize: 22, fontWeight: "800"},
    statLabel: {fontSize: 10, color: C.textMuted, fontWeight: "600", marginTop: 3, textAlign: "center"},
    alertCard: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 14,
        padding: 14,
        flexDirection: "row",
        borderLeftWidth: 4,
    },
    alertTitle: {fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4},
    alertMsg: {fontSize: 13, lineHeight: 18},
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {fontSize: 16, fontWeight: "700", color: C.textPrimary, paddingHorizontal: 20},
    sectionLink: {fontSize: 13, fontWeight: "600"},
    scheduleCard: {
        backgroundColor: C.surface,
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    scheduleLeft: {flex: 1},
    scheduleTypePill: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 8,
    },
    scheduleTypeText: {fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5},
    scheduleCustomer: {fontSize: 15, fontWeight: "700", color: C.textPrimary, marginBottom: 6},
    scheduleMetaRow: {flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3},
    scheduleMeta: {fontSize: 12, color: C.textMuted},
    scheduleRight: {alignItems: "flex-end", justifyContent: "flex-start", marginLeft: 12},
    statusPill: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
    statusText: {fontSize: 11, fontWeight: "700"},
    actionsGrid: {flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 24},
    actionCard: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    viewMoreButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
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
        fontWeight: "600",
        color: C.primary,
    },
    editIcon: {
        padding: 4,
        marginLeft: 8,
    },

    detailsInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    actionIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    actionLabel: {fontSize: 11, fontWeight: "600", color: C.textSecondary, textAlign: "center"},
    tabBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: C.surface,
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: 54,
        borderTopWidth: 1,
        borderTopColor: C.border,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 10,
    },
    tabItem: {flex: 1, alignItems: "center", position: "relative"},
    tabLabel: {fontSize: 10, color: C.textMuted, fontWeight: "500", marginTop: 3},
    tabActiveBar: {position: "absolute", top: -10, width: 20, height: 3, borderRadius: 2},
    // Visit Details Screen Styles
    detailsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    detailsBackBtn: {padding: 8},
    detailsHeaderTitle: {fontSize: 18, fontWeight: "700", color: C.textPrimary},
    detailsStatusCard: {margin: 16, padding: 16, borderRadius: 12, alignItems: "center"},
    detailsStatusRow: {flexDirection: "row", alignItems: "center", gap: 8},
    detailsStatusText: {fontSize: 14, fontWeight: "600"},
    detailsVisitType: {fontSize: 20, fontWeight: "700", color: C.textPrimary, marginTop: 8},
    detailsCard: {
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
    detailsCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingBottom: 8,
    },
    detailsCardTitle: {fontSize: 16, fontWeight: "700", color: C.textPrimary},
    detailsCustomerName: {fontSize: 18, fontWeight: "600", color: C.textPrimary, marginBottom: 8},
    detailsLocationRow: {flexDirection: "row", alignItems: "center", gap: 6},
    detailsLocationText: {fontSize: 14, color: C.textSecondary, flex: 1},
    detailsInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 20,
        width: "85%",
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: C.textPrimary,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: C.textPrimary,
        backgroundColor: C.bg,
        minHeight: 50,
        maxHeight: 150,
        textAlignVertical: "top",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 80,
        alignItems: "center",
    },
    modalCancelButton: {
        backgroundColor: C.border,
    },
    modalSaveButton: {
        backgroundColor: C.primary,
    },
    modalCancelText: {
        color: C.textSecondary,
        fontWeight: "600",
    },
    modalSaveText: {
        color: "#fff",
        fontWeight: "600",
    },
    detailsInfoLabel: {fontSize: 13, color: C.textMuted, fontWeight: "500"},
    detailsInfoValue: {fontSize: 13, color: C.textPrimary, fontWeight: "400", flex: 1, textAlign: "right"},
    detailsNotesText: {fontSize: 14, color: C.textSecondary, lineHeight: 20},
    detailsActionsContainer: {flexDirection: "row", marginHorizontal: 16, marginTop: 8, gap: 12, marginBottom: 30},
    detailsActionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    detailsActionBtnText: {color: "#fff", fontSize: 14, fontWeight: "600"},
});
