// Enhanced Budget Index Screen - app/(tabs)/budgets/index.tsx

import React, { useState, useEffect, useRef } from 'react'
import { 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native'
import { useAuth, useUser, SignedIn, SignedOut } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useColorScheme } from '@/hooks/useColorScheme'
import { budgetService, budgetUtils, type BudgetOverview, type Budget } from '@/services/budget'
import { categoriesService, type Category } from '@/services/categories'


const { width } = Dimensions.get('window')

export default function BudgetScreen() {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const colorScheme = useColorScheme()
  
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const placeholderColor = useThemeColor({}, 'icon')
  const borderColor = useThemeColor({ light: 'rgba(0,0,0,0.05)', dark: 'rgba(255,255,255,0.1)' }, 'background')

  const hasLoadedRef = useRef(false)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    scrollContainer: {
      paddingBottom: 100,
    },
    headerSection: {
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    gradientCard: {
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      overflow: 'hidden',
    },
    card: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 16,
      shadowColor: colorScheme === 'dark' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 20,
      elevation: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    monthButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    createButton: {
      backgroundColor: '#10b981',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    reportButton: {
      backgroundColor: '#6366f1',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    overviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    overviewTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
    },
    overviewSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statCard: {
      width: (width - 88) / 2,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    progressBarContainer: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      height: 10,
      borderRadius: 5,
      marginVertical: 16,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 5,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: textColor,
    },
    categoryCount: {
      fontSize: 14,
      color: placeholderColor,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 4,
    },
    categoryProgress: {
      fontSize: 14,
      color: placeholderColor,
      marginBottom: 8,
    },
    categoryProgressBar: {
      height: 6,
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#f3f4f6',
      borderRadius: 3,
      overflow: 'hidden',
    },
    categoryProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    categoryAmounts: {
      alignItems: 'flex-end',
      marginLeft: 12,
    },
    categoryAmount: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    categoryPercentage: {
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: '#ef4444',
      borderRadius: 12,
      padding: 10,
      marginLeft: 12,
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    alertCard: {
      backgroundColor: colorScheme === 'dark' ? '#451a03' : '#fff7ed',
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#f59e0b',
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#fbbf24' : '#92400e',
      marginLeft: 8,
    },
    alertItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    alertText: {
      color: colorScheme === 'dark' ? '#fbbf24' : '#92400e',
      fontSize: 14,
      marginLeft: 8,
      flex: 1,
    },
    errorText: {
      color: '#ef4444',
      textAlign: 'center',
      fontSize: 14,
      backgroundColor: colorScheme === 'dark' ? '#450a0a' : '#fef2f2',
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? '#7f1d1d' : '#fecaca',
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#f3f4f6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: placeholderColor,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    quickStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    quickStat: {
      alignItems: 'center',
    },
    quickStatValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    quickStatLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 4,
    },
  })

  useEffect(() => {
    if (!user?.id || !isSignedIn || hasLoadedRef.current) return
    hasLoadedRef.current = true
    loadData()
  }, [user?.id, isSignedIn])

  useEffect(() => {
    if (user?.id && isSignedIn) {
      loadData()
    }
  }, [selectedMonth, selectedYear])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      
      const [overview, budgetList, categoryList] = await Promise.all([
        budgetService.getBudgetOverview(selectedMonth, selectedYear, token || undefined),
        budgetService.getBudgetsForMonth(selectedMonth, selectedYear, token || undefined),
        categoriesService.list(token || undefined),
      ])
      
      setBudgetOverview(overview)
      setBudgets(budgetList)
      setCategories(categoryList)
    } catch (e: any) {
      setError(e?.message || 'Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleDeleteBudget = async (budget: Budget) => {
    const categoryName = budget.category?.name || 'Overall Budget'
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the budget for "${categoryName}"?\n\nAmount: ₹${budget.amount.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingBudgetId(budget.id)
              const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
              const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
              await budgetService.remove(budget.id, token || undefined)
              await loadData()
            } catch (e: any) {
              setError(e?.message || 'Failed to delete budget')
            } finally {
              setDeletingBudgetId(null)
            }
          },
        },
      ],
    )
  }

  const getStatusColor = (percentageUsed: number, isOverBudget: boolean) => {
    if (isOverBudget) return '#ef4444'
    if (percentageUsed > 90) return '#f59e0b'
    if (percentageUsed > 75) return '#eab308'
    return '#10b981'
  }

  const getCategoryIcon = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || 'general'
    if (name.includes('food') || name.includes('restaurant')) return 'restaurant'
    if (name.includes('transport') || name.includes('fuel')) return 'car'
    if (name.includes('shopping') || name.includes('clothes')) return 'bag'
    if (name.includes('entertainment') || name.includes('movie')) return 'musical-notes'
    if (name.includes('health') || name.includes('medical')) return 'medical'
    if (name.includes('education') || name.includes('book')) return 'book'
    return 'wallet'
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const getGradientColors = (percentageUsed: number, isOverBudget: boolean) => {
    if (isOverBudget) return ['#ef4444', '#dc2626']
    if (percentageUsed > 90) return ['#f59e0b', '#d97706']
    if (percentageUsed > 75) return ['#eab308', '#ca8a04']
    return ['#10b981', '#059669']
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 16, color: textColor }}>Loading budget data...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SignedIn>
          {budgetOverview ? (
            <>
              {/* Header Section with Overview */}
              <View style={styles.headerSection}>
                <LinearGradient
                  colors={getGradientColors(budgetOverview.percentageUsed, budgetOverview.remaining < 0) as [string, string]}
                  style={styles.gradientCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Month Selector & Actions */}
                  <View style={styles.monthSelector}>
                    <TouchableOpacity style={styles.monthButton}>
                      <Ionicons name="calendar" size={20} color="#ffffff" />
                      <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
                        {budgetUtils.getMonthName(selectedMonth)} {selectedYear}
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.reportButton}
                        onPress={() => router.push('/(tabs)/budgets/reports')}
                      >
                        <Ionicons name="bar-chart" size={20} color="#ffffff" />
                        <Text style={{ color: '#ffffff', fontWeight: '600' }}>Reports</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.createButton}
                        onPress={() => router.push('/(tabs)/budgets/create')}
                      >
                        <Ionicons name="add" size={20} color="#ffffff" />
                        <Text style={{ color: '#ffffff', fontWeight: '600' }}>Budget</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Overview Header */}
                  <View style={styles.overviewHeader}>
                    <View>
                      <Text style={styles.overviewTitle}>Monthly Overview</Text>
                      <Text style={styles.overviewSubtitle}>
                        Track your spending against budget
                      </Text>
                    </View>
                  </View>
                  
                  {/* Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Budget</Text>
                      <Text style={styles.statValue}>{formatCurrency(budgetOverview.totalBudget)}</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Spent</Text>
                      <Text style={styles.statValue}>{formatCurrency(budgetOverview.totalSpent)}</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Remaining</Text>
                      <Text style={styles.statValue}>
                        {formatCurrency(Math.abs(budgetOverview.remaining))}
                      </Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Used</Text>
                      <Text style={styles.statValue}>{Math.round(budgetOverview.percentageUsed)}%</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={['#ffffff', 'rgba(255,255,255,0.8)']}
                      style={[
                        styles.progressBar,
                        { width: `${Math.min(budgetOverview.percentageUsed, 100)}%` }
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>

                  {/* Quick Stats */}
                  <View style={styles.quickStats}>
                    <View style={styles.quickStat}>
                      <Text style={styles.quickStatValue}>
                        {budgetOverview.categoryBreakdown.length}
                      </Text>
                      <Text style={styles.quickStatLabel}>Categories</Text>
                    </View>
                    <View style={styles.quickStat}>
                      <Text style={styles.quickStatValue}>
                        {budgetUtils.getRemainingDaysInMonth(selectedMonth, selectedYear)}
                      </Text>
                      <Text style={styles.quickStatLabel}>Days Left</Text>
                    </View>
                    <View style={styles.quickStat}>
                      <Text style={styles.quickStatValue}>
                        {formatCurrency(budgetUtils.getSuggestedDailyLimit(budgetOverview.remaining, selectedMonth, selectedYear))}
                      </Text>
                      <Text style={styles.quickStatLabel}>Daily Limit</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Budget Alerts */}
              {budgetOverview.categoryBreakdown.some(cat => cat.isOverBudget || cat.percentageUsed > 80) && (
                <View style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <Ionicons name="warning" size={24} color="#f59e0b" />
                    <Text style={styles.alertTitle}>Budget Alerts</Text>
                  </View>
                  {budgetOverview.categoryBreakdown
                    .filter(cat => cat.isOverBudget || cat.percentageUsed > 80)
                    .map(category => (
                      <View key={category.categoryId} style={styles.alertItem}>
                        <Ionicons name="alert-circle" size={16} color="#f59e0b" />
                        <Text style={styles.alertText}>
                          <Text style={{ fontWeight: '600' }}>{category.categoryName}:</Text> {
                            category.isOverBudget
                              ? `Over by ${formatCurrency(Math.abs(category.remaining))}`
                              : `${Math.round(category.percentageUsed)}% used`
                          }
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              {/* Category Budgets */}
              <View style={styles.card}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.sectionTitle}>Category Budgets</Text>
                  <Text style={styles.categoryCount}>{budgets.length} budgets</Text>
                </View>
                
                {budgets.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="analytics-outline" size={32} color={placeholderColor} />
                    </View>
                    <Text style={styles.emptyTitle}>No budgets set</Text>
                    <Text style={styles.emptySubtitle}>
                      Create your first budget to start tracking your spending by category
                    </Text>
                  </View>
                ) : (
                  budgets.map((budget) => {
                    const categoryData = budgetOverview.categoryBreakdown.find(
                      cat => cat.categoryId === budget.categoryId
                    )
                    const spent = categoryData?.spentAmount || 0
                    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
                    const isOverBudget = spent > budget.amount
                    const statusColor = getStatusColor(percentage, isOverBudget)

                    return (
                      <View key={budget.id} style={styles.categoryItem}>
                        <View style={[styles.categoryIcon, { backgroundColor: statusColor + '15' }]}>
                          <Ionicons 
                            name={getCategoryIcon(budget.category?.name) as any} 
                            size={24} 
                            color={statusColor} 
                          />
                        </View>
                        
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryName}>
                            {budget.category?.name || 'Overall Budget'}
                          </Text>
                          <Text style={styles.categoryProgress}>
                            {formatCurrency(spent)} of {formatCurrency(budget.amount)}
                          </Text>
                          <View style={styles.categoryProgressBar}>
                            <View 
                              style={[
                                styles.categoryProgressFill,
                                {
                                  width: `${Math.min(percentage, 100)}%`,
                                  backgroundColor: statusColor
                                }
                              ]} 
                            />
                          </View>
                        </View>
                        
                        <View style={styles.categoryAmounts}>
                          <Text style={[styles.categoryAmount, { 
                            color: budget.amount - spent >= 0 ? '#10b981' : '#ef4444' 
                          }]}>
                            {formatCurrency(Math.abs(budget.amount - spent))}
                          </Text>
                          <Text style={[styles.categoryPercentage, {
                            backgroundColor: statusColor + '20',
                            color: statusColor
                          }]}>
                            {Math.round(percentage)}%
                          </Text>
                        </View>

                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteBudget(budget)}
                          disabled={deletingBudgetId === budget.id}
                        >
                          {deletingBudgetId === budget.id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Ionicons name="trash" size={18} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )
                  })
                )}
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="analytics-outline" size={40} color={placeholderColor} />
                </View>
                <Text style={styles.emptyTitle}>No Budget Data</Text>
                <Text style={styles.emptySubtitle}>
                  Set up your first budget to start tracking your monthly spending and get insights
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push('/(tabs)/budgets/create')}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Create Budget</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SignedIn>

        <SignedOut>
          <View style={styles.card}>
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="lock-closed" size={40} color={placeholderColor} />
              </View>
              <Text style={styles.emptyTitle}>Welcome to Budget Manager</Text>
              <Text style={styles.emptySubtitle}>
                Sign in to start managing your budgets and tracking your spending
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity style={styles.createButton}>
                  <Ionicons name="log-in" size={20} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </SignedOut>
      </ScrollView>
    </View>
  )
}
