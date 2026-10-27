import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../src/components/layout/CustomDrawerContent';
import { colors } from '../../constants/color';
import IncomingCallWatcher from '../../src/components/common/IncomingCallWatcher';
import ActiveCallTopBanner from '../../src/components/common/ActiveCallTopBanner';

export default function MainLayout() {
  const token = useSelector((state) => state.auth.token);
  if (!token) return <Redirect href="/(auth)/login" />;
  return (
    <>
      <IncomingCallWatcher />
      <ActiveCallTopBanner />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            width: '75%',
            backgroundColor: colors.background,
          },
        }}
      >
      <Drawer.Screen
        name="(tabs)"
        options={{ drawerLabel: 'Main' }}
      />
      <Drawer.Screen
        name="profile/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="support/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="support/detail"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="personal-info/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="earnings/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="terms/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="privacy/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="login-security"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="delete-account/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="ratings/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="messages"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="booking-details/index"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="work-schedule/index"
        options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Work Schedule' }}
      />
      <Drawer.Screen
        name="meetings/index"
        options={{ drawerItemStyle: { display: 'none' }, unmountOnBlur: true }}
      />
      <Drawer.Screen
        name="meeting/index"
        options={{ drawerItemStyle: { display: 'none' }, unmountOnBlur: true }}
      />
    <Drawer.Screen name="meeting/[meetingId]" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  </>
  );
}
