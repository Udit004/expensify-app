import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

export interface CreateExpenseData {
  amount: number;
  description?: string;
  date?: Date | string;
  categoryId?: string;
  userId: string;
}

export interface ExpenseWithBudgetInfo {
  id: string;
  amount: number;
  description?: string | null;
  date: Date;
  userId: string;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  budgetWarning?: {
    categoryBudgetStatus?: {
      budgetAmount: number;
      spentAmount: number;
      remaining: number;
      percentageUsed: number;
      isOverBudget: boolean;
    };
    overallBudgetStatus?: {
      budgetAmount: number;
      spentAmount: number;
      remaining: number;
      percentageUsed: number;
      isOverBudget: boolean;
    };
  };
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  async create(data: CreateExpenseData): Promise<ExpenseWithBudgetInfo> {
    const expense = await this.prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        categoryId: data.categoryId,
        userId: data.userId,
      },
      include: { category: true },
    });

    // Check budget status after creating expense
    const budgetWarning = await this.checkBudgetAfterExpense(expense);

    // Send real-time notifications
    await this.sendExpenseNotifications(expense, 'created', budgetWarning);

    return {
      ...expense,
      budgetWarning,
    };
  }

  async findAll(userId: string, month?: number, year?: number) {
    let dateFilter = {};
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    return this.prisma.expense.findMany({
      where: {
        userId,
        ...dateFilter,
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.expense.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async update(id: string, data: any): Promise<ExpenseWithBudgetInfo> {
    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: { category: true },
    });

    // Check budget status after updating expense
    const budgetWarning = await this.checkBudgetAfterExpense(expense);

    // Send real-time notifications
    await this.sendExpenseNotifications(expense, 'updated', budgetWarning);

    return {
      ...expense,
      budgetWarning,
    };
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  // Get monthly spending summary
  async getMonthlySummary(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Total spending
    const totalSpending = await this.prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Spending by category
    const categorySpending = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get category names
    const categoriesWithSpending = await Promise.all(
      categorySpending.map(async (item) => {
        let categoryName = 'Uncategorized';
        if (item.categoryId) {
          const category = await this.prisma.category.findUnique({
            where: { id: item.categoryId },
          });
          categoryName = category?.name || 'Unknown Category';
        }

        return {
          categoryId: item.categoryId,
          categoryName,
          amount: item._sum.amount || 0,
        };
      })
    );

    return {
      totalSpending: totalSpending._sum.amount || 0,
      categoryBreakdown: categoriesWithSpending,
      month,
      year,
    };
  }

  // Check daily spending limit (optional feature)
  async getDailySpending(userId: string, date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyTotal = await this.prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return dailyTotal._sum.amount || 0;
  }

  private async sendExpenseNotifications(expense: any, action: 'created' | 'updated', budgetWarning?: any) {
    try {
      // Send expense notification using database user ID for storage
      const expenseNotification = this.notificationsGateway.createExpenseNotification(
        expense.userId, // Use database user ID for storage
        expense,
        action
      );
      await this.notificationsGateway.sendNotificationToUser(expense.userId, expenseNotification);

      // Send budget notifications if there are warnings
      if (budgetWarning) {
        // Category budget warning
        if (budgetWarning.categoryBudgetStatus) {
          const categoryNotification = this.notificationsGateway.createBudgetWarningNotification(
            expense.userId, // Use database user ID for storage
            expense.category?.name || null,
            budgetWarning.categoryBudgetStatus
          );
          await this.notificationsGateway.sendNotificationToUser(expense.userId, categoryNotification);
        }

        // Overall budget warning
        if (budgetWarning.overallBudgetStatus) {
          const overallNotification = this.notificationsGateway.createBudgetWarningNotification(
            expense.userId, // Use database user ID for storage
            null, // null for overall budget
            budgetWarning.overallBudgetStatus
          );
          await this.notificationsGateway.sendNotificationToUser(expense.userId, overallNotification);
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  private async checkBudgetAfterExpense(expense: any) {
    const expenseDate = new Date(expense.date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    // Check category budget if expense has a category
    let categoryBudgetStatus;
    if (expense.categoryId) {
      categoryBudgetStatus = await this.checkBudgetStatus(
        expense.userId,
        expense.categoryId,
        month,
        year
      );
    }

    // Check overall monthly budget
    const overallBudgetStatus = await this.checkBudgetStatus(
      expense.userId,
      undefined, // undefined means overall budget
      month,
      year
    );

    if (categoryBudgetStatus || overallBudgetStatus) {
      return {
        categoryBudgetStatus: categoryBudgetStatus || undefined,
        overallBudgetStatus: overallBudgetStatus || undefined,
      };
    }

    return undefined;
  }

  private async checkBudgetStatus(userId: string, categoryId?: string, month?: number, year?: number) {
    // Use findFirst instead of findUnique to handle null categoryId properly
    const budget = await this.prisma.budget.findFirst({
      where: {
        userId,
        categoryId: categoryId || null,
        month: month!,
        year: year!,
      },
    });

    if (!budget) return null;

    const startDate = new Date(year!, month! - 1, 1);
    const endDate = new Date(year!, month!, 0, 23, 59, 59);

    const totalSpent = await this.prisma.expense.aggregate({
      where: {
        userId,
        categoryId: categoryId || null,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const spentAmount = totalSpent._sum.amount || 0;
    const remaining = budget.amount - spentAmount;
    const percentageUsed = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

    // Only return if there's a significant budget usage (>70%) or over budget
    if (percentageUsed > 70 || spentAmount > budget.amount) {
      return {
        budgetAmount: budget.amount,
        spentAmount,
        remaining,
        percentageUsed,
        isOverBudget: spentAmount > budget.amount,
      };
    }

    return null;
  }
}