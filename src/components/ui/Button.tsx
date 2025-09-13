import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const MotionButton = motion.button;

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className, 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <MotionButton
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 ease-subtle',
        'focus:outline-none focus:ring-4 focus:ring-offset-0 min-h-[44px] min-w-[44px]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-brand text-text-inverted shadow-ring hover:shadow-glow focus:ring-brand/20': variant === 'primary',
          'bg-surface/elevated text-text-primary border border-border/subtle shadow-soft hover:bg-surface focus:ring-border/strong': variant === 'secondary',
          'bg-transparent text-text-secondary hover:bg-brand/5 focus:ring-brand/10': variant === 'ghost',
          'bg-red-500 text-text-inverted shadow-ring hover:bg-red-600 focus:ring-red-500/20': variant === 'destructive',
          'px-3 py-2 text-sm h-9': size === 'sm',
          'px-4 py-3 text-sm h-11': size === 'md',
          'px-6 py-4 text-base h-14': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </MotionButton>
  );
}
