import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'

interface AddCategoryFormProps {
  onCreateCategory: (name: string) => Promise<void>
  isLoading: boolean
}

export function AddCategoryForm({ onCreateCategory, isLoading }: AddCategoryFormProps) {
  const [newCategory, setNewCategory] = useState('')
  
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
  })

  const handleCreate = async () => {
    if (!newCategory.trim()) return
    await onCreateCategory(newCategory.trim())
    setNewCategory('')
  }

  return (
    <View style={styles.floatingCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="pricetag" size={20} color="#6366f1" />
        <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
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
        style={[styles.primaryButton, { opacity: !newCategory.trim() || isLoading ? 0.6 : 1 }]}
        onPress={handleCreate}
        disabled={!newCategory.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Ionicons name="add-circle" size={20} color="#ffffff" />
        )}
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Creating...' : 'Create Category'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}