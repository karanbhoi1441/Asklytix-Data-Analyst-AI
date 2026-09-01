import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Eye, EyeOff, Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  type = 'text',
  className,
  disabled,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const isSearch = type === 'search';

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label 
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-cyan-400 text-xs font-mono ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {/* Left Icon or Search Icon */}
        {isSearch && !leftIcon ? (
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        ) : leftIcon ? (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          type={inputType}
          disabled={disabled}
          className={cn(
            'w-full bg-slate-950/70 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl py-2.5 px-3.5 border border-slate-800/80 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed',
            (leftIcon || isSearch) ? 'pl-10' : '',
            (rightIcon || isPassword) ? 'pr-10' : '',
            error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20' : '',
            className
          )}
          {...props}
        />

        {/* Password Eye Toggle */}
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        ) : rightIcon ? (
          <div className="absolute right-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-red-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
