import React, {useState, useRef} from "react";
import {StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator} from "react-native";
import {WebView} from "react-native-webview";
import {Ionicons} from "@expo/vector-icons";

const C = {
    primary: "#0176D3",
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    border: "#E4E8EF",
    textPrimary: "#0D1B2A",
    textSecondary: "#4A5568",
};

function CaptureOrderScreen({route, navigation}) {
    const {sfToken, sfInstanceUrl} = route.params;
    const webViewRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1);

    const frontdoorUrl = `${sfInstanceUrl}/sec/frontdoor.jsp?sid=${sfToken}`;
    const vfUrl = `${sfInstanceUrl}/apex/rcgcaptureordertwo`;
    const currentUrl = step === 1 ? frontdoorUrl : vfUrl;

    const handleLoadEnd = (syntheticEvent) => {
        const url = syntheticEvent.nativeEvent.url;
        console.log("Loaded URL:", url);
        if (step === 1) {
            setStep(2);
            setLoading(true);
        } else {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Capture Order</Text>
                    <View style={{width: 40}} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#C62828" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setError(null);
                            setLoading(true);
                            setStep(1);
                        }}
                    >
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Capture Order</Text>
                <View style={{width: 40}} />
            </View>

            {(loading || step === 1) && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={styles.loaderText}>Loading Capture Order...</Text>
                </View>
            )}

            <WebView
                ref={webViewRef}
                source={{uri: currentUrl}}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={handleLoadEnd}
                onError={() => {
                    setError("Failed to load. Please check your connection.");
                    setLoading(false);
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                allowUniversalAccessFromFileURLs={true}
                allowFileAccessFromFileURLs={true}
                style={[styles.webview, (step === 1 || loading) && {opacity: 0}]}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: C.bg},
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
    backBtn: {padding: 8},
    headerTitle: {fontSize: 18, fontWeight: "700", color: C.textPrimary},
    webview: {flex: 1, backgroundColor: C.bg},
    loaderContainer: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: C.bg,
        zIndex: 1,
    },
    loaderText: {marginTop: 12, fontSize: 14, color: C.textSecondary},
    errorContainer: {flex: 1, justifyContent: "center", alignItems: "center", padding: 20},
    errorText: {marginTop: 12, fontSize: 14, color: "#C62828", textAlign: "center"},
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: C.primary,
        borderRadius: 8,
    },
    retryText: {color: "#fff", fontSize: 14, fontWeight: "600"},
});

export default CaptureOrderScreen;