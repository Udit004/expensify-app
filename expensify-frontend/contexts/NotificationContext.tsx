// contexts/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { websocketService, NotificationData } from '../services/websocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  testNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'finance_app_notifications';
const MAX_NOTIFICATIONS = 50; // Limit stored notifications

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isSignedIn, userId } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Load notifications from storage on mount
  useEffect(() => {
    if (userId) {
      loadNotificationsFromStorage();
    }
  }, [userId]);

  // Setup WebSocket connection and listeners
  useEffect(() => {
    if (!isSignedIn || !userId) {
      console.log('NotificationContext: Not signed in or no userId, skipping WebSocket connection');
      return;
    }

    console.log('NotificationContext: Setting up WebSocket connection for userId:', userId);
    
    // Connect to WebSocket
    websocketService.connect(userId);

    // Setup listeners
    const notificationCleanup = websocketService.addNotificationListener(handleNewNotification);
    const connectionCleanup = websocketService.addConnectionListener((connected) => {
      console.log('NotificationContext: WebSocket connection status:', connected);
      setIsConnected(connected);
    });

    return () => {
      console.log('NotificationContext: Cleaning up WebSocket listeners');
      notificationCleanup();
      connectionCleanup();
    };
  }, [isSignedIn, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const loadNotificationsFromStorage = async () => {
    if (!userId) return;
    
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  };

  const saveNotificationsToStorage = async (notificationsList: NotificationData[]) => {
    if (!userId) return;
    
    try {
      await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(notificationsList));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  };

  const handleNewNotification = (notification: NotificationData) => {
    console.log('NotificationContext: Received new notification:', notification);
    
    // Ensure timestamp is properly formatted
    const notificationWithTimestamp = {
      ...notification,
      timestamp: notification.createdAt ? new Date(notification.createdAt).getTime() : Date.now(),
    };
    
    setNotifications(prev => {
      const newNotifications = [notificationWithTimestamp, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveNotificationsToStorage(newNotifications);
      console.log('NotificationContext: Updated notifications count:', newNotifications.length);
      return newNotifications;
    });

    // You can add local push notification here if needed
    // For example, using expo-notifications
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      );
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, isRead: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== notificationId);
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    saveNotificationsToStorage([]);
  };

  const testNotification = () => {
    const testNotif: NotificationData = {
      id: `test_${Date.now()}`,
      type: 'general',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      userId: userId || '',
      createdAt: new Date(),
      isRead: false,
    };
    handleNewNotification(testNotif);
  };

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    testNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};