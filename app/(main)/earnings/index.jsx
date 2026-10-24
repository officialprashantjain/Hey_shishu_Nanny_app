import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import walletService from '../../../src/services/walletService';

const STATUS_CONFIG = {
  paid:       { label: 'Paid', bg: '#E8F5E9', text: colors.success },
  pending:    { label: 'Pending Approval', bg: '#FFF3CD', text: colors.warning },
  processing: { label: 'Processing', bg: '#EDE7F6', text: colors.secondary },
  failed:     { label: 'Rejected', bg: '#FFEBEE', text: colors.danger },
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'withdrawals', label: 'Withdrawals' },
];

export default function WalletHomeScreen() {
  const router = useRouter();

  const [wallet, setWallet] = useState({
    available: 0,
    pending: 0,
    thisMonth: 0,
    sessions: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = async (filterCategory = activeTab) => {
    try {
      const [walletRes, historyRes] = await Promise.all([
        walletService.getWalletOverview(),
        walletService.getEarningsHistory(1, 40, filterCategory),
      ]);

      if (walletRes?.data?.wallet) {
        setWallet(walletRes.data.wallet);
      }
      if (historyRes?.data?.transactions || historyRes?.data?.earnings) {
        setTransactions(historyRes.data.transactions || historyRes.data.earnings || []);
      }
    } catch (err) {
      console.error('[WALLET LOAD ERROR]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWalletData(activeTab);
    }, [activeTab])
  );

  const handleTabChange = (key) => {
    setActiveTab(key);
    setLoading(true);
    fetchWalletData(key);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData(activeTab);
  };

  const TransactionCard = ({ item }) => {
    const isWithdrawal = item.category === 'withdrawal';
    const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.paid;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/(main)/earnings/transaction',
            params: { data: JSON.stringify(item) },
          })
        }
        activeOpacity={0.85}
      >
        {/* Left */}
        <View style={styles.cardLeft}>
          <View style={[
            styles.cardAvatar,
            isWithdrawal ? styles.avatarWithdrawal : styles.avatarEarning,
          ]}>
            <Ionicons
              name={isWithdrawal ? 'arrow-up-circle-outline' : 'cash-outline'}
              size={22}
              color={isWithdrawal ? '#E65100' : colors.primary}
            />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
            <Text style={styles.cardMeta}>{item.date}</Text>
          </View>
        </View>

        {/* Right */}
        <View style={styles.cardRight}>
          <Text style={[
            styles.cardAmount,
            isWithdrawal ? styles.amountDebit : styles.amountCredit,
          ]}>
            {isWithdrawal ? '-' : '+'}₹{Number(item.net || 0).toLocaleString()}
          </Text>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── GRADIENT HEADER BANNER ─────────────────────────────────────── */}
      <LinearGradient
        colors={[colors.primary, '#2a5450']}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']}>
          {/* Nav Row */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Wallet</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Balance */}
          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{Number(wallet.available || 0).toLocaleString()}</Text>
            {wallet.pending > 0 ? (
              <View style={styles.pendingChip}>
                <Ionicons name="time-outline" size={13} color={colors.warning} />
                <Text style={styles.pendingChipText}>
                  ₹{Number(wallet.pending || 0).toLocaleString()} in withdrawal
                </Text>
              </View>
            ) : null}
          </View>

          {/* Summary Row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.white} style={{ opacity: 0.8 }} />
              <Text style={styles.summaryVal}>₹{Number(wallet.thisMonth || 0).toLocaleString()}</Text>
              <Text style={styles.summaryLbl}>This Month</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="briefcase-outline" size={16} color={colors.white} style={{ opacity: 0.8 }} />
              <Text style={styles.summaryVal}>{wallet.sessions || 0}</Text>
              <Text style={styles.summaryLbl}>Sessions</Text>
            </View>
          </View>

          {/* Withdraw Button */}
          <TouchableOpacity
            style={styles.withdrawBtn}
            onPress={() => router.push({
              pathname: '/(main)/earnings/withdraw',
              params: {
                available: String(wallet.available || 0),
                savedUpi: wallet.savedUpiId || '',
              }
            })}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      {/* ── TRANSACTION HISTORY & TABS ─────────────────────────────────── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header with Title and Tabs */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabChip, isActive && styles.tabChipActive]}
                  onPress={() => handleTabChange(tab.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Loading transactions...</Text>
          </View>
        ) : transactions.length > 0 ? (
          transactions.map((item) => <TransactionCard key={item.id} item={item} />)
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color={colors.description + '55'} />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'withdrawals'
                ? 'You have not made any withdrawal requests yet.'
                : activeTab === 'earnings'
                ? 'Complete your assigned sessions to start earning!'
                : 'Your session earnings and withdrawal activities will appear here.'}
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Banner
  banner: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 28,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 4,
    marginBottom: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.white,
  },

  // Balance block
  balanceBlock: { alignItems: 'center', marginBottom: 24 },
  balanceLabel: {
    fontFamily: fonts.rubikRegular,
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: fonts.rubikBold,
    fontSize: 48,
    color: colors.white,
    letterSpacing: -1,
  },
  pendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  pendingChipText: {
    fontFamily: fonts.rubikMedium,
    fontSize: 13,
    color: colors.warning,
  },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 24,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },
  summaryVal: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: colors.white,
  },
  summaryLbl: {
    fontFamily: fonts.rubikRegular,
    fontSize: 12,
    color: colors.white,
    opacity: 0.7,
  },

  // Withdraw button
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    marginHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.primary,
  },

  // Body
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 20 },
  historyHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: colors.description,
    marginBottom: 12,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontFamily: fonts.rubikMedium,
    fontSize: 13,
    color: colors.description,
  },
  tabChipTextActive: {
    color: colors.white,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEarning: {
    backgroundColor: '#E8F5E9',
  },
  avatarWithdrawal: {
    backgroundColor: '#FFF3E0',
  },
  cardTitle: { fontFamily: fonts.rubikMedium, fontSize: 15, color: colors.description },
  cardSubtitle: { fontFamily: fonts.rubikRegular, fontSize: 13, color: colors.description, opacity: 0.7, marginTop: 1 },
  cardMeta: { fontFamily: fonts.rubikRegular, fontSize: 11, color: colors.description, opacity: 0.5, marginTop: 3 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardAmount: { fontFamily: fonts.rubikBold, fontSize: 16 },
  amountCredit: { color: colors.success },
  amountDebit: { color: colors.description },
  badge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontFamily: fonts.rubikMedium, fontSize: 11 },

  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontFamily: fonts.rubikRegular,
    fontSize: 14,
    color: colors.description,
    opacity: 0.7,
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.description,
    marginTop: 12,
  },
  emptySubtitle: {
    fontFamily: fonts.rubikRegular,
    fontSize: 13,
    color: colors.description,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});