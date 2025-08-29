import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'
import type { Expense } from '@/services/expenses'

interface MonthSummaryProps {
  expenses: Expense[]
}

export function MonthSummary({ expenses }: MonthSummaryProps) {
  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const borderColor = useThemeColor({ light: '#e5e5e7', dark: '#38383a' }, 'text')

  // Calculate current month statistics
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear
  })

  const totalAmount = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const averageDaily = currentMonthExpenses.length > 0 ? totalAmount / now.getDate() : 0
  const expenseCount = currentMonthExpenses.length

  // Get month name
  const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const styles = StyleSheet.create({
    summaryCard: {
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textColor,
      marginBottom: 0,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#10b981',
      marginTop: 4,
    },
    statLabel: {
      fontSize: 12,
      color: placeholderColor,
      marginTop: 4,
      textAlign: 'center',
    },
    divider: {
      width: 1,
      backgroundColor: borderColor + '40',
      marginHorizontal: 8,
    },
    monthTitle: {
      fontSize: 14,
      color: placeholderColor,
      textAlign: 'center',
      marginTop: 4,
    },
  })

  return (
    <View style={styles.summaryCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Ionicons name="calendar" size={20} color="#10b981" />
        <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
          Month Summary
        </Text>
      </View>
      <Text style={styles.monthTitle}>{monthName}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="wallet" size={24} color="#10b981" />
          <Text style={styles.statValue}>₹{totalAmount.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Ionicons name="receipt" size={24} color="#6366f1" />
          <Text style={[styles.statValue, { color: '#6366f1' }]}>{expenseCount}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={24} color="#f59e0b" />
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>₹{averageDaily.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Daily Average</Text>
        </View>
      </View>
    </View>
  )
}