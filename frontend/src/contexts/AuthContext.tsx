import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';
import { datasetService } from '@/services/datasetService';
import type { User, LoginCredentials, SignupCredentials, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (credentials: SignupCredentials) => Promise<User>;
  forgotPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    authService.getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setState({
            user: currentUser,
            isAuthenticated: !!currentUser,
            isLoading: false,
            error: null
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      try {
        localStorage.removeItem('asklytix_active_dataset_id');
        localStorage.removeItem('asklytix_dashboard_widgets');
        localStorage.removeItem('asklytix_dashboard_active_region');
      } catch {}
      const user = await authService.login(credentials);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return user;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials): Promise<User> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.signup(credentials);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return user;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Signup failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authService.forgotPassword(email);
      setState((prev) => ({ ...prev, isLoading: false }));
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Password reset request failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await datasetService.purgeSessionStorage();
    } catch {
      // ignore
    }
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
