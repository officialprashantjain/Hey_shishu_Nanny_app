import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../constants/color";
import { fonts } from "../../constants/font";

const { width } = Dimensions.get("window");

export default function ChatList({ showBackButton = false, backRoute }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const chatData = [
    {
      id: "robert_fox",
      name: "John Parent",
      subject: "Babysitting",
      message: "Hello, I need help with babysitting this weekend.",
      time: "3h ago",
      isOnline: false,
      avatarBg: "#D7DFE9",
    },
    {
      id: "jane_cooper",
      name: "Jane Cooper",
      subject: "Nanny Services",
      message: "Hello, can we discuss the schedule?",
      time: "19h ago",
      isOnline: true,
      avatarBg: "#D7DFE9",
    },
  ];

  const filteredChats = chatData.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.message.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleChatPress = (chat) => {
    router.push({
      pathname: "/(main)/messages/chat",
      params: { name: chat.name, subject: chat.subject },
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.header}>
          {showBackButton && (
            <TouchableOpacity
              onPress={() => backRoute ? router.push(backRoute) : router.back()}
              style={styles.backButton}
            >
              <Image
                source={require("../../assets/icons/left-arrow.svg")}
                style={styles.backIcon}
                tintColor={colors.description}
                contentFit="contain"
              />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.searchContainer}>
          <Image
            source={require("../../assets/icons/search.svg")}
            style={styles.searchIcon}
            tintColor="#71717A"
            contentFit="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.listContainer}>
          {filteredChats.map((chat, index) => (
            <View key={chat.id}>
              <TouchableOpacity
                style={styles.chatRow}
                onPress={() => handleChatPress(chat)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatar]}>
                    <Image
                      source={require("../../assets/icons/nanny-image.svg")}
                      style={styles.avatarIcon}
                      contentFit="cover"
                    />
                  </View>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: chat.isOnline ? "#22C55E" : "#E2E8F0",
                      },
                    ]}
                  />
                </View>

                <View style={styles.chatDetails}>
                  <View style={styles.rowBetween}>
                    <View style={styles.nameTagRow}>
                      <Text style={styles.chatName}>{chat.name}</Text>
                      <View style={styles.subjectBadge}>
                        <Text style={styles.subjectTagText}>
                          {chat.subject}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.rowBetween}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {chat.message}
                    </Text>
                    <Text style={styles.timeText}>{chat.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              {index < filteredChats.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
          {filteredChats.length === 0 && (
            <Text style={styles.noResults}>No conversations found</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6E6",
  },
  headerSafeArea: {
    backgroundColor: "#FFF6E6",
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  backIcon: {
    width: 14,
    height: 14,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    fontWeight: "bold",
    color: colors.description,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  searchContainer: {
    backgroundColor: colors.white,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 24,
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: "#0F172A",
  },
  listContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: "relative",
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarIcon: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.white,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  chatDetails: {
    flex: 1,
    gap: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatName: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  subjectBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  subjectTagText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
  },
  lastMessage: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
    maxWidth: width * 0.45,
  },
  timeText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
  },
  separator: {
    height: 1,
    backgroundColor: colors.description,
  },
  noResults: {
    textAlign: "center",
    fontFamily: fonts.rubik,
    color: "#64748B",
    paddingVertical: 20,
  },
});
