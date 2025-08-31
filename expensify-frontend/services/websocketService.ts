// services/websocketService.ts
import io, { Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api';

export interface NotificationData {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'expense_created' | 'expense_updated' | 'general';
  title: string;
  message: string;
  userId: string;
  data?: any;
  createdAt: Date;
  isRead: boolean;
}

export type NotificationListener = (notification: NotificationData) => void;
export type ConnectionListener = (connected: boolean) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private notificationListeners: Set<NotificationListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) {
      return; // Already connected for this user
    }

    this.disconnect(); // Disconnect any existing connection
    this.userId = userId;

    try {
      const baseUrl = getApiBaseUrl();
      console.log('Connecting to WebSocket:', baseUrl);

      this.socket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.notifyConnectionListeners(false);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Join user room
      if (this.userId) {
        this.socket?.emit('join', { userId: this.userId });
      }
      
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.notifyConnectionListeners(false);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't auto-reconnect
        return;
      }
      
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.notifyConnectionListeners(false);
      this.attemptReconnect();
    });

    this.socket.on('joined', (data) => {
      console.log('Successfully joined user room:', data);
    });

    this.socket.on('notification', (notification: NotificationData) => {
      console.log('WebSocket: Received notification:', notification);
      this.notifyNotificationListeners(notification);
    });

    this.socket.on('broadcast_notification', (notification: Omit<NotificationData, 'userId'>) => {
      console.log('Received broadcast notification:', notification);
      const fullNotification: NotificationData = {
        ...notification,
        userId: this.userId || '',
      };
      this.notifyNotificationListeners(fullNotification);
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  disconnect() {
    if (this.socket) {
      if (this.userId) {
        this.socket.emit('leave', { userId: this.userId });
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
    this.reconnectAttempts = 0;
    this.notifyConnectionListeners(false);
  }

  // Add notification listener
  addNotificationListener(listener: NotificationListener) {
    this.notificationListeners.add(listener);
    
    // Return cleanup function
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  // Add connection listener
  addConnectionListener(listener: ConnectionListener) {
    this.connectionListeners.add(listener);
    
    // Return cleanup function
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private notifyNotificationListeners(notification: NotificationData) {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Send a custom message (optional)
  sendMessage(message: string) {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', message);
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();