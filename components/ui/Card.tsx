// components/ui/Card.tsx
import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        padding && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
}
