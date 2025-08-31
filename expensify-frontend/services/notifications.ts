import { api } from './api';

export interface NotificationData {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'expense_created' | 'expense_updated' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCounts {
  unreadCount: number;
  totalCount: number;
}

export const notificationsService = {
  // Get all notifications for the current user
  list: async (token?: string): Promise<NotificationData[]> => {
    return api.get<NotificationData[]>('/notifications', token ? { Authorization: `Bearer ${token}` } : undefined);
  },

  // Get unread notifications for the current user
  listUnread: async (token?: string): Promise<NotificationData[]> => {
    return api.get<NotificationData[]>('/notifications/unread', token ? { Authorization: `Bearer ${token}` } : undefined);
  },

  // Get notification counts
  getCounts: async (token?: string): Promise<NotificationCounts> => {
    return api.get<NotificationCounts>('/notifications/count', token ? { Authorization: `Bearer ${token}` } : undefined);
  },

  // Mark a notification as read
  markAsRead: async (id: string, token?: string): Promise<any> => {
    return api.put(`/notifications/${id}/read`, undefined, token ? { Authorization: `Bearer ${token}` } : undefined);
  },

  // Mark all notifications as read
  markAllAsRead: async (token?: string): Promise<any> => {
    return api.put('/notifications/read-all', undefined, token ? { Authorization: `Bearer ${token}` } : undefined);
  },

  // Delete a notification
  delete: async (id: string, token?: string): Promise<any> => {
    return api.delete(`/notifications/${id}`, token ? { Authorization: `Bearer ${token}` } : undefined);
  },

  // Clear all notifications
  clearAll: async (token?: string): Promise<any> => {
    return api.delete('/notifications', token ? { Authorization: `Bearer ${token}` } : undefined);
  },
};
