import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CustomImage as Image } from '../common/CustomImage';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/color';
import { fonts } from '../../constants/font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomDrawerContent(props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const menuItems = [
    { label: 'Home', icon: require('../../assets/icons/drawer-home.svg'), route: '/(main)/(tabs)/requests' },
    { label: 'Messages', icon: require('../../assets/icons/drawer-message.svg'), route: '/(main)/messages' },
    { label: 'Upcoming Jobs', icon: require('../../assets/icons/drawer-bookings.svg'), route: '/(main)/(tabs)/upcoming' },
    { label: 'Earnings History', icon: require('../../assets/icons/drawer-courses.svg'), route: '/(main)/earnings' },
    { label: 'Rating & Reviews', icon: require('../../assets/icons/drawer-review.svg'), route: '/(main)/ratings' },
    { label: 'Profile', icon: require('../../assets/icons/drawer-profile.svg'), route: '/(main)/profile' },
    { label: 'Log Out', icon: require('../../assets/icons/drawer-logout.svg'), route: '/(auth)/login' },
  ];

  const handleNavigation = (route) => {
    props.navigation.closeDrawer();
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        
        <View style={styles.profileContainer}>
          
          <Image 
            source={require('../../assets/icons/nanny-image.svg')} 
            style={styles.avatar}
          />

          <View style={styles.userInfo}>
            <Text style={styles.userName}>Jessica Miller</Text>
            <Text style={styles.userPhone}>+91 9876543210</Text>

            <View style={styles.ratingContainer}>
              <Image 
                source={require('../../assets/icons/review-star.svg')} 
                style={styles.starIcon} 
              />
              <Text style={styles.ratingText}>4.9 (120 Reviews)</Text>
            </View>
          </View>

        </View>

      </View>

      <View style={styles.menuSection}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route)}
            >
              <Image
                source={item.icon}
                style={styles.menuIcon}
                contentFit="contain"
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: colors.background,
  },
  profileContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.white,
  },
  userInfo: {
    marginTop: 10,
  },
  userName: {
    fontFamily: fonts.chocoShake,
    fontSize: 25,
    color: colors.primary,
  },
  userPhone: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    opacity: 0.8,
    marginVertical: 2,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  ratingText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.primary,
  },
  menuSection: {
    flex: 1,
    backgroundColor: colors.primary,
    borderTopRightRadius: 0,
    paddingTop: 30,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  menuIcon: {
    width: 22,
    height: 22,
    marginRight: 15,
  },
  menuLabel: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.white,
  },
});
