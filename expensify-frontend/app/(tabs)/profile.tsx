import { useAuth, useUser } from '@clerk/clerk-expo'
import { useEffect, useState } from 'react'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { 
  TextInput, 
  Button, 
  Alert, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'
import { usersService } from '@/services/users'
import { Ionicons } from '@expo/vector-icons'

export default function ProfileScreen() {
  const { user } = useUser()
  const { getToken, isSignedIn } = useAuth()
  const [name, setName] = useState(user?.fullName || '')
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const borderColor = useThemeColor({ light: '#e5e5e7', dark: '#38383a' }, 'text')

  useEffect(() => {
    const initialName = user?.fullName || ''
    setName(initialName)
    setHasChanges(false)
  }, [user?.fullName])

  useEffect(() => {
    setHasChanges(name !== (user?.fullName || ''))
  }, [name, user?.fullName])

  const handleSave = async () => {
    if (!isSignedIn || !hasChanges) return
    try {
      setLoading(true)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      await usersService.updateMe({ name }, token || undefined)
      Alert.alert('Success', 'Profile updated successfully!')
      setHasChanges(false)
    } catch (e: any) {
      Alert.alert('Update failed', e?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName(user?.fullName || '')
    setHasChanges(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    scrollContainer: {
      padding: 20,
      paddingBottom: 100,
    },
    floatingCard: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: borderColor + '20',
    },
    profileCard: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      shadowColor: '#8b5cf6',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 12,
      borderWidth: 1,
      borderColor: '#8b5cf6' + '20',
      alignItems: 'center',
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#8b5cf6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '700',
      color: '#ffffff',
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: textColor,
      textAlign: 'center',
      marginBottom: 8,
    },
    userEmail: {
      fontSize: 16,
      color: placeholderColor,
      textAlign: 'center',
      fontWeight: '500',
    },
    input: {
      backgroundColor: backgroundColor,
      borderWidth: 2,
      borderColor: borderColor + '40',
      borderRadius: 16,
      padding: 16,
      fontSize: 16,
      color: textColor,
      marginBottom: 12,
    },
    inputFocused: {
      borderColor: '#8b5cf6',
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButton: {
      backgroundColor: '#8b5cf6',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#6b7280',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: '#6b7280',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textColor,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: backgroundColor,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor + '30',
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: placeholderColor,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 16,
      color: textColor,
      fontWeight: '500',
      marginTop: 4,
    },
    changeIndicator: {
      backgroundColor: '#f59e0b',
      borderRadius: 20,
      paddingVertical: 4,
      paddingHorizontal: 12,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    changeIndicatorText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    }
  })

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user?.fullName || user?.emailAddresses[0]?.emailAddress || 'U')}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.fullName || 'User'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.emailAddresses[0]?.emailAddress}
          </Text>
        </View>

        {/* Account Information */}
        <View style={styles.floatingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
              Account Information
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail" size={20} color="#6b7280" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>
                {user?.emailAddresses[0]?.emailAddress}
              </Text>
            </View>
            <View style={{
              backgroundColor: user?.emailAddresses[0]?.verification?.status === 'verified' ? '#10b981' : '#f59e0b',
              borderRadius: 12,
              paddingVertical: 2,
              paddingHorizontal: 8,
            }}>
              <Text style={{
                fontSize: 10,
                color: '#ffffff',
                fontWeight: '700',
                textTransform: 'uppercase',
              }}>
                {user?.emailAddresses[0]?.verification?.status || 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color="#6b7280" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Profile */}
        <View style={styles.floatingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="create" size={20} color="#8b5cf6" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
              Edit Profile
            </Text>
          </View>

          {hasChanges && (
            <View style={styles.changeIndicator}>
              <Text style={styles.changeIndicatorText}>Unsaved Changes</Text>
            </View>
          )}

          <Text style={styles.infoLabel}>Display Name</Text>
          <TextInput
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={placeholderColor}
            style={styles.input}
            editable={!loading}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { 
                  flex: 1,
                  opacity: !hasChanges || loading ? 0.6 : 1 
                }
              ]}
              onPress={handleSave}
              disabled={!hasChanges || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              )}
              <Text style={styles.primaryButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {hasChanges && (
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 0.4 }]}
                onPress={handleReset}
                disabled={loading}
              >
                <Ionicons name="refresh" size={20} color="#6b7280" />
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.floatingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="settings" size={20} color="#6b7280" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
              Account Settings
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={20} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Security</Text>
                <Text style={[styles.infoValue, { fontSize: 14, color: placeholderColor }]}>
                  Manage your password and 2FA
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={placeholderColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="notifications" size={20} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Notifications</Text>
                <Text style={[styles.infoValue, { fontSize: 14, color: placeholderColor }]}>
                  Email and push preferences
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={placeholderColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="download" size={20} color="#6366f1" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Export Data</Text>
                <Text style={[styles.infoValue, { fontSize: 14, color: placeholderColor }]}>
                  Download your expense data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={placeholderColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.floatingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
              About
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <View style={styles.infoItem}>
              <Ionicons name="code-slash" size={20} color="#8b5cf6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>App Version</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="help-circle" size={20} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Help & Support</Text>
                <Text style={[styles.infoValue, { fontSize: 14, color: placeholderColor }]}>
                  Get help with your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={placeholderColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem}>
              <Ionicons name="document-text" size={20} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Privacy Policy</Text>
                <Text style={[styles.infoValue, { fontSize: 14, color: placeholderColor }]}>
                  How we handle your data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={placeholderColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Card */}
        <View style={styles.floatingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="analytics" size={20} color="#10b981" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
              Your Activity
            </Text>
          </View>

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around',
            paddingVertical: 16,
          }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                backgroundColor: '#10b981' + '20',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}>
                <Ionicons name="calendar" size={24} color="#10b981" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>
                {new Date().getDate()}
              </Text>
              <Text style={{ fontSize: 12, color: placeholderColor, fontWeight: '500' }}>
                Days Active
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <View style={{
                backgroundColor: '#6366f1' + '20',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}>
                <Ionicons name="receipt" size={24} color="#6366f1" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>
                --
              </Text>
              <Text style={{ fontSize: 12, color: placeholderColor, fontWeight: '500' }}>
                Total Expenses
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <View style={{
                backgroundColor: '#f59e0b' + '20',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}>
                <Ionicons name="pricetag" size={24} color="#f59e0b" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>
                --
              </Text>
              <Text style={{ fontSize: 12, color: placeholderColor, fontWeight: '500' }}>
                Categories
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.floatingCard, { borderColor: '#ef4444' + '30' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8, color: '#ef4444' }]}>
              Danger Zone
            </Text>
          </View>

          <TouchableOpacity style={[styles.infoItem, { borderColor: '#ef4444' + '20' }]}>
            <Ionicons name="trash" size={20} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: '#ef4444' }]}>Delete Account</Text>
              <Text style={[styles.infoValue, { fontSize: 14, color: placeholderColor }]}>
                Permanently delete your account and data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}