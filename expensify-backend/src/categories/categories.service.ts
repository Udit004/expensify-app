import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.category.create({ data });
  }

  findAllByUser(userId: string) {
    return this.prisma.category.findMany({ where: { userId } });
  }

  findOne(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
