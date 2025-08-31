// Create this file: app/(tabs)/expenses/_layout.tsx

import { Stack } from 'expo-router'
import { useColorScheme } from '@/hooks/useColorScheme'
import { Colors } from '@/constants/Colors'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function ExpensesStackLayout() {
  const colorScheme = useColorScheme()

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        headerTitleAlign: 'left',
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="wallet" size={28} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors[colorScheme ?? 'light'].text }}>
              Expense Tracker
            </Text>
          </View>
        ),
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Expenses',
        }} 
      />
    </Stack>
  )
}