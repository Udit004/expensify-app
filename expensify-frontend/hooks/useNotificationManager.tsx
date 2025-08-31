// hooks/useNotificationManager.tsx
import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import ToastNotification from '@/components/NotificationToast';
import { NotificationData } from '@/services/websocketService';

interface ToastNotification {
  id: string;
  notification: NotificationData;
}

export const useNotificationManager = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { markAsRead } = useNotifications();
  const toastTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((notification: NotificationData) => {
    const toastId = `toast_${notification.id}_${Date.now()}`;
    
    setToasts(prev => [...prev, { id: toastId, notification }]);

    // Auto remove toast after 4 seconds
    const timeout = setTimeout(() => {
      removeToast(toastId);
    }, 4000);
    
    toastTimeouts.current.set(toastId, timeout);
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
    
    // Clear timeout
    const timeout = toastTimeouts.current.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(toastId);
    }
  }, []);

  const handleToastPress = useCallback((toast: ToastNotification) => {
    // Mark notification as read
    markAsRead(toast.notification.id);
    
    // Remove toast
    removeToast(toast.id);
    
    // You can add navigation logic here based on notification type
    // For example, navigate to expense details, budget screen, etc.
  }, [markAsRead, removeToast]);

  const ToastContainer = useCallback(() => (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <View
          key={toast.id}
          style={[
            styles.toastWrapper,
            { top: 60 + (index * 80) } // Stack toasts vertically
          ]}
        >
          <ToastNotification
            notification={toast.notification}
            onDismiss={() => removeToast(toast.id)}
            onPress={() => handleToastPress(toast)}
            duration={4000}
          />
        </View>
      ))}
    </View>
  ), [toasts, removeToast, handleToastPress]);

  return {
    showToast,
    removeToast,
    ToastContainer,
    activeToasts: toasts.length,
  };
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

// Provider component that automatically shows toasts for new notifications
export const NotificationToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast, ToastContainer } = useNotificationManager();
  const { notifications } = useNotifications();
  const [lastNotificationId, setLastNotificationId] = useState<string>('');

  // Show toast for new notifications
  React.useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (latestNotification.id !== lastNotificationId && !latestNotification.isRead) {
        showToast(latestNotification);
        setLastNotificationId(latestNotification.id);
      }
    }
  }, [notifications, lastNotificationId, showToast]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      <ToastContainer />
    </View>
  );
};