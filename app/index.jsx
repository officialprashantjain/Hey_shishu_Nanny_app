import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
export default function Index() {
  const token = useSelector((state) => state.auth.token);
  return <Redirect href={token ? '/(main)/(tabs)/requests' : '/(onboarding)/splash_screen'} />;
}
