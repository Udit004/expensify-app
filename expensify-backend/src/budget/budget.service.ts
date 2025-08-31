import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateBudgetData {
  amount: number;
  month: number;
  year: number;
  userId: string;
  categoryId?: string;
}

export interface BudgetOverview {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  categoryBreakdown: Array<{
    categoryId: string | null;
    categoryName: string | null;
    budgetAmount: number;
    spentAmount: number;
    remaining: number;
    percentageUsed: number;
    isOverBudget: boolean;
  }>;
  overallBudget?: {
    budgetAmount: number;
    spentAmount: number;
    remaining: number;
    percentageUsed: number;
    isOverBudget: boolean;
  };
}

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBudgetData) {
    // Check if budget already exists for this user/category/month/year
    // Use findFirst instead of findUnique to handle null categoryId properly
    const existingBudget = await this.prisma.budget.findFirst({
      where: {
        userId: data.userId,
        categoryId: data.categoryId || null,
        month: data.month,
        year: data.year,
      },
    });

    if (existingBudget) {
      // Update existing budget instead of creating new one
      return this.prisma.budget.update({
        where: { id: existingBudget.id },
        data: { amount: data.amount },
        include: { category: true },
      });
    }

    return this.prisma.budget.create({
      data: {
        amount: data.amount,
        month: data.month,
        year: data.year,
        userId: data.userId,
        categoryId: data.categoryId || null,
      },
      include: { category: true },
    });
  }

  async getBudgetsForMonth(userId: string, month: number, year: number) {
    return this.prisma.budget.findMany({
      where: {
        userId,
        month,
        year,
      },
      include: { category: true },
      orderBy: [
        { categoryId: 'asc' }, // null first (overall budget)
        { category: { name: 'asc' } },
      ],
    });
  }

  async getBudgetOverview(userId: string, month: number, year: number): Promise<BudgetOverview> {
    // Get all budgets for the month
    const budgets = await this.getBudgetsForMonth(userId, month, year);

    // Get all expenses for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { category: true },
    });

    // Calculate spending by category
    const spendingByCategory = expenses.reduce((acc, expense) => {
      const categoryId = expense.categoryId || null;
      acc[categoryId as string] = (acc[categoryId as string] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total spending
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Find overall budget (categoryId is null)
    const overallBudget = budgets.find(b => b.categoryId === null);
    const categoryBudgets = budgets.filter(b => b.categoryId !== null);

    // Calculate category breakdown
    const categoryBreakdown = categoryBudgets.map(budget => {
      const spentAmount = spendingByCategory[budget.categoryId!] || 0;
      const remaining = budget.amount - spentAmount;
      const percentageUsed = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

      return {
        categoryId: budget.categoryId,
        categoryName: budget.category?.name || null,
        budgetAmount: budget.amount,
        spentAmount,
        remaining,
        percentageUsed,
        isOverBudget: spentAmount > budget.amount,
      };
    });

    // Add categories with spending but no budget
    const categoriesWithSpending = Object.keys(spendingByCategory).filter(categoryId => 
      categoryId !== 'null' && !categoryBudgets.some(b => b.categoryId === categoryId)
    );

    for (const categoryId of categoriesWithSpending) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      categoryBreakdown.push({
        categoryId,
        categoryName: category?.name || 'Unknown Category',
        budgetAmount: 0,
        spentAmount: spendingByCategory[categoryId],
        remaining: -spendingByCategory[categoryId],
        percentageUsed: 0,
        isOverBudget: true,
      });
    }

    // Handle uncategorized spending
    const uncategorizedSpending = spendingByCategory['null'] || 0;
    if (uncategorizedSpending > 0) {
      const uncategorizedBudget = budgets.find(b => b.categoryId === null);
      categoryBreakdown.push({
        categoryId: null,
        categoryName: 'Uncategorized',
        budgetAmount: uncategorizedBudget?.amount || 0,
        spentAmount: uncategorizedSpending,
        remaining: (uncategorizedBudget?.amount || 0) - uncategorizedSpending,
        percentageUsed: uncategorizedBudget?.amount ? (uncategorizedSpending / uncategorizedBudget.amount) * 100 : 0,
        isOverBudget: uncategorizedSpending > (uncategorizedBudget?.amount || 0),
      });
    }

    // Calculate totals
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const remaining = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const result: BudgetOverview = {
      totalBudget,
      totalSpent,
      remaining,
      percentageUsed,
      categoryBreakdown,
    };

    // Add overall budget info if exists
    if (overallBudget) {
      result.overallBudget = {
        budgetAmount: overallBudget.amount,
        spentAmount: totalSpent,
        remaining: overallBudget.amount - totalSpent,
        percentageUsed: overallBudget.amount > 0 ? (totalSpent / overallBudget.amount) * 100 : 0,
        isOverBudget: totalSpent > overallBudget.amount,
      };
    }

    return result;
  }

  async update(id: string, data: { amount?: number }, userId: string) {
    // Verify budget belongs to user
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this budget');
    }

    return this.prisma.budget.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async remove(id: string, userId: string) {
    // Verify budget belongs to user
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this budget');
    }

    return this.prisma.budget.delete({
      where: { id },
    });
  }

  // Helper method to check if user is over budget for a category
  async checkBudgetStatus(userId: string, categoryId?: string, month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const budget = await this.prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: categoryId as any,
          month: targetMonth,
          year: targetYear,
        },
      },
    });

    if (!budget) return null;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

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

    return {
      budgetAmount: budget.amount,
      spentAmount,
      remaining,
      percentageUsed,
      isOverBudget: spentAmount > budget.amount,
    };
  }
}