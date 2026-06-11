import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../../components/CustomTabBar';
import { Header } from '../../../components/Header';

export default function TabsLayout() {
  return (
    <Tabs 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <Header title="Nanny App" />,
      }}
    >
      <Tabs.Screen name="requests/index" options={{ title: 'Requests', headerShown: true }} />
      <Tabs.Screen name="upcoming/index" options={{ title: 'Accepted', headerShown: true }} />
      <Tabs.Screen name="ontheway/index" options={{ title: 'OnTheWay', headerShown: true }} />
      <Tabs.Screen name="service/index" options={{ title: 'Service', headerShown: true }} />
      <Tabs.Screen name="message/index" options={{ title: 'Message', headerShown: false }} />
    </Tabs>
  );
}
