import { Redirect, Tabs } from 'expo-router'
import React from 'react'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from '../../hooks/useColorScheme'
import { Colors } from '../../constants/Colors'
import { View, Text } from 'react-native'
import NotificationBadge from '../../components/NotificationBadge'


function TabBarIcon({
  style,
  ...rest
}: {
  name: React.ComponentProps<typeof Ionicons>['name']
  color: string
  style?: any
}) {
  return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />
}

export default function TabLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const colorScheme = useColorScheme()

  if (isLoaded && !isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return (
    <Tabs
        screenOptions={{
        headerShown: true,
        headerTitleAlign: 'left',
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="wallet" size={28} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors[colorScheme ?? 'light'].text }}>
              Expensify
            </Text>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} />
          ),
          headerShown: false, // Hide header for stack navigation
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'analytics' : 'analytics-outline'} color={color} />
          ),
          headerShown: false, // Hide header for stack navigation
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <TabBarIcon name={focused ? 'notifications' : 'notifications-outline'} color={color} />
              <View style={{ position: 'absolute', top: -5, right: -5 }}>
                <NotificationBadge size="small" />
              </View>
            </View>
          ),
          headerShown: false, // Hide header for stack navigation
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
              />
      </Tabs>
  )
}