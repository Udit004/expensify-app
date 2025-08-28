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
import { ExpensesService } from './expenses.service';
import { AuthUserService, parseClerkAuthHeader } from '../users/auth-user.service';

@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly authUserService: AuthUserService,
  ) {}

  // POST /expenses
  @Post()
  async create(
    @Body() data: any,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.expensesService.create({ ...data, userId: user.id });
  }

  // GET /expenses/user/:userId
  @Get('user/me')
  async findAll(@Headers('authorization') authorization?: string) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.expensesService.findAll(user.id);
  }

  // GET /expenses/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  // PUT /expenses/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.expensesService.update(id, data);
  }

  // DELETE /expenses/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
