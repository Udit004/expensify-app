import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { SignOutButton } from '../../components/SignOutButton'
import { expensesService, type Expense } from '../../services/expenses'
import { categoriesService, type Category } from '../../services/categories'
import { usersService, type AppUser } from '../../services/users'
import { 
  TextInput, 
  Button, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Ionicons } from '@expo/vector-icons'

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
  const [categoryLoading, setCategoryLoading] = useState(false)

  // Expense form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)
  const [expenseLoading, setExpenseLoading] = useState(false)

  // Edit expense modal state
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<string | undefined>(undefined)
  const [editLoading, setEditLoading] = useState(false)

  // Delete loading state
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const borderColor = useThemeColor({ light: '#e5e5e7', dark: '#38383a' }, 'text')

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
    categoryChip: {
      backgroundColor: backgroundColor,
      borderWidth: 2,
      borderColor: borderColor + '40',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      margin: 4,
    },
    categoryChipSelected: {
      backgroundColor: '#6366f1',
      borderColor: '#6366f1',
    },
    categoryChipText: {
      color: textColor,
      fontSize: 14,
      fontWeight: '500',
    },
    categoryChipTextSelected: {
      color: '#ffffff',
    },
    expenseItem: {
      backgroundColor: cardColor,
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: borderColor + '20',
    },
    expenseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    expenseLeft: {
      flex: 1,
      paddingRight: 12,
    },
    expenseRight: {
      alignItems: 'flex-end',
    },
    expenseActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    expenseAmount: {
      fontSize: 20,
      fontWeight: '700',
      color: '#10b981',
      marginBottom: 8,
    },
    expenseDescription: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
    },
    expenseDate: {
      fontSize: 14,
      color: placeholderColor,
      marginTop: 4,
    },
    actionButton: {
      backgroundColor: backgroundColor,
      borderRadius: 12,
      padding: 8,
      borderWidth: 1,
      minWidth: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButton: {
      borderColor: '#6366f1' + '40',
    },
    deleteButton: {
      borderColor: '#ef4444' + '40',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textColor,
      marginBottom: 16,
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
      opacity: 0.7,
    },
    loadingContainer: {
      alignItems: 'center',
      padding: 40,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 20,
      },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: textColor,
    },
    modalButtonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
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
      flex: 1,
    },
    secondaryButtonText: {
      color: '#6b7280',
      fontSize: 16,
      fontWeight: '600',
    },
    updateButton: {
      backgroundColor: '#10b981',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      flex: 1,
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
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

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return
    try {
      setCategoryLoading(true)
      setError(null)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      await categoriesService.create({ name: newCategory.trim() }, token || undefined)
      setNewCategory('')
      const fresh = await categoriesService.list(token || undefined)
      setCategories(fresh)
    } catch (e: any) {
      setError(e?.message || 'Failed to create category')
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleCreateExpense = async () => {
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount')
      return
    }
    try {
      setExpenseLoading(true)
      setError(null)
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
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to create expense')
    } finally {
      setExpenseLoading(false)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setEditAmount(expense.amount.toString())
    setEditDescription(expense.description || '')
    setEditCategoryId(expense.categoryId || undefined)
    setEditModalVisible(true)
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return
    const amt = parseFloat(editAmount)
    if (Number.isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount')
      return
    }
    try {
      setEditLoading(true)
      setError(null)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      await expensesService.update(
        editingExpense.id,
        {
          amount: amt,
          description: editDescription || null,
          categoryId: editCategoryId || null,
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

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const editSelectedCategory = categories.find(c => c.id === editCategoryId)

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
          <View style={styles.welcomeCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
              <Ionicons name="sparkles" size={24} color="#6366f1" />
              <Text style={[styles.sectionTitle, { marginBottom: 0, color: '#6366f1' }]}>
                Welcome back!
              </Text>
            </View>
            <Text style={{ 
              fontSize: 16, 
              color: placeholderColor, 
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {backendUser?.name || user?.emailAddresses[0].emailAddress}
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={{ color: placeholderColor, marginTop: 12, fontSize: 16 }}>
                Loading your expenses...
              </Text>
            </View>
          )}

          {/* Create Category Card */}
          <View style={styles.floatingCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="pricetag" size={20} color="#6366f1" />
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
                Add Category
              </Text>
            </View>
            
            <TextInput
              placeholder="Enter category name"
              value={newCategory}
              onChangeText={setNewCategory}
              placeholderTextColor={placeholderColor}
              style={styles.input}
            />
            
            <TouchableOpacity
              style={[styles.primaryButton, { opacity: !newCategory.trim() || categoryLoading ? 0.6 : 1 }]}
              onPress={handleCreateCategory}
              disabled={!newCategory.trim() || categoryLoading}
            >
              {categoryLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="add-circle" size={20} color="#ffffff" />
              )}
              <Text style={styles.primaryButtonText}>
                {categoryLoading ? 'Creating...' : 'Create Category'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Create Expense Card */}
          <View style={styles.floatingCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="card" size={20} color="#10b981" />
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
                Add Expense
              </Text>
            </View>

            <TextInput
              placeholder="₹0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={placeholderColor}
              style={styles.input}
            />

            <TextInput
              placeholder="What did you spend on? (optional)"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={placeholderColor}
              style={styles.input}
              multiline
            />

            {categories.length > 0 && (
              <>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: textColor, 
                  marginBottom: 12,
                  marginLeft: 4
                }}>
                  Category {selectedCategory && `• ${selectedCategory.name}`}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                  {categories.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedCategoryId(c.id === selectedCategoryId ? undefined : c.id)}
                      style={[
                        styles.categoryChip,
                        c.id === selectedCategoryId && styles.categoryChipSelected
                      ]}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        c.id === selectedCategoryId && styles.categoryChipTextSelected
                      ]}>
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton, 
                { 
                  backgroundColor: '#10b981',
                  shadowColor: '#10b981',
                  opacity: !amount.trim() || expenseLoading ? 0.6 : 1 
                }
              ]}
              onPress={handleCreateExpense}
              disabled={!amount.trim() || expenseLoading}
            >
              {expenseLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="add-circle" size={20} color="#ffffff" />
              )}
              <Text style={styles.primaryButtonText}>
                {expenseLoading ? 'Adding...' : 'Add Expense'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Expenses */}
          {!isLoading && (
            <View style={styles.floatingCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
                  Recent Expenses
                </Text>
              </View>

              {expenses && expenses.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="receipt-outline" 
                    size={48} 
                    color={placeholderColor} 
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: '600', 
                    color: placeholderColor,
                    marginBottom: 8
                  }}>
                    No expenses yet
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: placeholderColor,
                    textAlign: 'center',
                    lineHeight: 20
                  }}>
                    Start tracking your spending by adding your first expense above
                  </Text>
                </View>
              ) : expenses && expenses.length > 0 ? (
                <View>
                  {expenses.slice(0, 10).map((exp) => {
                    const category = categories.find(c => c.id === exp.categoryId)
                    const isDeleting = deletingExpenseId === exp.id
                    
                    return (
                      <View key={exp.id} style={[styles.expenseItem, { opacity: isDeleting ? 0.6 : 1 }]}>
                        <View style={styles.expenseHeader}>
                          <View style={styles.expenseLeft}>
                            <Text style={styles.expenseDescription}>
                              {exp.description || 'Expense'}
                            </Text>
                            {category && (
                              <View style={{
                                backgroundColor: '#6366f1' + '20',
                                borderRadius: 12,
                                paddingVertical: 2,
                                paddingHorizontal: 8,
                                alignSelf: 'flex-start',
                                marginTop: 4,
                              }}>
                                <Text style={{
                                  fontSize: 12,
                                  color: '#6366f1',
                                  fontWeight: '600'
                                }}>
                                  {category.name}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.expenseDate}>
                              {new Date(exp.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Text>
                          </View>
                          
                          <View style={styles.expenseRight}>
                            <Text style={styles.expenseAmount}>₹{exp.amount}</Text>
                            <View style={styles.expenseActions}>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.editButton]}
                                onPress={() => handleEditExpense(exp)}
                                disabled={isDeleting}
                              >
                                <Ionicons name="create" size={16} color="#6366f1" />
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteExpense(exp)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <ActivityIndicator size="small" color="#ef4444" />
                                ) : (
                                  <Ionicons name="trash" size={16} color="#ef4444" />
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                  {expenses.length > 10 && (
                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                      <Text style={{ color: placeholderColor, fontSize: 14 }}>
                        Showing latest 10 expenses
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          )}

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
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Expense</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="₹0.00"
              keyboardType="decimal-pad"
              value={editAmount}
              onChangeText={setEditAmount}
              placeholderTextColor={placeholderColor}
              style={styles.input}
            />

            <TextInput
              placeholder="What did you spend on? (optional)"
              value={editDescription}
              onChangeText={setEditDescription}
              placeholderTextColor={placeholderColor}
              style={styles.input}
              multiline
            />

            {categories.length > 0 && (
              <>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: textColor, 
                  marginBottom: 12,
                  marginLeft: 4
                }}>
                  Category {editSelectedCategory && `• ${editSelectedCategory.name}`}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                  {categories.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setEditCategoryId(c.id === editCategoryId ? undefined : c.id)}
                      style={[
                        styles.categoryChip,
                        c.id === editCategoryId && styles.categoryChipSelected
                      ]}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        c.id === editCategoryId && styles.categoryChipTextSelected
                      ]}>
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={closeEditModal}
                disabled={editLoading}
              >
                <Ionicons name="close-circle" size={20} color="#6b7280" />
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.updateButton,
                  { opacity: !editAmount.trim() || editLoading ? 0.6 : 1 }
                ]}
                onPress={handleUpdateExpense}
                disabled={!editAmount.trim() || editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                )}
                <Text style={styles.primaryButtonText}>
                  {editLoading ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}