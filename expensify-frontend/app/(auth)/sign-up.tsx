import * as React from 'react'
import { TextInput, TouchableOpacity } from 'react-native'
import { useOAuth, useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const textColor = useThemeColor({}, 'text')
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
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

  if (pendingVerification) {
    return (
      <ThemedView
        style={{
          flex: 1,
          padding: 24,
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <ThemedText type="title" style={{ marginBottom: 4, textAlign: 'center' }}>Verify your email</ThemedText>
        <ThemedText type="subtitle" style={{ marginBottom: 16, textAlign: 'center' }}>Enter the code sent to your email</ThemedText>
        <TextInput
          value={code}
          placeholder="Enter your verification code"
          placeholderTextColor={textColor}
          onChangeText={(code) => setCode(code)}
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
          onPress={onVerifyPress}
          style={{
            borderColor: textColor,
            borderWidth: 1,
            borderRadius: 9999,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <ThemedText type="defaultSemiBold">Verify</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    )
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
      <ThemedText type="title" style={{ marginBottom: 4, textAlign: 'center' }}>Create your account</ThemedText>
      <ThemedText type="subtitle" style={{ marginBottom: 16, textAlign: 'center' }}>Join Expensify in seconds</ThemedText>
      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        placeholderTextColor={textColor}
        onChangeText={(email) => setEmailAddress(email)}
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
        onPress={onSignUpPress}
        style={{
          marginBottom: 10,
          borderColor: textColor,
          borderWidth: 1,
          borderRadius: 9999,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <ThemedText type="defaultSemiBold">Create account</ThemedText>
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
        Already have an account?{' '}
        <Link href="/(auth)/sign-in">
          <ThemedText type="link">Sign in</ThemedText>
        </Link>
      </ThemedText>
    </ThemedView>
  )
}