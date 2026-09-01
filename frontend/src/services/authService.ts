import type { User, LoginCredentials, SignupCredentials } from '@/types/auth';
import { apiClient } from '@/services/apiClient';

export const authService = {
  /**
   * User Login via FastAPI Backend (Sets HttpOnly Cookies)
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const res = await apiClient.post<{ success: boolean; user: User }>('/api/v1/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    return res.user;
  },

  /**
   * User Sign Up via FastAPI Backend (Sets HttpOnly Cookies)
   */
  async signup(credentials: SignupCredentials): Promise<User> {
    const res = await apiClient.post<{ success: boolean; user: User }>('/api/v1/auth/signup', {
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
    });
    return res.user;
  },

  /**
   * Password Reset Instructions Request
   */
  async forgotPassword(email: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log(`[AuthService] Password reset requested for: ${email}`);
    return true;
  },

  /**
   * Get Current Authenticated User from Backend Session
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await apiClient.get<User>('/api/v1/auth/me');
      return user;
    } catch {
      return null;
    }
  },

  /**
   * User Logout (Clears HttpOnly Cookies on Backend)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Ignore logout errors
    }
  },
};
