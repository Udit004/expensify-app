import { useAuth, useUser } from '@clerk/clerk-expo'
import { useEffect, useState } from 'react'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { TextInput, Button, Alert, ScrollView } from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'
import { usersService } from '@/services/users'

export default function ProfileScreen() {
  const { user } = useUser()
  const { getToken, isSignedIn } = useAuth()
  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')

  const [name, setName] = useState(user?.fullName || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(user?.fullName || '')
  }, [user?.fullName])

  const handleSave = async () => {
    if (!isSignedIn) return
    try {
      setLoading(true)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      await usersService.updateMe({ name }, token || undefined)
      Alert.alert('Profile updated')
    } catch (e: any) {
      Alert.alert('Update failed', e?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <ThemedText type="title" style={{ textAlign: 'center' }}>Profile</ThemedText>
        <ThemedText>Email</ThemedText>
        <ThemedText>{user?.emailAddresses[0]?.emailAddress}</ThemedText>
        <ThemedText>Name</ThemedText>
        <TextInput
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={placeholderColor}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.2)',
            borderRadius: 8,
            color: textColor,
          }}
        />
        <Button title={loading ? 'Saving…' : 'Save'} disabled={loading} onPress={handleSave} />
      </ScrollView>
    </ThemedView>
  )
}


