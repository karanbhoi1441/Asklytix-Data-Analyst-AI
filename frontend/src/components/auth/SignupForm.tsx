import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordStrength } from './PasswordStrength';
import { SocialLoginButton } from './SocialLoginButton';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, ArrowRight, AlertCircle } from 'lucide-react';
import { fadeUp } from '@/utils/animations';

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error: authError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    termsAccepted?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!termsAccepted) {
      newErrors.termsAccepted = 'You must accept the Terms and Privacy Policy to continue.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await signup({ name, email, password, termsAccepted });
      // IMPORTANT: Navigate to Welcome Universe page '/'
      navigate('/connect');
    } catch {
      // Handled via useAuth error state
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signup({
        name: 'Google User',
        email: 'google.user@asklytix.ai',
        password: 'google_oauth_mock_password',
        termsAccepted: true
      });
      navigate('/connect');
    } catch {
      // Handled via useAuth error state
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto space-y-5"
    >
      {/* Header */}
      <div className="space-y-1 text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Your Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Start turning your data into meaningful insights.
        </p>
      </div>

      {/* Auth Error Banner */}
      {authError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{authError}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <Input
          type="text"
          label="Full Name"
          placeholder="Alex Mercer"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          required
        />

        <Input
          type="email"
          label="Email Address"
          placeholder="alex@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          required
        />

        <div className="space-y-1.5">
          <Input
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            required
          />
          {/* Password Strength Meter */}
          <PasswordStrength password={password} />
        </div>

        <Input
          type="password"
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
          required
        />

        {/* Terms Checkbox */}
        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (errors.termsAccepted) setErrors((prev) => ({ ...prev, termsAccepted: undefined }));
              }}
              className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500/30 shrink-0"
            />
            <span>
              I agree to the{' '}
              <a href="#terms" className="text-cyan-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-cyan-400 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.termsAccepted && (
            <p className="text-xs text-red-400 font-medium pl-6">{errors.termsAccepted}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isLoading}
          leftIcon={<UserPlus className="w-4 h-4" />}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2 text-sm font-bold"
        >
          Create Account
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-3">
        <div className="border-t border-slate-800/80 w-full" />
        <span className="bg-[#040711] px-3 text-[11px] font-mono uppercase text-slate-400 shrink-0">
          OR
        </span>
        <div className="border-t border-slate-800/80 w-full" />
      </div>

      {/* Google Button */}
      <SocialLoginButton onClick={handleGoogleSignup} isLoading={isLoading} />

      {/* Sign In Link */}
      <div className="pt-2 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
          Sign In
        </Link>
      </div>
    </motion.div>
  );
};
