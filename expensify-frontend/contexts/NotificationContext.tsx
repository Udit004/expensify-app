// contexts/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { websocketService, NotificationData as WebSocketNotificationData } from '../services/websocketService';
import { notificationsService, NotificationData } from '../services/notifications';
import { useAuth } from '@clerk/clerk-expo';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  testNotification: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isSignedIn, userId, getToken } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load notifications from database on mount
  useEffect(() => {
    if (userId && isSignedIn) {
      loadNotificationsFromDatabase();
    }
  }, [userId, isSignedIn]);

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

  const loadNotificationsFromDatabase = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined;
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined);
      const data = await notificationsService.list(token || undefined);
      setNotifications(data);
      console.log('NotificationContext: Loaded notifications from database:', data.length);
    } catch (error) {
      console.error('Error loading notifications from database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    await loadNotificationsFromDatabase();
  };

  const handleNewNotification = async (notification: WebSocketNotificationData) => {
    console.log('NotificationContext: Received new notification:', notification);
    
    // Refresh notifications from database to get the latest data
    await loadNotificationsFromDatabase();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined;
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined);
      await notificationsService.markAsRead(notificationId, token || undefined);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined;
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined);
      await notificationsService.markAllAsRead(token || undefined);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const removeNotification = async (notificationId: string) => {
    try {
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined;
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined);
      await notificationsService.delete(notificationId, token || undefined);
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE as string | undefined;
      const token = await getToken(jwtTemplate ? { template: jwtTemplate } : undefined);
      await notificationsService.clearAll(token || undefined);
      
      // Update local state
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const testNotification = () => {
    // This is just for testing the UI - it won't be stored in database
    const testNotif: NotificationData = {
      id: `test_${Date.now()}`,
      type: 'general',
      title: 'Test Notification',
      message: 'This is a test notification to verify the UI is working.',
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [testNotif, ...prev]);
  };

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    testNotification,
    refreshNotifications,
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