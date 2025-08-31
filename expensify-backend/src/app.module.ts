import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthUserService } from './users/auth-user.service';
import { BudgetModule } from './budget/budget.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [PrismaModule, UsersModule, CategoriesModule, ExpensesModule, BudgetModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService, AuthUserService],
})
export class AppModule {}
