import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      localStorage.clear();
      sessionStorage.clear();
      await login({ email: email.trim(), password, rememberMe });
      navigate('/connect');
    } catch {
      // Handled via useAuth error state
    }
  };

  const handleGoogleLogin = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await login({ email: 'google.user@asklytix.ai', password: 'Demo1234!' });
      navigate('/connect');
    } catch {
      // Handled via useAuth error state
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col items-center select-none">
      {/* Floating Glassmorphic Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full p-8 sm:p-9 rounded-2xl bg-[#0d121f]/90 border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden"
      >
        {/* Subtle Top Border Gradient Glow */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/60 to-purple-500/60" />

        {/* Card Header */}
        <div className="text-center mb-7 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 font-normal">
            Sign in to continue to{' '}
            <span className="text-[#38bdf8] font-medium">AskLytix</span>
          </p>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{authError}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1 text-left">
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`w-full bg-[#131826] border ${
                  errors.email ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-800/90 focus:border-cyan-500/60'
                } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-400 pl-1">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1 text-left">
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`w-full bg-[#131826] border ${
                  errors.password ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-800/90 focus:border-cyan-500/60'
                } rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-400 pl-1">{errors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-xs text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary Action Button ("Sign In ->") */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7056f7] via-[#5062f6] to-[#3b82f6] hover:from-[#6449f5] hover:to-[#2563eb] shadow-[0_0_22px_rgba(80,98,246,0.45)] hover:shadow-[0_0_28px_rgba(80,98,246,0.65)] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-slate-800/80 w-full" />
          <span className="bg-[#0d121f] px-3 text-xs text-slate-400 font-normal shrink-0">
            or
          </span>
          <div className="border-t border-slate-800/80 w-full" />
        </div>

        {/* Google Social Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-[#131826] hover:bg-[#181f32] border border-slate-800/90 text-xs sm:text-sm font-medium text-slate-200 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.99]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Don't have an account? Sign up */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-[#3b82f6] hover:text-[#60a5fa] font-semibold transition-colors"
          >
            Sign up
          </Link>
        </div>
      </motion.div>

      {/* Page Footer Credits */}
      <div className="mt-8 text-center space-y-1 text-[11px] text-slate-400 font-sans">
        <p>© 2025 AskLytix. All rights reserved.</p>
        <p className="space-x-2">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
        </p>
      </div>
    </div>
  );
};
