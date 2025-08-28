import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { SignOutButton } from '../../components/SignOutButton'
import { expensesService, type Expense } from '../../services/expenses'
import { categoriesService, type Category } from '../../services/categories'
import { usersService, type AppUser } from '../../services/users'
//
import { TextInput, Button, ScrollView } from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'

export default function Page() {
  const { user } = useUser()
  const { getToken, isSignedIn } = useAuth()
  const [expenses, setExpenses] = useState<Expense[] | null>(null)
  const [backendUser, setBackendUser] = useState<AppUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Category form state
  const [newCategory, setNewCategory] = useState('')

  // Expense form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)

  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')

  const hasLoadedRef = useRef(false)
  useEffect(() => {
    // Run only once per sign-in session
    if (!user?.id || !isSignedIn || hasLoadedRef.current) return
    hasLoadedRef.current = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
        const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
        const [data, cats, me] = await Promise.all([
          expensesService.listMine(token || undefined),
          categoriesService.list(token || undefined),
          usersService.getMe(token || undefined),
        ])
        setExpenses(data)
        setCategories(cats)
        setBackendUser(me)
      } catch (e: any) {
        setError(e?.message || 'Failed to load expenses')
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isSignedIn])

  const handleCreateCategory = async () => {
    try {
      setError(null)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      if (!newCategory.trim()) return
      await categoriesService.create({ name: newCategory.trim() }, token || undefined)
      setNewCategory('')
      // Refresh categories
      const fresh = await categoriesService.list(token || undefined)
      setCategories(fresh)
    } catch (e: any) {
      setError(e?.message || 'Failed to create category')
    }
  }

  const handleCreateExpense = async () => {
    try {
      setError(null)
      const amt = parseFloat(amount)
      if (Number.isNaN(amt)) {
        setError('Enter a valid amount')
        return
      }
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      await expensesService.create(
        {
          amount: amt,
          date: new Date().toISOString(),
          description: description || null,
          categoryId: selectedCategoryId || null,
        },
        token || undefined,
      )
      setAmount('')
      setDescription('')
      setSelectedCategoryId(undefined)
      // Refresh expenses
      const fresh = await expensesService.listMine(token || undefined)
      setExpenses(fresh)
    } catch (e: any) {
      setError(e?.message || 'Failed to create expense')
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
      <SignedIn>
        <ThemedText type="title" style={{ marginBottom: 12, textAlign: 'center' }}>
          Hello {backendUser?.name || user?.emailAddresses[0].emailAddress}
        </ThemedText>
        {isLoading && (
          <ThemedText style={{ textAlign: 'center' }}>Loading expenses…</ThemedText>
        )}
        {error && (
          <ThemedText style={{ textAlign: 'center', color: 'red' }}>{error}</ThemedText>
        )}
        {expenses && expenses.length === 0 && !isLoading && !error && (
          <ThemedText style={{ textAlign: 'center' }}>No expenses yet.</ThemedText>
        )}
        {/* Create Category */}
        <ThemedView style={{ gap: 8, marginBottom: 16 }}>
          <ThemedText type="subtitle">Create category</ThemedText>
          <TextInput
            placeholder="Category name"
            value={newCategory}
            onChangeText={setNewCategory}
            placeholderTextColor={placeholderColor}
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              color: textColor,
            }}
          />
          <Button title="Add Category" onPress={handleCreateCategory} />
        </ThemedView>

        {/* Create Expense */}
        <ThemedView style={{ gap: 8, marginBottom: 16 }}>
          <ThemedText type="subtitle">Create expense</ThemedText>
          <TextInput
            placeholder="Amount"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={placeholderColor}
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              color: textColor,
            }}
          />
          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={placeholderColor}
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              color: textColor,
            }}
          />
          <ThemedText>Select category (optional)</ThemedText>
          <ThemedView style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((c) => (
              <ThemedText
                key={c.id}
                onPress={() => setSelectedCategoryId(c.id === selectedCategoryId ? undefined : c.id)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: c.id === selectedCategoryId ? '#2563eb' : 'rgba(0,0,0,0.2)',
                }}
              >
                {c.name}
              </ThemedText>
            ))}
          </ThemedView>
          <Button title="Add Expense" onPress={handleCreateExpense} />
        </ThemedView>

        {expenses && expenses.length > 0 && (
          <ThemedView style={{ gap: 8 }}>
            {expenses.map((exp) => (
              <ThemedView
                key={exp.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.1)'
                }}
              >
                <ThemedText type="defaultSemiBold">{exp.description || 'Expense'}</ThemedText>
                <ThemedText>${exp.amount} · {new Date(exp.date).toLocaleDateString()}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <ThemedText style={{ textAlign: 'center', marginBottom: 8 }}>You are signed out</ThemedText>
        <Link href="/(auth)/sign-in">
          <ThemedText type="link" style={{ textAlign: 'center' }}>Sign in</ThemedText>
        </Link>
        <Link href="/(auth)/sign-up">
          <ThemedText type="link" style={{ textAlign: 'center' }}>Sign up</ThemedText>
        </Link>
      </SignedOut>
      </ScrollView>
    </ThemedView>
  )
}