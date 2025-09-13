import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface QuickStatsProps {
  dailyAverage: number;
  weeklyChange: number;
  projectedSpend: number;
  daysLeft: number;
}

export function QuickStats({ dailyAverage, weeklyChange, projectedSpend, daysLeft }: QuickStatsProps) {
  const isWeeklyChangePositive = weeklyChange >= 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  return (
    <div className="mt-3">
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4"
          variants={itemVariants}
        >
          <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600">
            <DollarSign size={16} />
          </div>
          <div className="mt-2 text-[12.5px] text-gray-500 truncate">Daily Average</div>
          <div className="mt-1 text-[18px] font-semibold tabular-nums text-gray-900">{formatCurrency(dailyAverage)}</div>
          <div className="mt-1 text-[12px] text-gray-500 flex items-center gap-1">
            {isWeeklyChangePositive ? (
              <TrendingUp size={10} className="text-red-500" />
            ) : (
              <TrendingDown size={10} className="text-green-500" />
            )}
            <span className={isWeeklyChangePositive ? 'text-red-500' : 'text-green-500'}>
              {isWeeklyChangePositive ? '+' : ''}{formatCurrency(Math.abs(weeklyChange))}
            </span>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4"
          variants={itemVariants}
        >
          <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600">
            <Calendar size={16} />
          </div>
          <div className="mt-2 text-[12.5px] text-gray-500 truncate">Projected Spend</div>
          <div className="mt-1 text-[18px] font-semibold tabular-nums text-gray-900">{formatCurrency(projectedSpend)}</div>
          <div className="mt-1 text-[12px] text-gray-500">
            {daysLeft} days left
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
