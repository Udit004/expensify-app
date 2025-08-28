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
import { AuthUserService, parseClerkAuthHeader } from './auth-user.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authUserService: AuthUserService,
  ) {}

  @Post()
  create(@Body() data: { name: string; email: string }) {
    return this.usersService.create({
      name: data.name,
      email: data.email,
      password: '',
    });
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/me
  @Get('me')
  async getMe(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    await this.authUserService.getOrCreateByClerk(claims);
    return this.usersService.findByClerkSub(claims.sub);
  }

  // PUT /users/me
  @Put('me')
  async updateMe(
    @Headers('authorization') authorization: string | undefined,
    @Body() data: { name?: string },
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    await this.authUserService.getOrCreateByClerk(claims);
    return this.usersService.updateByClerkSubOrCreate(
      claims.sub,
      { name: data?.name },
      {
        email: claims.email,
        name: claims.name,
      },
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { name?: string }) {
    return this.usersService.update(id, { name: data?.name });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
