import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'
import type { Category } from '@/services/categories'

interface AddExpenseFormProps {
  categories: Category[]
  onCreateExpense: (amount: number, description: string, categoryId?: string) => Promise<void>
  isLoading: boolean
}

export function AddExpenseForm({ categories, onCreateExpense, isLoading }: AddExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const borderColor = useThemeColor({ light: '#e5e5e7', dark: '#38383a' }, 'text')

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
      backgroundColor: '#10b981',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#10b981',
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
  })

  const handleCreate = async () => {
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) return
    
    await onCreateExpense(amt, description, selectedCategoryId)
    setAmount('')
    setDescription('')
    setSelectedCategoryId(undefined)
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  return (
    <View style={styles.floatingCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="card" size={20} color="#10b981" />
        <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
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
        style={[styles.primaryButton, { opacity: !amount.trim() || isLoading ? 0.6 : 1 }]}
        onPress={handleCreate}
        disabled={!amount.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Ionicons name="add-circle" size={20} color="#ffffff" />
        )}
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Adding...' : 'Add Expense'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}