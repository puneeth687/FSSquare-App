// AccountsListScreen.js
import React, { useState, useEffect } from 'react';
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
    ActivityIndicator,
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

function AccountsListScreen({ route, navigation }) {
    const { sfToken, sfInstanceUrl } = route.params;
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        filterAccounts();
    }, [searchText, accounts]);

    const fetchAccounts = async () => {
        try {
            const query = encodeURIComponent(
                `SELECT Id, Name, Phone, Website, Industry, Rating, AnnualRevenue, NumberOfEmployees, BillingCity, BillingState, BillingCountry, Type, Owner.Name, CreatedDate FROM Account ORDER BY Name DESC LIMIT 100`
            );
            
            const response = await fetch(`${sfInstanceUrl}/services/data/v58.0/query?q=${query}`, {
                headers: {
                    'Authorization': `Bearer ${sfToken}`,
                    'Content-Type': 'application/json',
                },
            });
            
            const result = await response.json();
            
            if (result.records) {
                setAccounts(result.records);
                setFilteredAccounts(result.records);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            Alert.alert('Error', 'Failed to load accounts');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterAccounts = () => {
        if (!searchText.trim()) {
            setFilteredAccounts(accounts);
        } else {
            const filtered = accounts.filter(account =>
                (account.Name || '').toLowerCase().includes(searchText.toLowerCase()) ||
                (account.BillingCity || '').toLowerCase().includes(searchText.toLowerCase()) ||
                (account.Industry || '').toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredAccounts(filtered);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAccounts();
    };

    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'customer': return C.success;
            case 'partner': return C.teal;
            case 'competitor': return C.danger;
            default: return C.primary;
        }
    };

    const formatCurrency = (value) => {
        if (!value) return 'Not specified';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customers</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={C.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, city or industry..."
                    placeholderTextColor={C.textMuted}
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText !== '' && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close-circle" size={20} color={C.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Accounts List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={styles.loadingText}>Loading customers...</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
                    }
                >
                    {filteredAccounts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="business-outline" size={64} color={C.textMuted} />
                            <Text style={styles.emptyText}>
                                {searchText ? 'No customers found' : 'No customers yet'}
                            </Text>
                        </View>
                    ) : (
                        filteredAccounts.map((account) => (
                            <TouchableOpacity
                                key={account.Id}
                                style={styles.accountCard}
                                activeOpacity={0.7}
                                onPress={() => {
                                    navigation.navigate('AccountDetails', {
                                        account: account,
                                        sfToken: sfToken,
                                        sfInstanceUrl: sfInstanceUrl,
                                    });
                                }}
                            >
                                <View style={styles.accountHeader}>
                                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(account.Type) + '15' }]}>
                                        <Text style={[styles.typeText, { color: getTypeColor(account.Type) }]}>
                                            {account.Type || 'Customer'}
                                        </Text>
                                    </View>
                                    {account.Rating && (
                                        <View style={[styles.ratingBadge, { backgroundColor: C.warningLight }]}>
                                            <Text style={[styles.ratingText, { color: C.warning }]}>{account.Rating}</Text>
                                        </View>
                                    )}
                                </View>
                                
                                <Text style={styles.accountName}>{account.Name || 'Unnamed'}</Text>
                                
                                <View style={styles.detailsRow}>
                                    {account.BillingCity && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="location-outline" size={14} color={C.textMuted} />
                                            <Text style={styles.detailText}>
                                                {[account.BillingCity, account.BillingState].filter(Boolean).join(', ')}
                                            </Text>
                                        </View>
                                    )}
                                    {account.Phone && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="call-outline" size={14} color={C.textMuted} />
                                            <Text style={styles.detailText}>{account.Phone}</Text>
                                        </View>
                                    )}
                                </View>
                                
                                <View style={styles.footerRow}>
                                    {account.Industry && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="briefcase-outline" size={12} color={C.textMuted} />
                                            <Text style={styles.footerText}>{account.Industry}</Text>
                                        </View>
                                    )}
                                    {account.AnnualRevenue && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="cash-outline" size={12} color={C.textMuted} />
                                            <Text style={styles.footerText}>{formatCurrency(account.AnnualRevenue)}</Text>
                                        </View>
                                    )}
                                </View>
                                
                                <Ionicons name="chevron-forward" size={18} color={C.textMuted} style={styles.chevron} />
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
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
        fontSize: 20,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: C.textMuted,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        color: C.textMuted,
        marginTop: 16,
        textAlign: 'center',
    },
    accountCard: {
        backgroundColor: C.surface,
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    accountHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    ratingBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '600',
    },
    accountName: {
        fontSize: 16,
        fontWeight: '700',
        color: C.textPrimary,
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: C.textSecondary,
    },
    footerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    footerText: {
        fontSize: 11,
        color: C.textMuted,
    },
    chevron: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -9,
    },
});

export default AccountsListScreen;