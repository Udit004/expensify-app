// Enhanced Budget Layout - app/(tabs)/budgets/_layout.tsx

import { Stack } from 'expo-router'
import { useColorScheme } from '@/hooks/useColorScheme'
import { Colors } from '@/constants/Colors'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function BudgetsStackLayout() {
  const colorScheme = useColorScheme()

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ 
              backgroundColor: '#6366f1', 
              borderRadius: 10, 
              padding: 8 
            }}>
              <Ionicons name="analytics" size={24} color="#ffffff" />
            </View>
            <View>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: 'bold', 
                color: Colors[colorScheme ?? 'light'].text 
              }}>
                Budget Manager
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: Colors[colorScheme ?? 'light'].tabIconDefault,
                marginTop: -2
              }}>
                Track & Analyze Spending
              </Text>
            </View>
          </View>
        ),
      }}
    >
      <Stack.Screen 
        name="reports" 
        options={{ 
          title: 'Budget Reports',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons 
                name="bar-chart" 
                size={24} 
                color={Colors[colorScheme ?? 'light'].text} 
              />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: Colors[colorScheme ?? 'light'].text 
              }}>
                Budget Reports
              </Text>
            </View>
          ),
        }} 
      />
    </Stack>
  )
}
