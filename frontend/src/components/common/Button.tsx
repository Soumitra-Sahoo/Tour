import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-sunrise-500 text-white active:bg-sunrise-600 disabled:bg-sunrise-200',
  secondary: 'bg-pine-700 text-white active:bg-pine-900 disabled:bg-mist-200',
  ghost: 'bg-transparent text-pine-700 border border-mist-200 active:bg-mist-100',
  danger: 'bg-transparent text-red-600 border border-red-200 active:bg-red-50',
};

export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold transition-colors disabled:cursor-not-allowed ${
        variantClasses[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </button>
  );
}
