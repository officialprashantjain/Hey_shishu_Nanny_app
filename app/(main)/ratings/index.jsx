import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import { getMyReviews } from "../../../src/services/nannyService";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate().toString().padStart(2, "0");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function RatingsScreen() {
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getMyReviews();
      const resData = response?.data?.data || response?.data || {};
      const reviewList = resData.reviews || [];
      setReviews(reviewList);
      setStats({
        averageRating: resData.averageRating || 0,
        totalReviews: resData.totalReviews ?? reviewList.length,
      });
    } catch (err) {
      console.log("Error fetching nanny reviews:", err);
      setError("Unable to load reviews. Please pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const ReviewItem = ({ item }) => {
    const parentName = item.parentId?.fullName || "Parent";
    const formattedDate = formatDate(item.createdAt);
    const ratingVal = item.rating || 5;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{parentName}</Text>
            {!!formattedDate && <Text style={styles.dateText}>{formattedDate}</Text>}
          </View>
          <Image
            source={require("../../../assets/icons/menu.svg")}
            style={styles.moreIcon}
            contentFit="contain"
            tintColor={colors.description}
          />
        </View>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Image
              key={i}
              source={require("../../../assets/icons/review-star.svg")}
              style={[styles.starIcon, i > ratingVal && { opacity: 0.25 }]}
            />
          ))}
          <Text style={styles.ratingText}>{Number(ratingVal).toFixed(1)}</Text>
        </View>

        {!!item.review ? (
          <Text style={styles.reviewText}>{item.review}</Text>
        ) : (
          <Text style={[styles.reviewText, styles.noCommentText]}>
            Rated without written comment.
          </Text>
        )}
      </View>
    );
  };

  const ListHeader = () => {
    if (loading || reviews.length === 0) return null;
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryScore}>
            {Number(stats.averageRating || 0).toFixed(1)}
          </Text>
          <View style={styles.summaryStarsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Image
                key={i}
                source={require("../../../assets/icons/review-star.svg")}
                style={[
                  styles.summaryStarIcon,
                  i > Math.round(stats.averageRating || 0) && { opacity: 0.3 },
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRight}>
          <Text style={styles.summaryCount}>{stats.totalReviews}</Text>
          <Text style={styles.summaryCountLabel}>Total Reviews</Text>
          <Text style={styles.summaryVerified}>Verified Parents</Text>
        </View>
      </View>
    );
  };

  const EmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Image
            source={require("../../../assets/icons/review-star.svg")}
            style={styles.emptyIcon}
            contentFit="contain"
          />
        </View>
        <Text style={styles.emptyTitle}>No Reviews Yet</Text>
        <Text style={styles.emptySubtitle}>
          When parents complete childcare sessions and leave reviews, they will appear here.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../../assets/icons/left-arrow.svg")}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rating & Reviews</Text>
      </View>

      {/* Loading Indicator */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          renderItem={({ item }) => <ReviewItem item={item} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchReviews(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backIcon: {
    width: 14,
    height: 14,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.primary,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  // Summary Banner
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(52, 105, 96, 0.12)",
  },
  summaryLeft: {
    alignItems: "center",
  },
  summaryScore: {
    fontFamily: fonts.rubikBold,
    fontSize: 32,
    fontWeight: "700",
    color: colors.primary,
    lineHeight: 36,
  },
  summaryStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  summaryStarIcon: {
    width: 13,
    height: 13,
  },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#E2E8F0",
  },
  summaryRight: {
    alignItems: "center",
  },
  summaryCount: {
    fontFamily: fonts.rubikBold,
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 28,
  },
  summaryCountLabel: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  summaryVerified: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: "600",
  },
  // Review Item Card
  reviewCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  userName: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.description,
  },
  dateText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.description,
    opacity: 0.55,
    marginTop: 2,
  },
  moreIcon: {
    width: 20,
    height: 20,
    opacity: 0.25,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  starIcon: {
    width: 15,
    height: 15,
    marginRight: 4,
  },
  ratingText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
  },
  reviewText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    lineHeight: 22,
    opacity: 0.85,
  },
  noCommentText: {
    fontStyle: "italic",
    opacity: 0.5,
  },
  // Loading & Empty States
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  loadingText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#64748B",
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 28,
  },
  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FDF2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIcon: {
    width: 32,
    height: 32,
    tintColor: "#E09C3D",
  },
  emptyTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
  },
});