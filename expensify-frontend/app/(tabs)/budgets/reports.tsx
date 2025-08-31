// Budget Reports Screen - app/(tabs)/budgets/reports.tsx

import React, { useState, useEffect } from 'react'
import { 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit'
import { useThemeColor } from '@/hooks/useThemeColor'
import { budgetService, budgetUtils, type BudgetOverview, type Budget } from '@/services/budget'
import { enhancedExpensesService, type MonthlySummary } from '@/services/budget'

const { width } = Dimensions.get('window')
const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  strokeWidth: 3,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  propsForLabels: {
    fontSize: 12,
    fontWeight: '600',
  },
}

export default function BudgetReportsScreen() {
  const { getToken } = useAuth()
  const { user } = useUser()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '1year'>('6months')
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [trendData, setTrendData] = useState<any>(null)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const placeholderColor = useThemeColor({}, 'icon')

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    scrollContainer: {
      paddingBottom: 100,
    },
    card: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 8,
    },
    headerCard: {
      backgroundColor: '#6366f1',
      borderRadius: 20,
      padding: 24,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12,
      padding: 4,
      marginTop: 20,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    activePeriodButton: {
      backgroundColor: '#ffffff',
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    activePeriodButtonText: {
      color: '#6366f1',
    },
    inactivePeriodButtonText: {
      color: 'rgba(255,255,255,0.8)',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 16,
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: 16,
    },
    insightCard: {
      backgroundColor: '#f0f9ff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#0ea5e9',
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#0c4a6e',
      marginBottom: 4,
    },
    insightText: {
      fontSize: 14,
      color: '#075985',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statItem: {
      width: (width - 80) / 2,
      backgroundColor: '#f8fafc',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: placeholderColor,
      textAlign: 'center',
    },
    trendIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    trendText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    errorText: {
      color: '#ef4444',
      textAlign: 'center',
      fontSize: 14,
      backgroundColor: '#fef2f2',
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 16,
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#f3f4f6',
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
      lineHeight: 24,
    },
  })

  useEffect(() => {
    if (user?.id) {
      loadReportData()
    }
  }, [user?.id, selectedPeriod])

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      
      const currentDate = new Date()
      const months = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12
      
      // Get current month overview
      const overview = await budgetService.getBudgetOverview(
        currentDate.getMonth() + 1, 
        currentDate.getFullYear(), 
        token || undefined
      )
      
      // Get monthly summaries for the selected period
      const monthlyPromises = []
      for (let i = 0; i < months; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        monthlyPromises.push(
          enhancedExpensesService.getMonthlySummary(
            date.getMonth() + 1,
            date.getFullYear(),
            token || undefined
          )
        )
      }
      
      const monthlyResults = await Promise.all(monthlyPromises)
      
      setBudgetOverview(overview)
      setMonthlyData(monthlyResults.reverse()) // Reverse to get chronological order
      
      // Process category data for pie chart
      if (overview) {
        const pieData = overview.categoryBreakdown
          .filter(cat => cat.spentAmount > 0)
          .map((cat, index) => ({
            name: cat.categoryName || 'Other',
            population: cat.spentAmount,
            color: getColorByIndex(index),
            legendFontColor: textColor,
            legendFontSize: 12,
          }))
        setCategoryData(pieData)
      }
      
      // Calculate trend data
      if (monthlyResults.length > 1) {
        const trend = calculateTrend(monthlyResults)
        setTrendData(trend)
      }
      
    } catch (e: any) {
      setError(e?.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadReportData()
    setRefreshing(false)
  }

  const getColorByIndex = (index: number) => {
    const colors = [
      '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ]
    return colors[index % colors.length]
  }

  const calculateTrend = (data: MonthlySummary[]) => {
    if (data.length < 2) return null
    
    const current = data[data.length - 1]?.totalSpending || 0
    const previous = data[data.length - 2]?.totalSpending || 0
    const change = current - previous
    const percentageChange = previous > 0 ? (change / previous) * 100 : 0
    
    return {
      change,
      percentageChange,
      isIncreasing: change > 0,
      currentSpending: current,
      previousSpending: previous,
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1] || ''
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 16, color: textColor }}>Loading reports...</Text>
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
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Budget Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive insights into your spending patterns
          </Text>
          
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['3months', '6months', '1year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.activePeriodButton
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period 
                    ? styles.activePeriodButtonText 
                    : styles.inactivePeriodButtonText
                ]}>
                  {period === '3months' ? '3M' : period === '6months' ? '6M' : '1Y'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {budgetOverview && monthlyData.length > 0 ? (
          <>
            {/* Key Metrics */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatCurrency(budgetOverview.totalBudget)}
                  </Text>
                  <Text style={styles.statLabel}>Current Budget</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatCurrency(budgetOverview.totalSpent)}
                  </Text>
                  <Text style={styles.statLabel}>Total Spent</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { 
                    color: budgetOverview.remaining >= 0 ? '#10b981' : '#ef4444' 
                  }]}>
                    {formatCurrency(Math.abs(budgetOverview.remaining))}
                  </Text>
                  <Text style={styles.statLabel}>
                    {budgetOverview.remaining >= 0 ? 'Remaining' : 'Over Budget'}
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round(budgetOverview.percentageUsed)}%
                  </Text>
                  <Text style={styles.statLabel}>Budget Used</Text>
                  {trendData && (
                    <View style={styles.trendIndicator}>
                      <Ionicons 
                        name={trendData.isIncreasing ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color={trendData.isIncreasing ? '#ef4444' : '#10b981'} 
                      />
                      <Text style={[styles.trendText, { 
                        color: trendData.isIncreasing ? '#ef4444' : '#10b981' 
                      }]}>
                        {Math.abs(Math.round(trendData.percentageChange))}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Spending Trend */}
            {monthlyData.length > 1 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Spending Trend</Text>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={{
                      labels: monthlyData.map(d => getMonthName(d.month)),
                      datasets: [{
                        data: monthlyData.map(d => d.totalSpending),
                        strokeWidth: 3,
                      }]
                    }}
                    width={width - 80}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    }}
                    bezier
                    style={{
                      borderRadius: 16,
                    }}
                  />
                </View>
                
                {trendData && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>
                      {trendData.isIncreasing ? '📈 Spending Increased' : '📉 Spending Decreased'}
                    </Text>
                    <Text style={styles.insightText}>
                      Your spending {trendData.isIncreasing ? 'increased' : 'decreased'} by{' '}
                      {formatCurrency(Math.abs(trendData.change))} (
                      {Math.abs(Math.round(trendData.percentageChange))}%) compared to last month.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Category Breakdown */}
            {categoryData.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Category Breakdown</Text>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={categoryData}
                    width={width - 80}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
                
                <View style={styles.insightCard}>
                  <Text style={styles.insightTitle}>💡 Top Spending Category</Text>
                  <Text style={styles.insightText}>
                    {categoryData[0]?.name} accounts for{' '}
                    {formatCurrency(categoryData[0]?.population || 0)} of your spending this month.
                  </Text>
                </View>
              </View>
            )}

            {/* Monthly Comparison */}
            {monthlyData.length > 1 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Monthly Comparison</Text>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={{
                      labels: monthlyData.slice(-6).map(d => getMonthName(d.month)),
                      datasets: [{
                        data: monthlyData.slice(-6).map(d => d.totalSpending),
                      }]
                    }}
                    width={width - 80}
                    height={220}
                    yAxisLabel="₹"
                    yAxisSuffix=""
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    }}
                    style={{
                      borderRadius: 16,
                    }}
                    showValuesOnTopOfBars
                  />
                </View>
                
                <View style={styles.insightCard}>
                  <Text style={styles.insightTitle}>📊 Average Monthly Spending</Text>
                  <Text style={styles.insightText}>
                    Your average monthly spending is{' '}
                    {formatCurrency(
                      monthlyData.reduce((sum, d) => sum + d.totalSpending, 0) / monthlyData.length
                    )} over the last {monthlyData.length} months.
                  </Text>
                </View>
              </View>
            )}

            {/* Budget Performance */}
            {budgetOverview.categoryBreakdown.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Budget Performance</Text>
                {budgetOverview.categoryBreakdown.map((category, index) => (
                  <View key={category.categoryId} style={{ marginBottom: 16 }}>
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: 8 
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>
                        {category.categoryName || 'Other'}
                      </Text>
                      <Text style={{ 
                        fontSize: 14, 
                        color: category.isOverBudget ? '#ef4444' : '#10b981',
                        fontWeight: '600'
                      }}>
                        {Math.round(category.percentageUsed)}%
                      </Text>
                    </View>
                    <View style={{
                      height: 8,
                      backgroundColor: '#f3f4f6',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <View style={{
                        width: `${Math.min(category.percentageUsed, 100)}%`,
                        height: '100%',
                        backgroundColor: category.isOverBudget ? '#ef4444' : 
                                       category.percentageUsed > 80 ? '#f59e0b' : '#10b981',
                        borderRadius: 4,
                      }} />
                    </View>
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      marginTop: 4 
                    }}>
                      <Text style={{ fontSize: 12, color: placeholderColor }}>
                        Spent: {formatCurrency(category.spentAmount)}
                      </Text>
                      <Text style={{ fontSize: 12, color: placeholderColor }}>
                        Budget: {formatCurrency(category.budgetAmount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bar-chart-outline" size={40} color={placeholderColor} />
              </View>
              <Text style={styles.emptyTitle}>No Report Data</Text>
              <Text style={styles.emptySubtitle}>
                Set up budgets and record expenses to see detailed analytics and insights
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}