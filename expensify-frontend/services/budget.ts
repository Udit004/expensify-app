import { api } from './api';
import { CreateExpenseInput, UpdateExpenseInput, Expense } from './expenses'

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  userId: string;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetInput {
  amount: number;
  month: number;
  year: number;
  categoryId?: string | null;
}

export interface UpdateBudgetInput {
  amount: number;
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

export interface BudgetStatus {
  budgetAmount: number;
  spentAmount: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

export interface ExpenseWithBudgetInfo {
  id: string;
  amount: number;
  description?: string | null;
  date: string;
  userId: string;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  budgetWarning?: {
    categoryBudgetStatus?: BudgetStatus;
    overallBudgetStatus?: BudgetStatus;
  };
}

export interface MonthlySummary {
  totalSpending: number;
  categoryBreakdown: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
  }>;
  month: number;
  year: number;
}

export const budgetService = {
  // Create a new budget
  create(data: CreateBudgetInput, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.post<Budget, CreateBudgetInput>('/budgets', data, headers);
  },

  // Get current month budgets
  getCurrentMonthBudgets(authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.get<Budget[]>('/budgets/current', headers);
  },

  // Get budgets for specific month/year
  getBudgetsForMonth(month: number, year: number, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.get<Budget[]>(`/budgets/month/${month}/year/${year}`, headers);
  },

  // Get budget overview with spending analysis
  getBudgetOverview(month?: number, year?: number, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const queryString = params.toString();
    const url = `/budgets/overview${queryString ? `?${queryString}` : ''}`;
    return api.get<BudgetOverview>(url, headers);
  },

  // Update budget
  update(id: string, data: UpdateBudgetInput, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.put<Budget, UpdateBudgetInput>(`/budgets/${id}`, data, headers);
  },

  // Delete budget
  remove(id: string, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.delete<{ success: boolean }>(`/budgets/${id}`, headers);
  },
};

// Enhanced expense service with budget integration
export const enhancedExpensesService = {
  // Create expense with budget checking
  create(data: CreateExpenseInput, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.post<ExpenseWithBudgetInfo, CreateExpenseInput>('/expenses', data, headers);
  },

  // Update expense with budget checking
  update(id: string, data: UpdateExpenseInput, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.put<ExpenseWithBudgetInfo, UpdateExpenseInput>(`/expenses/${id}`, data, headers);
  },

  // Get monthly expenses with optional filtering
  getMonthlyExpenses(month: number, year: number, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.get<Expense[]>(`/expenses/user/me?month=${month}&year=${year}`, headers);
  },

  // Get monthly summary
  getMonthlySummary(month: number, year: number, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.get<MonthlySummary>(`/expenses/summary/month/${month}/year/${year}`, headers);
  },

  // Get daily spending
  getDailySpending(date?: string, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    const queryParam = date ? `?date=${date}` : '';
    return api.get<{ amount: number }>(`/expenses/daily${queryParam}`, headers);
  },
};

// Utility functions for budget management
export const budgetUtils = {
  // Get current month and year
  getCurrentMonthYear() {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  },

  // Format budget percentage
  formatPercentage(percentage: number): string {
    return `${Math.round(percentage)}%`;
  },

  // Get budget status color for UI
  getBudgetStatusColor(percentageUsed: number, isOverBudget: boolean) {
    if (isOverBudget) return 'red';
    if (percentageUsed > 90) return 'orange';
    if (percentageUsed > 75) return 'yellow';
    return 'green';
  },

  // Format currency
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  // Check if budget warning should be shown
  shouldShowBudgetWarning(budgetStatus?: BudgetStatus): boolean {
    return budgetStatus ? budgetStatus.percentageUsed > 80 : false;
  },

  // Get budget warning message
  getBudgetWarningMessage(budgetStatus: BudgetStatus, categoryName?: string): string {
    const target = categoryName || 'overall budget';
    
    if (budgetStatus.isOverBudget) {
      const overAmount = Math.abs(budgetStatus.remaining);
      return `You're over your ${target} by ${this.formatCurrency(overAmount)}`;
    }
    
    if (budgetStatus.percentageUsed > 90) {
      return `You've used ${this.formatPercentage(budgetStatus.percentageUsed)} of your ${target}`;
    }
    
    if (budgetStatus.percentageUsed > 80) {
      return `You're approaching your ${target} limit (${this.formatPercentage(budgetStatus.percentageUsed)} used)`;
    }
    
    return '';
  },

  // Get month name
  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  },

  // Generate months for dropdown
  getMonthOptions() {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: this.getMonthName(i + 1),
    }));
  },

  // Generate years for dropdown (current year ± 2)
  getYearOptions() {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - 2 + i,
      label: (currentYear - 2 + i).toString(),
    }));
  },

  // Calculate remaining days in month
  getRemainingDaysInMonth(month?: number, year?: number): number {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();
    
    const endOfMonth = new Date(targetYear, targetMonth, 0);
    const today = new Date();
    
    if (targetYear !== today.getFullYear() || targetMonth !== (today.getMonth() + 1)) {
      return 0; // Not current month
    }
    
    return endOfMonth.getDate() - today.getDate();
  },

  // Calculate suggested daily spending limit
  getSuggestedDailyLimit(remaining: number, month?: number, year?: number): number {
    const remainingDays = this.getRemainingDaysInMonth(month, year);
    return remainingDays > 0 ? remaining / remainingDays : 0;
  },
};