import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const MotionDiv = motion.div;

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <MotionDiv
      className={clsx(
        'card',
        padding && 'p-4',
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.8, 0.25, 1] }}
    >
      {children}
    </MotionDiv>
  );
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      {children}
    </div>
  );
}
