import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Environment detection
export const isDevelopment = __DEV__;
export const isExpoGo = Constants.appOwnership === 'expo';
export const isWeb = Platform.OS === 'web';

// API URLs
export const PRODUCTION_API_URL = 'https://expensify-app-ddil.onrender.com';
export const LOCAL_API_URL = 'http://localhost:3000';
export const ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:3000';

// Environment configuration
export const getApiUrl = (): string => {
  // 1. Check for explicit environment variable (highest priority)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Development environment logic
  if (isDevelopment) {
    // Web platform
    if (isWeb && typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      const host = hostname || 'localhost';
      return `${protocol}//${host}:3000`;
    }

    // Native platforms
    if (!isWeb) {
      // Try to get LAN host from Expo
      const hostUri = (Constants as any)?.expoConfig?.hostUri
        || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri
        || (Constants as any)?.manifest?.debuggerHost;
      
      if (hostUri) {
        const host = hostUri.split(':')[0];
        if (host) {
          return `http://${host}:3000`;
        }
      }

      // Platform-specific fallbacks
      if (Platform.OS === 'android') {
        return ANDROID_EMULATOR_API_URL;
      }
      
      if (Platform.OS === 'ios') {
        return LOCAL_API_URL;
      }
    }
  }

  // 3. Production fallback
  return PRODUCTION_API_URL;
};

// Environment info for debugging
export const getEnvironmentInfo = () => ({
  isDevelopment,
  isExpoGo,
  isWeb,
  platform: Platform.OS,
  apiUrl: getApiUrl(),
  productionUrl: PRODUCTION_API_URL,
  localUrl: LOCAL_API_URL,
  androidEmulatorUrl: ANDROID_EMULATOR_API_URL,
  explicitApiUrl: process.env.EXPO_PUBLIC_API_URL || 'not set'
});
