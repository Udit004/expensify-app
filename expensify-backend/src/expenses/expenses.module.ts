import { forwardRef, Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserService } from '../users/auth-user.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [ExpensesController],
  providers: [ExpensesService, PrismaService, AuthUserService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
