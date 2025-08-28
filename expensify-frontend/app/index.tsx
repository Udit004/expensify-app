import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/expenses" />;
  } else {
    return <Redirect href="/(auth)/sign-in" />;
  }
}
