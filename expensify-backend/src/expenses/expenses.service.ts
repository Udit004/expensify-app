import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.expense.create({ data });
  }

  async findAll(userId: string) {
    return this.prisma.expense.findMany({
      where: { userId },
      include: { category: true }, // join with category table
    });
  }

  async findOne(id: string) {
    return this.prisma.expense.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.prisma.expense.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }
}
