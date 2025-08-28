import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserService } from './auth-user.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, AuthUserService],
})
export class UsersModule {}
