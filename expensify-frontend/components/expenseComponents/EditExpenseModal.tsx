import React, { useEffect, useState } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'
import type { Expense } from '@/services/expenses'
import type { Category } from '@/services/categories'

interface EditExpenseModalProps {
  visible: boolean
  expense: Expense | null
  categories: Category[]
  isLoading: boolean
  onClose: () => void
  onUpdate: (amount: number, description: string, categoryId?: string) => void | Promise<void>
}

export function EditExpenseModal({ visible, expense, categories, onClose, onUpdate, isLoading }: EditExpenseModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const placeholderColor = useThemeColor({}, 'icon')
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background')
  const borderColor = useThemeColor({ light: '#e5e5e7', dark: '#38383a' }, 'text')

  useEffect(() => {
    if (!expense) return
    setAmount(String(expense.amount))
    setDescription(expense.description ?? '')
    setSelectedCategoryId(expense.categoryId ?? undefined)
  }, [expense])

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#00000080',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: borderColor + '20',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: textColor,
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
    footer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: backgroundColor,
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: borderColor + '40',
    },
    saveButton: {
      flex: 1,
      backgroundColor: '#6366f1',
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    saveText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  })

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  const handleSave = () => {
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) return
    onUpdate(amt, description, selectedCategoryId)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Expense</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={placeholderColor} />
            </TouchableOpacity>
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
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={placeholderColor}
            style={styles.input}
            multiline
          />

          {categories.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: textColor, marginBottom: 8 }}>
                Category {selectedCategory && `• ${selectedCategory.name}`}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
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
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="save" size={20} color="#ffffff" />
              )}
              <Text style={styles.saveText}>{isLoading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}