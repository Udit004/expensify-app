import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'
import type { AppUser } from '@/services/users'
import type { UserResource } from '@clerk/types'

interface WelcomeCardProps {
  backendUser: AppUser | null
  clerkUser: UserResource | null
}

export function WelcomeCard({ backendUser, clerkUser }: WelcomeCardProps) {
  const placeholderColor = useThemeColor({}, 'icon')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const borderColor = useThemeColor({ light: '#e5e5e7', dark: '#38383a' }, 'text')

  const styles = StyleSheet.create({
    welcomeCard: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      shadowColor: '#6366f1',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 12,
      borderWidth: 1,
      borderColor: '#6366f1' + '20',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 0,
      color: '#6366f1',
    },
  })

  return (
    <View style={styles.welcomeCard}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12, 
        marginBottom: 8 
      }}>
        <Ionicons name="sparkles" size={24} color="#6366f1" />
        <Text style={styles.sectionTitle}>Welcome back!</Text>
      </View>
      <Text style={{ 
        fontSize: 16, 
        color: placeholderColor, 
        textAlign: 'center',
        fontWeight: '500'
      }}>
        {backendUser?.name || clerkUser?.emailAddresses[0].emailAddress}
      </Text>
    </View>
  )
}