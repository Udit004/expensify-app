# Environment Configuration

This directory contains environment configuration for the Expensify app.

## How it works

The app automatically detects the environment and uses the appropriate backend URL:

### Development Mode (`__DEV__ = true`)
- **Web**: Uses `http://localhost:3000` (or the current hostname)
- **iOS Simulator**: Uses `http://localhost:3000`
- **Android Emulator**: Uses `http://10.0.2.2:3000`
- **Physical Device**: Uses the LAN IP address from Expo

### Production Mode (`__DEV__ = false`)
- Uses the production URL: `https://expensify-app-ddil.onrender.com`

### Override with Environment Variable
You can override the automatic detection by setting the `EXPO_PUBLIC_API_URL` environment variable:

```bash
# For local development
export EXPO_PUBLIC_API_URL=http://localhost:3000

# For production
export EXPO_PUBLIC_API_URL=https://expensify-app-ddil.onrender.com

# For custom backend
export EXPO_PUBLIC_API_URL=https://your-custom-backend.com
```

## Usage

```typescript
import { getApiUrl, getEnvironmentInfo } from '../config/environment';

// Get the current API URL
const apiUrl = getApiUrl();

// Get detailed environment information
const envInfo = getEnvironmentInfo();
console.log(envInfo);
```

## Environment Information

The `getEnvironmentInfo()` function returns:

```typescript
{
  isDevelopment: boolean,        // true in development mode
  isExpoGo: boolean,            // true if running in Expo Go
  isWeb: boolean,               // true if running on web
  platform: string,             // 'ios', 'android', or 'web'
  apiUrl: string,               // current API URL being used
  productionUrl: string,        // production backend URL
  localUrl: string,             // local development URL
  androidEmulatorUrl: string,   // Android emulator URL
  explicitApiUrl: string        // value of EXPO_PUBLIC_API_URL or 'not set'
}
```

## Debugging

The app logs environment information to the console on startup. You can also call `getEnvironmentInfo()` anywhere in your code to see the current configuration.

## Fallback Behavior

If the primary API URL fails, the app will automatically try to fall back to `http://localhost:3000` for development scenarios.
