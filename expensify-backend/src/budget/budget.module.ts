import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserService } from '../users/auth-user.service';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService, PrismaService, AuthUserService],
})
export class BudgetModule {}
