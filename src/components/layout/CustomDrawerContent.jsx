import { logoutNanny } from '../../services/authServices';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CustomImage as Image } from '../common/CustomImage';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectUser } from '../../redux/slices/authSlice';
import { selectProfile, fetchProfileSuccess } from '../../redux/slices/profileSlice';
import { getMyProfile } from '../../services/nannyService';

export default function CustomDrawerContent(props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        const p = res?.data?.profile || res?.profile;
        if (p) dispatch(fetchProfileSuccess(p));
      })
      .catch((err) => {
        console.log('[CustomDrawerContent] Error loading profile:', err?.message);
      });
  }, [dispatch]);

  const avatarUri =
    profile?.profilePic ||
    profile?.traineeApplicationId?.profilePic ||
    user?.profilePic;
  const nannyName =
    profile?.traineeApplicationId?.fullName || user?.fullName || 'Nanny';
  const userPhone = profile?.traineeApplicationId?.phoneNumber
    ? `+91 ${profile.traineeApplicationId.phoneNumber}`
    : user?.phoneNumber
    ? `+91 ${user.phoneNumber}`
    : user?.email || '';
  const averageRating = profile?.averageRating ?? 0;
  const totalReviews = profile?.totalReviews ?? 0;

  const menuItems = [
    { label: 'Home', icon: require('../../../assets/icons/drawer-home.svg'), route: '/(main)/(tabs)/requests' },
    { label: 'Meetings', icon: require('../../../assets/icons/drawer-meetings.svg'), route: '/(main)/meetings' },
    { label: 'Messages', icon: require('../../../assets/icons/drawer-message.svg'), route: '/(main)/messages' },
    { label: 'Upcoming Jobs', icon: require('../../../assets/icons/drawer-bookings.svg'), route: '/(main)/(tabs)/upcoming' },
    { label: 'Earnings History', icon: require('../../../assets/icons/drawer-courses.svg'), route: '/(main)/earnings' },
    { label: 'Rating & Reviews', icon: require('../../../assets/icons/drawer-review.svg'), route: '/(main)/ratings' },
    { label: 'Profile', icon: require('../../../assets/icons/drawer-profile.svg'), route: '/(main)/profile' },
    { label: 'Work Schedule', icon: require('../../../assets/icons/calendar.svg'), route: '/(main)/work-schedule' },
    { label: 'Log Out', icon: require('../../../assets/icons/drawer-logout.svg'), route: '/(auth)/login' },
  ];

  const handleNavigation = async (route) => {
    props.navigation.closeDrawer();
    if (route === '/(auth)/login') {
      await dispatch(logoutNanny());
      router.replace(route);
      return;
    }
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        
        <View style={styles.profileContainer}>
          
          <Image 
            source={avatarUri ? { uri: avatarUri } : require('../../../assets/icons/nanny-image.svg')} 
            style={styles.avatar}
            contentFit="cover"
          />

          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{nannyName}</Text>
            {!!userPhone && <Text style={styles.userPhone}>{userPhone}</Text>}

            <View style={styles.ratingContainer}>
              <Image 
                source={require('../../../assets/icons/review-star.svg')} 
                style={styles.starIcon} 
              />
              <Text style={styles.ratingText}>
                {averageRating.toFixed(1)} ({totalReviews} Reviews)
              </Text>
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
    borderRadius: 42.5,
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
