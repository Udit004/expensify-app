import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserService } from '../users/auth-user.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, AuthUserService],
})
export class CategoriesModule {}
