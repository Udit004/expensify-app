import { api } from './api';

export interface Category {
  id: string;
  name: string;
}

export interface CreateCategoryInput {
  name: string;
}

export const categoriesService = {
  list(authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.get<Category[]>('/categories', headers);
  },
  create(data: CreateCategoryInput, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.post<Category, CreateCategoryInput>('/categories', data, headers);
  },
  getById(id: string) {
    return api.get<Category>(`/categories/${id}`);
  },
  update(id: string, data: Partial<CreateCategoryInput>) {
    return api.put<Category, Partial<CreateCategoryInput>>(`/categories/${id}`, data);
  },
  remove(id: string) {
    return api.delete<{ success: boolean }>(`/categories/${id}`);
  },
};


