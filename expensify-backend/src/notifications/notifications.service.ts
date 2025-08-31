import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateNotificationData {
  type: 'budget_warning' | 'budget_exceeded' | 'expense_created' | 'expense_updated' | 'general';
  title: string;
  message: string;
  userId: string;
  data?: any;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData) {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        data: data.data ? JSON.parse(JSON.stringify(data.data)) : null,
      },
    });
  }

  async findAllByUser(userId: string, limit: number = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findUnreadByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { 
        userId,
        isRead: false 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { 
        id,
        userId // Ensure user can only mark their own notifications as read
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false 
      },
      data: { isRead: true },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { 
        id,
        userId // Ensure user can only delete their own notifications
      },
    });
  }

  async clearAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { 
        userId,
        isRead: false 
      },
    });
  }

  async getTotalCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId },
    });
  }
}
