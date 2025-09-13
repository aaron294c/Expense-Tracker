import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const MotionInput = motion.input;

export function Input({ 
  label, 
  error, 
  helpText, 
  icon, 
  rightIcon, 
  className, 
  ...props 
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <div className="text-text-subtle">
              {icon}
            </div>
          </div>
        )}
        
        <MotionInput
          className={clsx(
            'block w-full rounded-2xl border transition-all duration-200 ease-subtle',
            'bg-surface/70 backdrop-blur-xs px-4 py-3 text-text-primary',
            'placeholder:text-text-subtle text-base min-h-[44px]',
            'focus:outline-none focus:ring-4 focus:ring-brand/20 focus:border-brand focus:bg-surface/90',
            'hover:bg-surface/80',
            icon && 'pl-12',
            rightIcon && 'pr-12',
            error 
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
              : 'border-border/subtle',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <div className="text-text-subtle">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <motion.p 
          className="mt-2 text-[12px] text-red-600 font-medium"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {error}
        </motion.p>
      )}
      
      {helpText && !error && (
        <p className="mt-1 text-[12px] text-text-subtle">
          {helpText}
        </p>
      )}
    </div>
  );
}
