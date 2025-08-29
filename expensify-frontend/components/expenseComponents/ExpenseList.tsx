import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'
import type { Expense } from '@/services/expenses'
import type { Category } from '@/services/categories'

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expense: Expense) => void
  deletingExpenseId: string | null
  isLoading: boolean
}

export function ExpenseList({ 
  expenses, 
  categories, 
  onEditExpense, 
  onDeleteExpense, 
  deletingExpenseId,
  isLoading 
}: ExpenseListProps) {
  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const borderColor = useThemeColor({ light: '#e5e5e7', dark: '#38383a' }, 'text')
  const backgroundColor = useThemeColor({}, 'background')

  const styles = StyleSheet.create({
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textColor,
      marginBottom: 0,
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
    emptyState: {
      alignItems: 'center',
      padding: 40,
      opacity: 0.7,
    },
    loadingContainer: {
      alignItems: 'center',
      padding: 40,
    },
  })

  if (isLoading) {
    return (
      <View style={styles.floatingCard}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={{ color: placeholderColor, marginTop: 12, fontSize: 16 }}>
            Loading your expenses...
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.floatingCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="time" size={20} color="#f59e0b" />
        <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
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
                        onPress={() => onEditExpense(exp)}
                        disabled={isDeleting}
                      >
                        <Ionicons name="create" size={16} color="#6366f1" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => onDeleteExpense(exp)}
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
  )
}