/* eslint-disable prettier/prettier */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
@WebSocketGateway({ 
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove socket from user mapping
    for (const [userId, sockets] of this.userSockets.entries()) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    if (!data.userId) return;
    
    if (!this.userSockets.has(data.userId)) {
      this.userSockets.set(data.userId, new Set());
    }
    this.userSockets.get(data.userId)!.add(client.id);
    
    client.join(`user_${data.userId}`);
    this.logger.log(`User ${data.userId} joined with socket ${client.id}`);
    
    // Send confirmation
    client.emit('joined', { userId: data.userId, socketId: client.id });
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    if (!data.userId) return;
    
    client.leave(`user_${data.userId}`);
    
    const userSockets = this.userSockets.get(data.userId);
    if (userSockets) {
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(data.userId);
      }
    }
    
    this.logger.log(`User ${data.userId} left with socket ${client.id}`);
  }

  // Send notification to specific user and store in database
  async sendNotificationToUser(clerkUserId: string, notification: NotificationData) {
    try {
      // Get the database user ID for storage
      const user = await this.prisma.user.findUnique({
        where: { clerkUserId },
        select: { id: true }
      });

      if (!user) {
        this.logger.error(`User not found for Clerk ID: ${clerkUserId}`);
        return;
      }

      // Store notification in database using database user ID
      const dbNotification = await this.notificationsService.create({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        userId: user.id, // Use database user ID for storage
        data: notification.data,
      });

      // Send via WebSocket using Clerk user ID
      this.server.to(`user_${clerkUserId}`).emit('notification', {
        ...notification,
        id: dbNotification.id,
        createdAt: dbNotification.createdAt,
      });
      
      this.logger.log(`Notification sent to user ${clerkUserId} (DB: ${user.id}): ${notification.type}`);
    } catch (error) {
      this.logger.error(`Error sending notification to user ${clerkUserId}:`, error);
      // Still send via WebSocket even if database storage fails
      this.server.to(`user_${clerkUserId}`).emit('notification', notification);
    }
  }

  // Send notification to all clients (admin feature)
  sendBroadcastNotification(notification: Omit<NotificationData, 'userId'>) {
    this.server.emit('broadcast_notification', notification);
    this.logger.log(`Broadcast notification sent: ${notification.type}`);
  }

  // Create budget warning notification
  createBudgetWarningNotification(
    userId: string,
    categoryName: string | null,
    budgetStatus: {
      budgetAmount: number;
      spentAmount: number;
      remaining: number;
      percentageUsed: number;
      isOverBudget: boolean;
    }
  ): NotificationData {
    const isOverBudget = budgetStatus.isOverBudget;
    const percentage = Math.round(budgetStatus.percentageUsed);
    const categoryText = categoryName ? ` for ${categoryName}` : '';
    
    return {
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: isOverBudget ? 'budget_exceeded' : 'budget_warning',
      title: isOverBudget ? '🚨 Budget Exceeded!' : '⚠️ Budget Alert',
      message: isOverBudget 
        ? `You've exceeded your budget${categoryText} by ₹${Math.abs(budgetStatus.remaining).toFixed(2)}`
        : `You've used ${percentage}% of your budget${categoryText}. ₹${budgetStatus.remaining.toFixed(2)} remaining.`,
      userId,
      data: {
        category: categoryName,
        budgetStatus,
      },
      createdAt: new Date(),
      isRead: false,
    };
  }

  // Create expense notification
  createExpenseNotification(
    userId: string,
    expense: any,
    action: 'created' | 'updated'
  ): NotificationData {
    const categoryText = expense.category?.name ? ` in ${expense.category.name}` : '';
    
    return {
      id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: action === 'created' ? 'expense_created' : 'expense_updated',
      title: action === 'created' ? '💸 Expense Added' : '✏️ Expense Updated',
      message: `₹${expense.amount.toFixed(2)} expense ${action}${categoryText}${expense.description ? `: ${expense.description}` : ''}`,
      userId,
      data: {
        expenseId: expense.id,
        amount: expense.amount,
        category: expense.category?.name,
        description: expense.description,
      },
      createdAt: new Date(),
      isRead: false,
    };
  }

  // Get connected users count (for admin/debugging)
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}