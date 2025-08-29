import { api } from './api';

export interface Expense {
  id: string;
  amount: number;
  date: string;
  description?: string | null;
  categoryId?: string | null;
  userId: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateExpenseInput {
  amount: number;
  date: string;
  description?: string | null;
  categoryId?: string | null;
}

export interface UpdateExpenseInput {
  amount?: number;
  date?: string;
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
  
  getById(id: string, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.get<Expense>(`/expenses/${id}`, headers);
  },
  
  update(id: string, data: UpdateExpenseInput, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.put<Expense, UpdateExpenseInput>(`/expenses/${id}`, data, headers);
  },
  
  remove(id: string, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.delete<{ success: boolean }>(`/expenses/${id}`, headers);
  },
};