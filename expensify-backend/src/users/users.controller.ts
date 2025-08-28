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
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { AuthUserService, parseClerkAuthHeader } from './auth-user.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authUserService: AuthUserService,
  ) {}

  @Post()
  create(@Body() data: any) {
    return this.usersService.create(data);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // GET /users/me
  @Get('me')
  async getMe(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.usersService.findOne(user.id);
  }

  // PUT /users/me
  @Put('me')
  async updateMe(
    @Headers('authorization') authorization: string | undefined,
    @Body() data: { name?: string },
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.usersService.update(user.id, { name: data?.name } as any);
  }
}
