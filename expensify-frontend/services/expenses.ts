import { api } from './api';

export interface Expense {
  id: string;
  amount: number;
  date: string;
  description?: string | null;
  categoryId?: string | null;
  userId: string;
}

export interface CreateExpenseInput {
  amount: number;
  date: string;
  description?: string | null;
  categoryId?: string | null;
}

export const expensesService = {
  listMine(authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.get<Expense[]>(`/expenses/user/me`, headers);
  },
  create(data: CreateExpenseInput, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.post<Expense, CreateExpenseInput>('/expenses', data, headers);
  },
  getById(id: string) {
    return api.get<Expense>(`/expenses/${id}`);
  },
  update(id: string, data: Partial<CreateExpenseInput>) {
    return api.put<Expense, Partial<CreateExpenseInput>>(`/expenses/${id}`, data);
  },
  remove(id: string) {
    return api.delete<{ success: boolean }>(`/expenses/${id}`);
  },
};


