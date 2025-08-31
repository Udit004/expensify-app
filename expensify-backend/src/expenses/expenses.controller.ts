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
  Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { AuthUserService, parseClerkAuthHeader } from '../users/auth-user.service';

export interface CreateExpenseDto {
  amount: number;
  description?: string;
  date?: string;
  categoryId?: string;
}

export interface UpdateExpenseDto {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
}

@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly authUserService: AuthUserService,
  ) {}

  // POST /expenses
  @Post()
  async create(
    @Body() data: CreateExpenseDto,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    
    return this.expensesService.create({
      ...data,
      userId: user.id,
    });
  }

  // GET /expenses/user/me
  @Get('user/me')
  async findAll(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    
    const monthNum = month ? parseInt(month) : undefined;
    const yearNum = year ? parseInt(year) : undefined;
    
    return this.expensesService.findAll(user.id, monthNum, yearNum);
  }

  // GET /expenses/summary/month/:month/year/:year
  @Get('summary/month/:month/year/:year')
  async getMonthlySummary(
    @Param('month') month: string,
    @Param('year') year: string,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    
    return this.expensesService.getMonthlySummary(
      user.id,
      parseInt(month),
      parseInt(year)
    );
  }

  // GET /expenses/daily
  @Get('daily')
  async getDailySpending(
    @Query('date') date?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    
    const targetDate = date ? new Date(date) : new Date();
    const amount = await this.expensesService.getDailySpending(user.id, targetDate);
    
    return { amount };
  }

  // GET /expenses/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  // PUT /expenses/:id
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateExpenseDto,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    
    return this.expensesService.update(id, data);
  }

  // DELETE /expenses/:id
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}