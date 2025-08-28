import { useOAuth, useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { TextInput, TouchableOpacity } from 'react-native'
import React from 'react'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import * as Linking from 'expo-linking'

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const textColor = useThemeColor({}, 'text')
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const onGooglePress = async () => {
    try {
      const redirectUrl = Linking.createURL('/')
      const { createdSessionId, setActive: setActiveOAuth, authSessionResult } = await startOAuthFlow({
        redirectUrl,
      })

      if (createdSessionId) {
        await setActiveOAuth?.({ session: createdSessionId })
        router.replace('/')
      } else if (authSessionResult?.type === 'success') {
        router.replace('/')
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <ThemedView
      style={{
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <ThemedText type="title" style={{ marginBottom: 4, textAlign: 'center' }}>Sign in</ThemedText>
      <ThemedText type="subtitle" style={{ marginBottom: 16, textAlign: 'center' }}>Welcome back to Expensify</ThemedText>
      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        placeholderTextColor={textColor}
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        style={{
          color: textColor,
          borderColor: textColor,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: 8,
        }}
      />
      <TextInput
        value={password}
        placeholder="Enter password"
        placeholderTextColor={textColor}
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
        style={{
          color: textColor,
          borderColor: textColor,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: 12,
        }}
      />
      <TouchableOpacity
        onPress={onSignInPress}
        style={{
          marginBottom: 10,
          borderColor: textColor,
          borderWidth: 1,
          borderRadius: 9999,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <ThemedText type="defaultSemiBold">Sign in</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onGooglePress}
        style={{
          marginBottom: 16,
          borderColor: textColor,
          borderWidth: 1,
          borderRadius: 9999,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <ThemedText type="defaultSemiBold">Continue with Google</ThemedText>
      </TouchableOpacity>
      <ThemedText style={{ textAlign: 'center' }}>
        Do not have an account?{' '}
        <Link href="/(auth)/sign-up">
          <ThemedText type="link">Sign up</ThemedText>
        </Link>
      </ThemedText>
    </ThemedView>
  )
}