import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import walletService from '../../../src/services/walletService';

const QUICK_AMOUNTS = [500, 1000, 2000];

export default function WithdrawScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [availableBalance, setAvailableBalance] = useState(
    params.available ? parseFloat(params.available) : 0
  );
  const [upiId, setUpiId] = useState(params.savedUpi ? String(params.savedUpi) : '');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const isDisabled =
    !upiId.trim() ||
    !upiId.includes('@') ||
    amountNum < 100 ||
    amountNum > availableBalance ||
    isSubmitting;

  // Refresh latest balance on focus and reset success/amount state
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      setShowSuccess(false);
      setAmount('');
      setErrorMessage('');
      setIsSubmitting(false);

      walletService.getWalletOverview()
        .then((res) => {
          if (isMounted && res?.data?.wallet) {
            setAvailableBalance(res.data.wallet.available || 0);
            if (res.data.wallet.savedUpiId) {
              setUpiId(res.data.wallet.savedUpiId);
            }
          }
        })
        .catch((err) => console.log('[WITHDRAW BALANCE REFRESH]', err));

      return () => {
        isMounted = false;
        setShowSuccess(false);
        setAmount('');
        setErrorMessage('');
      };
    }, [])
  );

  const handleBackToWallet = () => {
    setShowSuccess(false);
    setAmount('');
    setErrorMessage('');
    router.replace('/(main)/earnings');
  };

  const handleConfirm = async () => {
    if (isDisabled) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await walletService.requestWithdrawal({
        amount: amountNum,
        upiId: upiId.trim(),
        payoutMethod: 'upi',
      });
      setShowSuccess(true);
    } catch (err) {
      console.error('[WITHDRAW ERROR]', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit withdrawal request. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Withdrawal Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-circle" size={56} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Withdrawal Requested!</Text>
        <Text style={styles.successSub}>
          ₹{amountNum.toLocaleString()} will be transferred to your UPI ID ({upiId}) within 2 hours.
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={handleBackToWallet}>
          <Text style={styles.doneBtnText}>Back to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.white }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackToWallet}>
            <Ionicons name="chevron-back" size={22} color={colors.description} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLbl}>Available to Withdraw</Text>
          <Text style={styles.balanceVal}>₹{availableBalance.toLocaleString()}</Text>
        </View>

        {/* UPI input */}
        <Text style={styles.fieldLabel}>UPI ID / VPA</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="card-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. yourname@upi or 9876543210@paytm"
            placeholderTextColor={colors.description + '55'}
            value={upiId}
            onChangeText={(txt) => {
              setUpiId(txt);
              setErrorMessage('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount input */}
        <Text style={styles.fieldLabel}>Amount (₹)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="cash-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Enter amount (min ₹100)"
            placeholderTextColor={colors.description + '55'}
            value={amount}
            onChangeText={(txt) => {
              setAmount(txt);
              setErrorMessage('');
            }}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Quick amount chips */}
        <View style={styles.chipsRow}>
          {QUICK_AMOUNTS.map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.chip, amount === String(q) && styles.chipActive]}
              onPress={() => setAmount(String(q))}
            >
              <Text style={[styles.chipText, amount === String(q) && styles.chipTextActive]}>
                ₹{q.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
          {availableBalance > 0 && (
            <TouchableOpacity
              style={[styles.chip, amount === String(availableBalance) && styles.chipActive]}
              onPress={() => setAmount(String(availableBalance))}
            >
              <Text style={[styles.chipText, amount === String(availableBalance) && styles.chipTextActive]}>
                Full
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Validation hints */}
        {amountNum > availableBalance && (
          <View style={styles.errorRow}>
            <Ionicons name="warning-outline" size={14} color={colors.danger} />
            <Text style={styles.errorText}>Amount exceeds available balance</Text>
          </View>
        )}

        {amountNum > 0 && amountNum < 100 && (
          <View style={styles.errorRow}>
            <Ionicons name="warning-outline" size={14} color={colors.warning} />
            <Text style={[styles.errorText, { color: colors.warning }]}>Minimum withdrawal is ₹100</Text>
          </View>
        )}

        {errorMessage ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Processing time notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.noticeText}>Usually within 2 hours on working days</Text>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, isDisabled && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Withdrawal</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.rubikBold, fontSize: 18, color: colors.description },

  body: { flex: 1 },
  bodyContent: { padding: 20 },

  // Balance Card
  balanceCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20, padding: 22, alignItems: 'center',
    marginBottom: 24,
  },
  balanceLbl: {
    fontFamily: fonts.rubikRegular, fontSize: 13,
    color: colors.primary, opacity: 0.8, marginBottom: 6,
  },
  balanceVal: {
    fontFamily: fonts.rubikBold, fontSize: 38,
    color: colors.primary, letterSpacing: -0.5,
  },

  // Field
  fieldLabel: {
    fontFamily: fonts.rubikMedium, fontSize: 14,
    color: colors.description, marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.lightGray,
    marginBottom: 18,
  },
  input: {
    flex: 1, fontFamily: fonts.rubikRegular, fontSize: 15,
    color: colors.description,
  },

  // Chips
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  chip: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1,
    borderColor: colors.lightGray, alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.rubikMedium, fontSize: 13, color: colors.description,
  },
  chipTextActive: { color: colors.white },

  // Error
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14, marginTop: -6,
  },
  errorText: {
    fontFamily: fonts.rubikRegular, fontSize: 12, color: colors.danger,
  },

  // Notice
  noticeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E8F5E9', borderRadius: 12,
    padding: 14, marginBottom: 28,
  },
  noticeText: {
    fontFamily: fonts.rubikRegular, fontSize: 13,
    color: colors.primary, flex: 1,
  },

  // Button
  confirmBtn: {
    backgroundColor: colors.primary, borderRadius: 30,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: {
    fontFamily: fonts.rubikBold, fontSize: 16, color: colors.white,
  },

  // Success
  successIconBox: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#E8F5E9', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  successTitle: {
    fontFamily: fonts.rubikBold, fontSize: 24,
    color: colors.description, marginBottom: 10, textAlign: 'center',
  },
  successSub: {
    fontFamily: fonts.rubikRegular, fontSize: 15,
    color: colors.description, opacity: 0.7,
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  doneBtn: {
    backgroundColor: colors.primary, borderRadius: 30,
    paddingVertical: 15, paddingHorizontal: 40,
  },
  doneBtnText: {
    fontFamily: fonts.rubikBold, fontSize: 16, color: colors.white,
  },
});
