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
import { BudgetService } from './budget.service';
import {
  AuthUserService,
  parseClerkAuthHeader,
} from '../users/auth-user.service';

export interface CreateBudgetDto {
  amount: number;
  month: number;
  year: number;
  categoryId?: string;
}

export interface UpdateBudgetDto {
  amount?: number;
}

@Controller('budgets')
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly authUserService: AuthUserService,
  ) {}

  // POST /budgets
  @Post()
  async create(
    @Body() data: CreateBudgetDto,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);
    return this.budgetService.create({ ...data, userId: user.id });
  }

  // GET /budgets/current - Get current month budgets
  @Get('current')
  async getCurrentMonthBudgets(
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);

    const now = new Date();
    return this.budgetService.getBudgetsForMonth(
      user.id,
      now.getMonth() + 1,
      now.getFullYear(),
    );
  }

  // GET /budgets/month/:month/year/:year
  @Get('month/:month/year/:year')
  async getBudgetsForMonth(
    @Param('month') month: string,
    @Param('year') year: string,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);

    return this.budgetService.getBudgetsForMonth(
      user.id,
      parseInt(month),
      parseInt(year),
    );
  }

  // GET /budgets/overview - Get budget overview with spending
  @Get('overview')
  async getBudgetOverview(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    return this.budgetService.getBudgetOverview(
      user.id,
      targetMonth,
      targetYear,
    );
  }

  // PUT /budgets/:id
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateBudgetDto,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);

    return this.budgetService.update(id, data, user.id);
  }

  // DELETE /budgets/:id
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const claims = parseClerkAuthHeader(authorization);
    if (!claims) throw new UnauthorizedException();
    const user = await this.authUserService.getOrCreateByClerk(claims);

    return this.budgetService.remove(id, user.id);
  }
}