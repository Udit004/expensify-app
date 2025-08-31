import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../contexts/NotificationContext';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';

interface NotificationItemProps {
  notification: any;
  onPress: () => void;
  onDelete: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, onDelete }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        { 
          backgroundColor: colors.background,
          borderBottomColor: colors.text + '20'
        },
        !notification.isRead && { backgroundColor: colors.tint + '10' }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {notification.title}
          </Text>
          {!notification.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
          )}
        </View>
        <Text style={[styles.notificationMessage, { color: colors.text + 'CC' }]}>
          {notification.message}
        </Text>
        <Text style={[styles.notificationTime, { color: colors.text + '80' }]}>
          {new Date(notification.createdAt).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color={colors.text + '80'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, removeNotification, clearAllNotifications, testNotification, refreshNotifications } = useNotifications();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Debug logging
  console.log('NotificationsScreen: Current notifications count:', notifications.length);
  console.log('NotificationsScreen: Current unread count:', unreadCount);

  const handleNotificationPress = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // You can add navigation to specific screens based on notification type
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeNotification(notificationId) }
      ]
    );
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllNotifications }
      ]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.text + '20' }]}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications ({notifications.length})
        </Text>
        {unreadCount > 0 && (
          <Text style={[styles.unreadCount, { color: colors.tint }]}>
            {unreadCount} unread
          </Text>
        )}
      </View>
      <View style={styles.headerActions}>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.actionButton}>
            <Ionicons name="checkmark-done" size={20} color={colors.tint} />
            <Text style={[styles.actionText, { color: colors.tint }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.actionButton}>
            <Ionicons name="trash" size={20} color={colors.text + '80'} />
            <Text style={[styles.actionText, { color: colors.text + '80' }]}>Clear all</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={refreshNotifications} style={styles.actionButton}>
          <Ionicons name="refresh" size={20} color={colors.tint} />
          <Text style={[styles.actionText, { color: colors.tint }]}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={testNotification} style={styles.actionButton}>
          <Ionicons name="add-circle" size={20} color={colors.tint} />
          <Text style={[styles.actionText, { color: colors.tint }]}>Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={64} color={colors.text + '40'} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {isLoading ? 'Loading notifications...' : 'No notifications'}
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.text + '80' }]}>
        {isLoading ? 'Please wait while we fetch your notifications.' : 'You&apos;re all caught up! New notifications will appear here.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item)}
              onDelete={() => handleDeleteNotification(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 30,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  unreadCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
