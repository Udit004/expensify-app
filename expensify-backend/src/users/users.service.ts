import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByClerkSub(sub: string) {
    return this.prisma.user.findFirst({ where: { clerkUserId: sub } });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // No record found to update
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async updateByClerkSubOrCreate(
    clerkSub: string,
    data: Prisma.UserUpdateInput,
    defaults?: { email?: string; name?: string },
  ) {
    const updateResult = await this.prisma.user.updateMany({
      where: { clerkUserId: clerkSub },
      data,
    });
    if (updateResult.count > 0) {
      return this.prisma.user.findFirst({
        where: { clerkUserId: clerkSub },
      });
    }
    const nameFromUpdate =
      typeof data.name === 'string' ? data.name : undefined;
    return this.prisma.user.create({
      data: {
        clerkUserId: clerkSub,
        email: defaults?.email || `${clerkSub}@example.com`,
        name: nameFromUpdate || defaults?.name || 'Unknown',
        password: '',
      } as Prisma.UserCreateInput,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
