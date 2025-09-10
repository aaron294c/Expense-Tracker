// components/common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inline?: boolean; // render as <span> for inline usage inside <p>
}

export function LoadingSpinner({ size = 'md', className = '', inline = false }: LoadingSpinnerProps) {
  const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const Wrapper: any = inline ? 'span' : 'div';
  return (
    <Wrapper role="status" className={`${inline ? 'inline-flex' : 'flex'} items-center justify-center ${className}`}>
      <span className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
      <span className="sr-only">Loading…</span>
    </Wrapper>
  );
}
