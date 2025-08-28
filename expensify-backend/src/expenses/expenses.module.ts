import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserService } from '../users/auth-user.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, PrismaService, AuthUserService],
})
export class ExpensesModule {}
