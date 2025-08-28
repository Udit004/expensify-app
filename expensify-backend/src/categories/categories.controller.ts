import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Prisma } from '@prisma/client';
import { AuthUserService, parseClerkAuthHeader } from '../users/auth-user.service';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly authUserService: AuthUserService,
  ) {}

  @Post()
  async create(@Body() data: any, @Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.categoriesService.create({ ...data, userId: user.id });
  }

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.categoriesService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
