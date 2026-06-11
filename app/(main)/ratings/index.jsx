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

export default function RatingsScreen() {
  const router = useRouter();

  const reviews = [
    {
      id: "1",
      user: "Priya Singh",
      rating: 5.0,
      text: "Jessica is an amazing nanny! She is so patient with my toddler and always comes up with creative games. Highly recommended!",
      date: "12 June 2024",
    },
    {
      id: "2",
      user: "Rahul Verma",
      rating: 4.8,
      text: "Very professional and punctual. My kids loved her energy. Will definitely book again.",
      date: "05 June 2024",
    },
    {
      id: "3",
      user: "Sneha Kapur",
      rating: 5.0,
      text: "Excellent service. She handled a difficult situation with our infant very calmly.",
      date: "28 May 2024",
    },
  ];

  const ReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <TouchableOpacity>
          <Image
            source={require("../../../assets/icons/menu.svg")}
            style={styles.moreIcon}
            contentFit="contain"
            tintColor={colors.description}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Image
            key={i}
            source={require("../../../assets/icons/review-star.svg")}
            style={[styles.starIcon, i > item.rating && { opacity: 0.3 }]}
          />
        ))}
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>

      <Text style={styles.reviewText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Image
            source={require("../../../assets/icons/left-arrow.svg")}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rating & Reviews</Text>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewItem item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
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
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
    opacity: 0.6,
    marginTop: 2,
  },
  moreIcon: {
    width: 20,
    height: 20,
    opacity: 0.3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  starIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  ratingText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  reviewText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    lineHeight: 22,
    opacity: 0.8,
  },
});