import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { KeyRound, ArrowLeft, MailCheck, RotateCcw } from 'lucide-react';
import { fadeUp } from '@/utils/animations';

export const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email address is required.');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch {
      // Handled in useAuth
    }
  };

  const handleResend = async () => {
    try {
      await forgotPassword(email);
      alert(`Reset link resent to ${email}`);
    } catch {
      // Ignore
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto space-y-6"
    >
      {!isSubmitted ? (
        <>
          {/* Header */}
          <div className="space-y-1.5 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Forgot Your Password?
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
            <Input
              type="email"
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(undefined);
              }}
              error={emailError}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              leftIcon={<KeyRound className="w-4 h-4" />}
              className="mt-2 text-sm font-bold"
            >
              Send Reset Instructions
            </Button>
          </form>

          {/* Back to Sign In Link */}
          <div className="pt-2 text-center text-xs text-slate-400">
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </>
      ) : (
        /* Animated Success Confirmation State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-cyan-400">
              <MailCheck className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Check your inbox
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
              If an account exists for <span className="text-cyan-400 font-mono font-bold">{email}</span>, password reset instructions have been sent.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Link to="/login">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="text-sm font-bold"
              >
                Back to Sign In
              </Button>
            </Link>

            <Button
              type="button"
              variant="ghost"
              fullWidth
              size="sm"
              onClick={handleResend}
              isLoading={isLoading}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
              className="text-xs text-slate-400 hover:text-white"
            >
              Resend Instructions
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
