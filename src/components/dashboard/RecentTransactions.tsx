import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import { useTransactions } from '../../../hooks/useTransactions';
import { useHousehold } from '../../../hooks/useHousehold';
import { ChevronRight, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export function RecentTransactions() {
  const { currentHousehold } = useHousehold();
  const { transactions, isLoading } = useTransactions(currentHousehold?.id || null, {
    limit: 5
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.22,
        ease: [0.25, 0.8, 0.25, 1]
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-0">
          <h2 className="section-header">Recent Transactions</h2>
        </div>
        <div className="card p-0 divide-y divide-border/subtle overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
              <div className="size-12 bg-border/subtle rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-border/subtle rounded w-3/4" />
                <div className="h-3 bg-border/subtle rounded w-1/2" />
              </div>
              <div className="h-5 bg-border/subtle rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="section-header px-0">Recent Transactions</h2>
        <div className="card p-8 text-center">
          <div className="size-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus size={24} className="text-brand" />
          </div>
          <p className="text-text-secondary mb-4">No transactions yet</p>
          <Link href="/transactions/add">
            <motion.div
              className="inline-flex items-center gap-2 text-brand font-semibold text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add your first expense
              <ArrowUpRight size={16} />
            </motion.div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-0">
        <h2 className="section-header">Recent Transactions</h2>
        <Link href="/transactions">
          <motion.div
            className="flex items-center gap-1 text-brand text-sm font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All
            <ChevronRight size={16} />
          </motion.div>
        </Link>
      </div>

      <motion.div 
        className="card p-0 divide-y divide-border/subtle overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            className="flex items-center gap-4 p-4 hover:bg-surface/50 transition-colors duration-150 active:bg-surface/80"
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
          >
            <div className="size-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/10">
              <span className="text-xl">
                {transaction.primary_category_icon || '💳'}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-text-primary truncate line-clamp-1">
                  {transaction.merchant || transaction.description}
                </p>
                {transaction.direction === 'outflow' ? (
                  <ArrowUpRight size={14} className="text-red-500 flex-shrink-0" />
                ) : (
                  <ArrowDownLeft size={14} className="text-green-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-text-secondary line-clamp-1">
                {transaction.primary_category_name}
              </p>
            </div>
            
            <div className="text-right">
              <p className={`font-bold font-mono text-sm ${
                transaction.direction === 'outflow' ? 'text-red-600' : 'text-green-600'
              }`}>
                {transaction.direction === 'outflow' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
