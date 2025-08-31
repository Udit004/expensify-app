import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthUserService, parseClerkAuthHeader } from '../users/auth-user.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly authUserService: AuthUserService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.notificationsService.findAllByUser(user.id);
  }

  @Get('unread')
  async findUnread(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.notificationsService.findUnreadByUser(user.id);
  }

  @Get('count')
  async getCounts(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    const user = await this.authUserService.getOrCreateByClerk(claims);
    const [unreadCount, totalCount] = await Promise.all([
      this.notificationsService.getUnreadCount(user.id),
      this.notificationsService.getTotalCount(user.id),
    ]);
    
    return { unreadCount, totalCount };
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Put('read-all')
  async markAllAsRead(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.notificationsService.remove(id, user.id);
  }

  @Delete()
  async clearAll(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.notificationsService.clearAll(user.id);
  }

  @Post('test-realtime')
  async testRealtimeNotification(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    const user = await this.authUserService.getOrCreateByClerk(claims);
    
    // Get the full user object with clerkUserId
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, clerkUserId: true }
    });
    
    if (!fullUser?.clerkUserId) {
      throw new UnauthorizedException('User not found or no Clerk ID');
    }
    
    // Create a test notification
    const testNotification = {
      id: `test_${Date.now()}`,
      type: 'general' as const,
      title: '🧪 Real-time Test',
      message: 'This is a test notification to verify real-time delivery!',
      userId: fullUser.clerkUserId,
      data: { test: true },
      createdAt: new Date(),
      isRead: false,
    };
    
    // Send via WebSocket using the gateway
    await this.notificationsGateway.sendNotificationToUser(fullUser.clerkUserId, testNotification);
    
    return { message: 'Test notification sent', userId: fullUser.clerkUserId };
  }
}
