import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: any) {
    const category = await this.prisma.category.create({ data });
    
    // Send notification
    await this.sendCategoryNotification(category, 'created');
    
    return category;
  }

  findAllByUser(userId: string) {
    return this.prisma.category.findMany({ where: { userId } });
  }

  findOne(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    const category = await this.prisma.category.update({ where: { id }, data });
    
    // Send notification
    await this.sendCategoryNotification(category, 'updated');
    
    return category;
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Send notification before deleting
    await this.sendCategoryNotification(category, 'deleted');
    
    return this.prisma.category.delete({ where: { id } });
  }

  private async sendCategoryNotification(category: any, action: 'created' | 'updated' | 'deleted') {
    try {
      // Get the user with Clerk ID for WebSocket notifications
      const user = await this.prisma.user.findUnique({
        where: { id: category.userId },
        select: { clerkUserId: true }
      });

      if (!user?.clerkUserId) {
        console.error('User not found or no Clerk ID for category notifications:', category.userId);
        return;
      }

      // Create category notification
      const categoryNotification = this.createCategoryNotification(category, action);
      await this.notificationsGateway.sendNotificationToUser(user.clerkUserId, categoryNotification);
    } catch (error) {
      console.error('Error sending category notification:', error);
    }
  }

  private createCategoryNotification(category: any, action: 'created' | 'updated' | 'deleted') {
    let title: string;
    let actionText: string;
    
    switch (action) {
      case 'created':
        title = '📁 Category Created';
        actionText = 'created';
        break;
      case 'updated':
        title = '✏️ Category Updated';
        actionText = 'updated';
        break;
      case 'deleted':
        title = '🗑️ Category Deleted';
        actionText = 'deleted';
        break;
    }
    
    return {
      id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'general' as const,
      title,
      message: `Category "${category.name}" ${actionText}`,
      userId: category.userId,
      data: {
        categoryId: category.id,
        categoryName: category.name,
      },
      createdAt: new Date(),
      isRead: false,
    };
  }
}
