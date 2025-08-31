import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { SignOutButton } from '@/components/SignOutButton'
import { expensesService, type Expense } from '@/services/expenses'
import { categoriesService, type Category } from '@/services/categories'
import { usersService, type AppUser } from '@/services/users'
import { 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Alert
} from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Ionicons } from '@expo/vector-icons'
import { WelcomeCard } from '@/components/expenseComponents/WelcomeCard'
import { MonthSummary } from '@/components/expenseComponents/MonthSummary'
import { AddCategoryForm } from '@/components/expenseComponents/AddCategoryForm'
import { AddExpenseForm } from '@/components/expenseComponents/AddExpenseForm'
import { ExpenseList } from '@/components/expenseComponents/ExpenseList'
import { EditExpenseModal } from '@/components/expenseComponents/EditExpenseModal'

export default function Page() {
  const { user } = useUser()
  const { getToken, isSignedIn } = useAuth()
  const [expenses, setExpenses] = useState<Expense[] | null>(null)
  const [backendUser, setBackendUser] = useState<AppUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Loading states
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [expenseLoading, setExpenseLoading] = useState(false)

  // Edit expense modal state
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // Delete loading state
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')

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
      borderColor: '#e5e5e7' + '20',
    },
    primaryButton: {
      backgroundColor: '#6366f1',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      color: '#ef4444',
      textAlign: 'center',
      fontSize: 14,
      backgroundColor: '#fef2f2',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fecaca',
      marginBottom: 16,
    },
  })

  const hasLoadedRef = useRef(false)
  useEffect(() => {
    if (!user?.id || !isSignedIn || hasLoadedRef.current) return
    hasLoadedRef.current = true
    loadData()
  }, [user?.id, isSignedIn])

  const loadData = async () => {
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
  }

  const handleCreateCategory = async (name: string) => {
    try {
      setCategoryLoading(true)
      setError(null)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      await categoriesService.create({ name }, token || undefined)
      const fresh = await categoriesService.list(token || undefined)
      setCategories(fresh)
    } catch (e: any) {
      setError(e?.message || 'Failed to create category')
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleCreateExpense = async (amount: number, description: string, categoryId?: string) => {
    try {
      setExpenseLoading(true)
      setError(null)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      await expensesService.create(
        {
          amount,
          date: new Date().toISOString(),
          description: description || null,
          categoryId: categoryId || null,
        },
        token || undefined,
      )
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to create expense')
    } finally {
      setExpenseLoading(false)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setEditModalVisible(true)
  }

  const handleUpdateExpense = async (amount: number, description: string, categoryId?: string) => {
    if (!editingExpense) return
    try {
      setEditLoading(true)
      setError(null)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      await expensesService.update(
        editingExpense.id,
        {
          amount,
          description: description || null,
          categoryId: categoryId || null,
        },
        token || undefined,
      )
      setEditModalVisible(false)
      setEditingExpense(null)
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to update expense')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description || 'this expense'}"?\n\nAmount: ₹${expense.amount}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingExpenseId(expense.id)
              const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
              const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
              await expensesService.remove(expense.id, token || undefined)
              await loadData()
            } catch (e: any) {
              setError(e?.message || 'Failed to delete expense')
            } finally {
              setDeletingExpenseId(null)
            }
          },
        },
      ],
    )
  }

  const closeEditModal = () => {
    setEditModalVisible(false)
    setEditingExpense(null)
    setError(null)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SignedIn>
          {/* Welcome Card */}
          <WelcomeCard backendUser={backendUser} clerkUser={user} />

          {/* Error Display */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Month Summary */}
          {expenses && expenses.length > 0 && (
            <MonthSummary expenses={expenses} />
          )}

          {/* Create Category Card */}
          <AddCategoryForm
            onCreateCategory={handleCreateCategory}
            isLoading={categoryLoading}
          />

          {/* Create Expense Card */}
          <AddExpenseForm
            categories={categories}
            onCreateExpense={handleCreateExpense}
            isLoading={expenseLoading}
          />

          {/* Recent Expenses */}
          <ExpenseList
            expenses={expenses || []}
            categories={categories}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            deletingExpenseId={deletingExpenseId}
            isLoading={isLoading}
          />

          {/* Sign Out */}
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <SignOutButton />
          </View>
        </SignedIn>

        <SignedOut>
          <View style={styles.floatingCard}>
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Ionicons name="lock-closed" size={48} color={placeholderColor} style={{ marginBottom: 16 }} />
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '700', 
                color: textColor, 
                textAlign: 'center',
                marginBottom: 8
              }}>
                Welcome to Expensify
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: placeholderColor, 
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 22
              }}>
                Sign in to start tracking your expenses
              </Text>
              <View style={{ gap: 12, width: '100%' }}>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity style={styles.primaryButton}>
                    <Ionicons name="log-in" size={20} color="#ffffff" />
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/(auth)/sign-up" asChild>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#6366f1' }]}>
                    <Ionicons name="person-add" size={20} color="#6366f1" />
                    <Text style={[styles.primaryButtonText, { color: '#6366f1' }]}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </SignedOut>
      </ScrollView>

      {/* Edit Expense Modal */}
      <EditExpenseModal
        visible={editModalVisible}
        expense={editingExpense}
        categories={categories}
        onClose={closeEditModal}
        onUpdate={handleUpdateExpense}
        isLoading={editLoading}
      />
    </View>
  )
}