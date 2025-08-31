// components/NotificationBadge.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationBadgeProps {
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  onPress, 
  size = 'medium',
  showCount = true 
}) => {
  const { unreadCount, isConnected } = useNotifications();

  // Debug logging
  console.log('NotificationBadge: unreadCount:', unreadCount, 'isConnected:', isConnected);

  if (unreadCount === 0) {
    return null; // Don't show badge if no unread notifications
  }

  const sizeStyles = {
    small: { width: 16, height: 16, fontSize: 10 },
    medium: { width: 20, height: 20, fontSize: 12 },
    large: { width: 24, height: 24, fontSize: 14 },
  };

  const badgeStyle = {
    ...sizeStyles[size],
    backgroundColor: isConnected ? '#FF3B30' : '#8E8E93',
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.badge, badgeStyle]}>
        {showCount && (
          <Text style={[styles.badgeText, { fontSize: sizeStyles[size].fontSize }]}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        )}
      </View>
    </Component>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationBadge;