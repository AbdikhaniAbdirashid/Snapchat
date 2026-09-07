import { Link } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export default function RegisterScreen() {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister() {
    if (loading) return

    setError(null)

    if (!username.trim() || !password) {
      setError('Fyll i båda fälten')
      return
    }

    setLoading(true)

    try {
      await register(username.trim(), password)
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.logo}>👻</Text>
        <Text style={styles.brandName}>Snap</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Skapa konto</Text>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          onChangeText={setUsername}
          placeholder="Användarnamn"
          placeholderTextColor="#737373"
          returnKeyType="next"
          style={styles.input}
          value={username}
        />

        <TextInput
          autoCapitalize="none"
          editable={!loading}
          onChangeText={setPassword}
          onSubmitEditing={handleRegister}
          placeholder="Lösenord"
          placeholderTextColor="#737373"
          returnKeyType="done"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {error && (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handleRegister}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}>
          {loading ? (
            <ActivityIndicator color="#111111" />
          ) : (
            <Text style={styles.submitButtonText}>Registrera</Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable disabled={loading} style={styles.link}>
            <Text style={styles.linkText}>Har du redan ett konto? Logga in</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  brand: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffc00',
  },
  logo: {
    fontSize: 56,
  },
  brandName: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '800',
  },
  form: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#111111',
    backgroundColor: '#f7f7f7',
    fontSize: 16,
  },
  error: {
    color: '#c62828',
    fontSize: 14,
  },
  submitButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#fffc00',
  },
  submitButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  link: {
    alignItems: 'center',
    padding: 12,
  },
  linkText: {
    color: '#0a84ff',
    fontWeight: '600',
  },
})
