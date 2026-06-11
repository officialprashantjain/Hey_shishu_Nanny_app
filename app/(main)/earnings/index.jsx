import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { CustomImage as Image } from "../../../components/CustomImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import { LinearGradient } from "expo-linear-gradient";

export default function EarningsScreen() {
  const router = useRouter();

  const earnings = [
    { id: "1", client: "Sneha Sharma", date: "10 June 2024", amount: "₹850", status: "Completed" },
    { id: "2", client: "Amit Patel", date: "08 June 2024", amount: "₹1,200", status: "Completed" },
    { id: "3", client: "Priya Das", date: "05 June 2024", amount: "₹950", status: "Completed" },
    { id: "4", client: "Vikram Singh", date: "02 June 2024", amount: "₹1,500", status: "Completed" },
  ];

  const EarningItem = ({ item }) => (
    <View style={styles.earningCard}>
      <View style={styles.cardInfo}>
        <Text style={styles.clientName}>{item.client}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.amountSection}>
        <Text style={styles.amountText}>{item.amount}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, "#8B5CF6"]} style={styles.summaryCard}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Image source={require("../../../assets/icons/backbutton-white.svg")} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Earnings</Text>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>₹12,450.00</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={earnings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EarningItem item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryCard: { paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10 },
  backButton: { padding: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12 },
  backIcon: { width: 16, height: 16 },
  headerTitle: { flex: 1, textAlign: "center", color: colors.white, fontSize: 20, fontFamily: fonts.rubikBold, marginRight: 40 },
  balanceContainer: { alignItems: "center", marginTop: 30 },
  balanceLabel: { color: colors.white, opacity: 0.8, fontSize: 16, fontFamily: fonts.rubik },
  balanceAmount: { color: colors.white, fontSize: 42, fontFamily: fonts.chocoShake, marginTop: 10 },
  content: { flex: 1, paddingHorizontal: 20, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontFamily: fonts.rubikBold, color: colors.primary, marginBottom: 20 },
  listContent: { paddingBottom: 20 },
  earningCard: { backgroundColor: colors.white, borderRadius: 24, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, elevation: 2 },
  clientName: { fontSize: 16, fontFamily: fonts.rubikBold, color: colors.description },
  dateText: { fontSize: 12, fontFamily: fonts.rubik, color: colors.description, opacity: 0.6, marginTop: 4 },
  amountSection: { alignItems: "flex-end" },
  amountText: { fontSize: 18, fontFamily: fonts.rubikBold, color: colors.primary },
  statusBadge: { backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  statusText: { color: "#10B981", fontSize: 10, fontFamily: fonts.rubikBold },
});