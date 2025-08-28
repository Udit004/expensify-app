import { api } from './api';

export interface AppUser {
  id: string;
  name: string;
  email: string;
}

export const usersService = {
  getMe(authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.get<AppUser>('/users/me', headers);
  },
  updateMe(data: { name?: string; email?: string }, authToken?: string) {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    return api.put<AppUser, { name?: string; email?: string }>('/users/me', data, headers);
  },
};


