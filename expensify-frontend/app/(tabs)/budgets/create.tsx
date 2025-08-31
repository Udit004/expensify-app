// Create this file: app/(tabs)/budgets/create.tsx

import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'
import { budgetService, budgetUtils, type CreateBudgetInput } from '../../../services/budget'
import { categoriesService, type Category } from '../../../services/categories'

export default function CreateBudgetScreen() {
  const { getToken } = useAuth()
  const router = useRouter()
  
  const [amount, setAmount] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const placeholderColor = useThemeColor({}, 'icon')

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    scrollContainer: {
      padding: 20,
      paddingBottom: 100,
    },
    card: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: placeholderColor,
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: textColor,
      backgroundColor: cardColor,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 12,
      backgroundColor: cardColor,
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    pickerText: {
      fontSize: 16,
      color: textColor,
    },
    pickerPlaceholder: {
      fontSize: 16,
      color: placeholderColor,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      backgroundColor: cardColor,
    },
    categoryChipSelected: {
      backgroundColor: '#6366f1',
      borderColor: '#6366f1',
    },
    categoryChipText: {
      fontSize: 14,
      color: textColor,
    },
    categoryChipTextSelected: {
      color: '#ffffff',
    },
    monthYearRow: {
      flexDirection: 'row',
      gap: 12,
    },
    monthYearInput: {
      flex: 1,
    },
    createButton: {
      backgroundColor: '#10b981',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginTop: 20,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#6b7280',
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      color: '#ef4444',
      fontSize: 14,
      backgroundColor: '#fef2f2',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true)
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      const categoryList = await categoriesService.list(token || undefined)
      setCategories(categoryList)
    } catch (e: any) {
      setError(e?.message || 'Failed to load categories')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleCreateBudget = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const budgetData: CreateBudgetInput = {
        amount: parseFloat(amount),
        month: selectedMonth,
        year: selectedYear,
        categoryId: selectedCategoryId,
      }

      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined)
      
      await budgetService.create(budgetData, token || undefined)
      
      Alert.alert(
        'Budget Created',
        `Successfully set budget of ₹${amount} for ${
          selectedCategoryId 
            ? categories.find(c => c.id === selectedCategoryId)?.name 
            : 'overall spending'
        }`,
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (e: any) {
      setError(e?.message || 'Failed to create budget')
    } finally {
      setLoading(false)
    }
  }

  const monthOptions = budgetUtils.getMonthOptions()
  const yearOptions = budgetUtils.getYearOptions()

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Set Budget</Text>
          <Text style={styles.subtitle}>
            Create a monthly budget to track your spending
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Budget Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget Amount (₹)</Text>
            <TextInput
              style={styles.textInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter budget amount"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Month and Year */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Month & Year</Text>
            <View style={styles.monthYearRow}>
              <View style={styles.monthYearInput}>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity style={styles.pickerButton}>
                    <Text style={styles.pickerText}>
                      {budgetUtils.getMonthName(selectedMonth)}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={placeholderColor} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.monthYearInput}>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity style={styles.pickerButton}>
                    <Text style={styles.pickerText}>{selectedYear}</Text>
                    <Ionicons name="chevron-down" size={20} color={placeholderColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category (Optional)</Text>
            <Text style={{ fontSize: 14, color: placeholderColor, marginBottom: 8 }}>
              Leave unselected for overall monthly budget
            </Text>
            
            {categoriesLoading ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <View style={styles.categoryGrid}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    !selectedCategoryId && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategoryId(null)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      !selectedCategoryId && styles.categoryChipTextSelected,
                    ]}
                  >
                    Overall Budget
                  </Text>
                </TouchableOpacity>
                
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategoryId === category.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategoryId === category.id && styles.categoryChipTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateBudget}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#ffffff" />
                <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                  Create Budget
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="close" size={20} color="#6b7280" />
            <Text style={[styles.buttonText, { color: '#6b7280' }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}