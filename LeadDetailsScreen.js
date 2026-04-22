// LeadDetailsScreen.js - FULL VERSION with all fields and actions
import React, {useState} from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Linking,
    TextInput,
    Modal,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import CustomPopup from "./CustomPopup";

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

// Picklist options
const STATUS_OPTIONS = [
    "New",
    "Working",
    "Qualified",
    "Converted",
    "Unqualified",
    "Draft",
    "Submitted",
    "Approved",
    "Pending",
    "Rejected",
];
const RATING_OPTIONS = ["Hot", "Warm", "Cold"];
const LEAD_SOURCE_OPTIONS = ["Mobile App", "Web", "Referral", "Event", "Cold Call", "Advertisement", "Social Media"];

function LeadDetailsScreen({route, navigation}) {
    const {lead, sfToken, sfInstanceUrl, onLeadUpdate} = route.params;

    const [leadData, setLeadData] = useState(lead);
    const [loading, setLoading] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showRatingPicker, setShowRatingPicker] = useState(false);
    const [showLeadSourcePicker, setShowLeadSourcePicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingField, setEditingField] = useState("");
    const [editingValue, setEditingValue] = useState("");
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState("");
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState("success");

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (e) {
            return "Not set";
        }
    };

    const formatCurrency = (value) => {
        if (!value) return "Not specified";
        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
            }).format(value);
        } catch (e) {
            return String(value);
        }
    };

    const displayValue = (value, fallback = "Not specified") => {
        if (value === undefined || value === null || value === "") return fallback;
        return String(value);
    };

    const getFullName = () => {
        const firstName = leadData.FirstName || "";
        const lastName = leadData.LastName || "";
        if (firstName || lastName) return `${firstName} ${lastName}`.trim();
        return "Not specified";
    };

    const updateLeadField = async (fieldName, fieldValue) => {
        setLoading(true);
        setPopupVisible(true);
        setPopupTitle("Updating...");
        setPopupMessage(`Updating ${fieldName}`);
        setPopupType("loading");

        try {
            const response = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Lead/${leadData.Id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${sfToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({[fieldName]: fieldValue}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData[0]?.message || "Update failed");
            }

            setLeadData({...leadData, [fieldName]: fieldValue});
            if (onLeadUpdate) {
                onLeadUpdate({...leadData, [fieldName]: fieldValue});
            }
            setPopupTitle("✓ Updated!");
            setPopupMessage(`${fieldName} updated successfully`);
            setPopupType("success");
            setTimeout(() => setPopupVisible(false), 1500);
        } catch (error) {
            console.error("Update error:", error);
            setPopupTitle("Update Failed");
            setPopupMessage(error.message);
            setPopupType("error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditField = (fieldName, currentValue, fieldApiName) => {
        setEditingField(fieldName);
        setEditingValue(currentValue || "");
        setModalVisible(true);
    };

    const handleSaveEdit = async () => {
        let fieldApiName = "";
        let updateValue = editingValue;

        // Map display field names to Salesforce API names
        const fieldMapping = {
            Company: "Company",
            Title: "Title",
            Phone: "Phone",
            Email: "Email",
            Website: "Website",
            Description: "Description",
            "Number of Employees": "NumberOfEmployees",
        };

        fieldApiName = fieldMapping[editingField];

        if (!fieldApiName) {
            Alert.alert("Error", `Field ${editingField} cannot be updated`);
            setModalVisible(false);
            return;
        }

        setLoading(true);
        setModalVisible(false);
        setPopupVisible(true);
        setPopupTitle("Updating...");
        setPopupMessage(`Updating ${editingField}`);
        setPopupType("loading");

        try {
            const response = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Lead/${leadData.Id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${sfToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({[fieldApiName]: updateValue}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData[0]?.message || "Update failed");
            }

            setLeadData({...leadData, [editingField]: updateValue});
            if (onLeadUpdate) {
                onLeadUpdate({...leadData, [editingField]: updateValue});
            }
            setPopupTitle("✓ Updated!");
            setPopupMessage(`${editingField} updated successfully`);
            setPopupType("success");
            setTimeout(() => setPopupVisible(false), 1500);
        } catch (error) {
            setPopupTitle("Update Failed");
            setPopupMessage(error.message);
            setPopupType("error");
        } finally {
            setLoading(false);
        }
    };

    const handleConvertToOpportunity = async () => {
        Alert.alert("Convert to Opportunity", `Create an opportunity from ${displayValue(leadData.Company)}?`, [
            {text: "Cancel", style: "cancel"},
            {
                text: "Convert",
                onPress: async () => {
                    setLoading(true);
                    setPopupVisible(true);
                    setPopupTitle("Converting...");
                    setPopupMessage("Creating opportunity");
                    setPopupType("loading");

                    try {
                        // Create Account
                        const accountBody = {
                            Name: displayValue(leadData.Company, "Unknown Company"),
                            Phone: leadData.Phone || null,
                            Website: leadData.Website || null,
                            Industry: leadData.Industry || null,
                        };

                        const accountResponse = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Account`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${sfToken}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(accountBody),
                        });

                        if (!accountResponse.ok) {
                            const errorData = await accountResponse.json();
                            throw new Error(errorData[0]?.message || "Failed to create account");
                        }
                        const accountResult = await accountResponse.json();

                        // Create Opportunity
                        const oppBody = {
                            Name: `${displayValue(leadData.Company, "Lead")} - Opportunity`,
                            AccountId: accountResult.id,
                            StageName: "Prospecting",
                            CloseDate: new Date().toISOString().split("T")[0],
                        };

                        const oppResponse = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Opportunity`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${sfToken}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(oppBody),
                        });

                        if (!oppResponse.ok) {
                            const errorData = await oppResponse.json();
                            throw new Error(errorData[0]?.message || "Failed to create opportunity");
                        }

                        await updateLeadField("Status", "Converted");

                        setPopupTitle("🎉 Converted!");
                        setPopupMessage(`Account and opportunity created successfully`);
                        setPopupType("success");
                        setTimeout(() => setPopupVisible(false), 2000);
                    } catch (error) {
                        console.error("Conversion error:", error);
                        setPopupTitle("Conversion Failed");
                        setPopupMessage(error.message);
                        setPopupType("error");
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const handleCall = () => {
        if (leadData.Phone) {
            Linking.openURL(`tel:${leadData.Phone}`);
        } else {
            Alert.alert("No Phone Number", "This lead does not have a phone number");
        }
    };

    const handleEmail = () => {
        if (leadData.Email) {
            Linking.openURL(`mailto:${leadData.Email}`);
        } else {
            Alert.alert("No Email", "This lead does not have an email address");
        }
    };

    const handleStatusChange = (newStatus) => {
        updateLeadField("Status", newStatus);
        setShowStatusPicker(false);
    };

    const handleRatingChange = (newRating) => {
        updateLeadField("Rating", newRating);
        setShowRatingPicker(false);
    };

    const handleLeadSourceChange = (newSource) => {
        updateLeadField("LeadSource", newSource);
        setShowLeadSourcePicker(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lead Details</Text>
                <View style={{width: 40}} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Status Card */}
                <View style={[styles.statusCard, {backgroundColor: C.primaryLight}]}>
                    <View style={styles.statusRow}>
                        <Ionicons name="flag-outline" size={20} color={C.primary} />
                        <Text style={styles.statusLabel}>Current Status</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.statusValueContainer}
                        onPress={() => setShowStatusPicker(!showStatusPicker)}
                    >
                        <Text style={styles.statusValue}>{displayValue(leadData.Status, "New")}</Text>
                        <Ionicons name="chevron-down" size={20} color={C.primary} />
                    </TouchableOpacity>
                    {showStatusPicker && (
                        <View style={styles.pickerContainer}>
                            {STATUS_OPTIONS.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={styles.pickerOption}
                                    onPress={() => handleStatusChange(status)}
                                >
                                    <Text style={styles.pickerOptionText}>{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Company Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="business-outline" size={20} color={C.primary} />
                        <Text style={styles.cardTitle}>Company Information</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Company:</Text>
                        <Text style={styles.infoValue}>{displayValue(leadData.Company)}</Text>
                        <TouchableOpacity
                            onPress={() => handleEditField("Company", leadData.Company)}
                            style={styles.editIcon}
                        >
                            <Ionicons name="pencil-outline" size={16} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Website:</Text>
                        <Text style={styles.infoValue}>{displayValue(leadData.Website)}</Text>
                        <TouchableOpacity
                            onPress={() => handleEditField("Website", leadData.Website)}
                            style={styles.editIcon}
                        >
                            <Ionicons name="pencil-outline" size={16} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Industry:</Text>
                        <Text style={styles.infoValue}>{displayValue(leadData.Industry)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Annual Revenue:</Text>
                        <Text style={styles.infoValue}>{formatCurrency(leadData.AnnualRevenue)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Employees:</Text>
                        <Text style={styles.infoValue}>{displayValue(leadData.NumberOfEmployees)}</Text>
                        <TouchableOpacity
                            onPress={() => handleEditField("Number of Employees", leadData.NumberOfEmployees)}
                            style={styles.editIcon}
                        >
                            <Ionicons name="pencil-outline" size={16} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Contact Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-outline" size={20} color={C.primary} />
                        <Text style={styles.cardTitle}>Contact Information</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name:</Text>
                        <Text style={styles.infoValue}>{getFullName()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Title:</Text>
                        <Text style={styles.infoValue}>{displayValue(leadData.Title)}</Text>
                        <TouchableOpacity
                            onPress={() => handleEditField("Title", leadData.Title)}
                            style={styles.editIcon}
                        >
                            <Ionicons name="pencil-outline" size={16} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={[styles.infoValue, {color: C.primary}]}>{displayValue(leadData.Email)}</Text>
                        <TouchableOpacity
                            onPress={() => handleEditField("Email", leadData.Email)}
                            style={styles.editIcon}
                        >
                            <Ionicons name="pencil-outline" size={16} color={C.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleEmail}>
                            <Ionicons name="mail-outline" size={20} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={[styles.infoValue, {color: C.primary}]}>{displayValue(leadData.Phone)}</Text>
                        <TouchableOpacity
                            onPress={() => handleEditField("Phone", leadData.Phone)}
                            style={styles.editIcon}
                        >
                            <Ionicons name="pencil-outline" size={16} color={C.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCall}>
                            <Ionicons name="call-outline" size={20} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Lead Information */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="information-circle-outline" size={20} color={C.primary} />
                        <Text style={styles.cardTitle}>Lead Information</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Lead Source:</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowLeadSourcePicker(!showLeadSourcePicker)}
                        >
                            <Text style={styles.pickerButtonText}>{displayValue(leadData.LeadSource)}</Text>
                            <Ionicons name="chevron-down" size={16} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                    {showLeadSourcePicker && (
                        <View style={styles.pickerContainer}>
                            {LEAD_SOURCE_OPTIONS.map((source) => (
                                <TouchableOpacity
                                    key={source}
                                    style={styles.pickerOption}
                                    onPress={() => handleLeadSourceChange(source)}
                                >
                                    <Text style={styles.pickerOptionText}>{source}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Rating:</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowRatingPicker(!showRatingPicker)}
                        >
                            <Text style={styles.pickerButtonText}>{displayValue(leadData.Rating)}</Text>
                            <Ionicons name="chevron-down" size={16} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                    {showRatingPicker && (
                        <View style={styles.pickerContainer}>
                            {RATING_OPTIONS.map((rating) => (
                                <TouchableOpacity
                                    key={rating}
                                    style={styles.pickerOption}
                                    onPress={() => handleRatingChange(rating)}
                                >
                                    <Text style={styles.pickerOptionText}>{rating}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Created:</Text>
                        <Text style={styles.infoValue}>{formatDate(leadData.CreatedDate)}</Text>
                    </View>
                </View>

                {/* Description/Notes */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text-outline" size={20} color={C.primary} />
                        <Text style={styles.cardTitle}>Notes</Text>
                        <TouchableOpacity
                            onPress={() => handleEditField("Description", leadData.Description)}
                            style={styles.editIcon}
                        >
                            <Ionicons name="pencil-outline" size={18} color={C.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.notesText}>{displayValue(leadData.Description, "No notes available")}</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionBtn, {backgroundColor: C.success}]}
                        onPress={handleConvertToOpportunity}
                    >
                        <Ionicons name="trending-up-outline" size={22} color="#fff" />
                        <Text style={styles.actionBtnText}>Convert</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: C.primary}]} onPress={handleCall}>
                        <Ionicons name="call-outline" size={22} color="#fff" />
                        <Text style={styles.actionBtnText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: C.teal}]} onPress={handleEmail}>
                        <Ionicons name="mail-outline" size={22} color="#fff" />
                        <Text style={styles.actionBtnText}>Email</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit {editingField}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-outline" size={24} color={C.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.modalInput, editingField === "Description" && styles.modalTextArea]}
                            value={editingValue}
                            onChangeText={setEditingValue}
                            placeholder={`Enter ${editingField}`}
                            placeholderTextColor={C.textMuted}
                            multiline={editingField === "Description"}
                            numberOfLines={editingField === "Description" ? 4 : 1}
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
                                onPress={handleSaveEdit}
                            >
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <CustomPopup
                visible={popupVisible}
                title={popupTitle}
                message={popupMessage}
                type={popupType}
                onClose={() => setPopupVisible(false)}
                loading={popupType === "loading"}
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
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    statusCard: {
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: C.textSecondary,
    },
    statusValueContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: C.primaryLight,
        borderRadius: 8,
    },
    statusValue: {
        fontSize: 16,
        fontWeight: "600",
        color: C.primary,
    },
    card: {
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
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
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    infoLabel: {
        fontSize: 13,
        color: C.textMuted,
        fontWeight: "500",
        width: 110,
    },
    infoValue: {
        fontSize: 13,
        color: C.textPrimary,
        flex: 1,
    },
    editIcon: {
        padding: 4,
        marginLeft: 4,
    },
    pickerButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    pickerButtonText: {
        fontSize: 13,
        color: C.textPrimary,
    },
    pickerContainer: {
        marginTop: 8,
        marginBottom: 4,
        backgroundColor: C.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
    },
    pickerOption: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    pickerOptionText: {
        fontSize: 14,
        color: C.textPrimary,
    },
    notesText: {
        fontSize: 14,
        color: C.textSecondary,
        lineHeight: 20,
    },
    actionsContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
        marginBottom: 20,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    actionBtnText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
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
    },
    modalTextArea: {
        minHeight: 100,
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
});

export default LeadDetailsScreen;
