import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

// ── Dummy data (will come from backend) ──────────────────────────────────────
const WALLET = {
  available: 7420,
  pending:   2350,
  thisMonth: 9770,
  sessions:  6,
};

const EARNINGS = [
  {
    id: 'TXN-A1',
    parentName: 'Sneha Sharma',
    childName:  'Aarav Mehta',
    date:       '10 Jun 2025',
    hoursWorked: 4,
    hourlyRate:  220,
    gross:       880,
    platformFee: 88,
    net:         792,
    status:      'paid',
    refId:       'HS-PAY-001',
  },
  {
    id: 'TXN-A2',
    parentName: 'Rakesh Verma',
    childName:  'Kiara Verma',
    date:       '08 Jun 2025',
    hoursWorked: 6,
    hourlyRate:  220,
    gross:       1320,
    platformFee: 132,
    net:         1188,
    status:      'paid',
    refId:       'HS-PAY-002',
  },
  {
    id: 'TXN-A3',
    parentName: 'Priya Das',
    childName:  'Arjun Das',
    date:       '05 Jun 2025',
    hoursWorked: 4,
    hourlyRate:  200,
    gross:       800,
    platformFee: 80,
    net:         720,
    status:      'pending',
    refId:       'HS-PAY-003',
  },
  {
    id: 'TXN-A4',
    parentName: 'Vikram Singh',
    childName:  'Ishaan Singh',
    date:       '02 Jun 2025',
    hoursWorked: 8,
    hourlyRate:  220,
    gross:       1760,
    platformFee: 176,
    net:         1584,
    status:      'paid',
    refId:       'HS-PAY-004',
  },
  {
    id: 'TXN-A5',
    parentName: 'Meena Joshi',
    childName:  'Veda Joshi',
    date:       '28 May 2025',
    hoursWorked: 4,
    hourlyRate:  200,
    gross:       800,
    platformFee: 80,
    net:         720,
    status:      'processing',
    refId:       'HS-PAY-005',
  },
  {
    id: 'TXN-A6',
    parentName: 'Amit Patel',
    childName:  'Mia Patel',
    date:       '24 May 2025',
    hoursWorked: 5,
    hourlyRate:  220,
    gross:       1100,
    platformFee: 110,
    net:         990,
    status:      'paid',
    refId:       'HS-PAY-006',
  },
];

const STATUS_CONFIG = {
  paid:       { label: 'Paid',       bg: '#E8F5E9', text: colors.success },
  pending:    { label: 'Pending',    bg: '#FFF3CD', text: colors.warning },
  processing: { label: 'Processing', bg: '#EDE7F6', text: colors.secondary },
};

export default function WalletHomeScreen() {
  const router = useRouter();

  const EarningCard = ({ item }) => {
    const s = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        style={styles.earningCard}
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
          <View style={styles.cardAvatar}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cardParent}>{item.parentName}</Text>
            <Text style={styles.cardChild}>{item.childName}</Text>
            <Text style={styles.cardMeta}>{item.date} · {item.hoursWorked}h</Text>
          </View>
        </View>
        {/* Right */}
        <View style={styles.cardRight}>
          <Text style={styles.cardNet}>₹{item.net.toLocaleString()}</Text>
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
            <Text style={styles.balanceAmount}>₹{WALLET.available.toLocaleString()}</Text>
            <View style={styles.pendingChip}>
              <Ionicons name="time-outline" size={13} color={colors.warning} />
              <Text style={styles.pendingChipText}>
                ₹{WALLET.pending.toLocaleString()} pending
              </Text>
            </View>
          </View>

          {/* Summary Row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.white} style={{ opacity: 0.8 }} />
              <Text style={styles.summaryVal}>₹{WALLET.thisMonth.toLocaleString()}</Text>
              <Text style={styles.summaryLbl}>This Month</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="briefcase-outline" size={16} color={colors.white} style={{ opacity: 0.8 }} />
              <Text style={styles.summaryVal}>{WALLET.sessions}</Text>
              <Text style={styles.summaryLbl}>Sessions</Text>
            </View>
          </View>

          {/* Withdraw Button */}
          <TouchableOpacity
            style={styles.withdrawBtn}
            onPress={() => router.push('/(main)/earnings/withdraw')}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      {/* ── EARNING HISTORY ─────────────────────────────────────────────── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Earnings History</Text>
        {EARNINGS.map(item => <EarningCard key={item.id} item={item} />)}
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
    fontSize: 20, color: colors.white,
  },

  // Balance
  balanceBlock: { alignItems: 'center', marginBottom: 20 },
  balanceLabel: {
    fontFamily: fonts.rubik,
    fontSize: 14, color: colors.white, opacity: 0.8,
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: fonts.rubikBold,
    fontSize: 44, color: colors.white,
    letterSpacing: 1,
  },
  pendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 30,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  pendingChipText: {
    fontFamily: fonts.rubik,
    fontSize: 12, color: colors.white,
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  summaryVal: {
    fontFamily: fonts.rubikBold, fontSize: 18, color: colors.white, marginTop: 4,
  },
  summaryLbl: {
    fontFamily: fonts.rubik, fontSize: 12, color: colors.white, opacity: 0.75,
  },

  // Withdraw Button
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    backgroundColor: colors.white,
    borderRadius: 30,
    paddingVertical: 14,
  },
  withdrawBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16, color: colors.primary,
  },

  // Body
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 28 },
  sectionTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18, color: colors.description,
    marginBottom: 16,
  },

  // Earning Card
  earningCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.primary + '18',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  cardParent: {
    fontFamily: fonts.rubikBold, fontSize: 14, color: colors.description,
  },
  cardChild: {
    fontFamily: fonts.rubik, fontSize: 12, color: colors.primary,
    marginTop: 1,
  },
  cardMeta: {
    fontFamily: fonts.rubik, fontSize: 11,
    color: colors.description, opacity: 0.55, marginTop: 2,
  },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  cardNet: {
    fontFamily: fonts.rubikBold, fontSize: 17, color: colors.primary,
  },
  badge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5,
  },
  badgeText: {
    fontFamily: fonts.rubikBold, fontSize: 10,
  },
});