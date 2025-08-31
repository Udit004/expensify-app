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

    console.log('NotificationContext: Setting up WebSocket connection for Clerk userId:', userId);
    
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
    console.log('NotificationContext: Received new notification via WebSocket:', notification);
    
    // Add the notification to local state immediately for real-time feel
    const newNotification: NotificationData = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead || false,
      data: notification.data,
      createdAt: typeof notification.createdAt === 'string' 
        ? notification.createdAt 
        : notification.createdAt.toISOString(),
      updatedAt: typeof notification.createdAt === 'string' 
        ? notification.createdAt 
        : notification.createdAt.toISOString(),
    };
    
    console.log('NotificationContext: Adding notification to state:', newNotification);
    setNotifications(prev => {
      // Check if notification already exists to avoid duplicates
      const exists = prev.find(n => n.id === newNotification.id);
      if (exists) {
        console.log('NotificationContext: Notification already exists, skipping');
        return prev;
      }
      
      const updated = [newNotification, ...prev];
      console.log('NotificationContext: Updated notifications count:', updated.length);
      return updated;
    });
    
    // Don't refresh from database immediately to avoid conflicts
    // The notification is already in local state
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
    
    console.log('NotificationContext: Adding test notification:', testNotif);
    setNotifications(prev => {
      const updated = [testNotif, ...prev];
      console.log('NotificationContext: Test notification added, total count:', updated.length);
      return updated;
    });
  };

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  // Debug logging for state changes
  useEffect(() => {
    console.log('NotificationContext: State updated - notifications:', notifications.length, 'unread:', unreadCount);
  }, [notifications, unreadCount]);

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