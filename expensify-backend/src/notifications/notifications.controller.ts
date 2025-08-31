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

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly authUserService: AuthUserService,
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
}
