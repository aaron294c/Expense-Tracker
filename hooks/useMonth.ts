// /hooks/useMonth.ts
import { useState, useEffect, useMemo } from 'react';

interface UseMonthReturn {
  currentMonth: string; // YYYY-MM-01 format
  monthDisplay: string; // "January 2024" format
  previousMonth: string;
  nextMonth: string;
  isCurrentCalendarMonth: boolean;
  setMonth: (month: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
}

export function useMonth(initialMonth?: string): UseMonthReturn {
  // Default to current month in YYYY-MM-01 format
  const defaultMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const [currentMonth, setCurrentMonth] = useState<string>(initialMonth || defaultMonth);

  // Calculate related months
  const { previousMonth, nextMonth, monthDisplay, isCurrentCalendarMonth } = useMemo(() => {
    const date = new Date(currentMonth);
    
    // Previous month
    const prevDate = new Date(date);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`;
    
    // Next month
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-01`;
    
    // Display format
    const display = date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Check if it's current calendar month
    const now = new Date();
    const isCurrentMonth = date.getFullYear() === now.getFullYear() && 
                          date.getMonth() === now.getMonth();
    
    return {
      previousMonth: prevMonth,
      nextMonth: nextMonth,
      monthDisplay: display,
      isCurrentCalendarMonth: isCurrentMonth
    };
  }, [currentMonth]);

  const setMonth = (month: string) => {
    // Validate month format
    const monthRegex = /^\d{4}-\d{2}-01$/;
    if (!monthRegex.test(month)) {
      console.error('Invalid month format. Expected YYYY-MM-01');
      return;
    }
    setCurrentMonth(month);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(previousMonth);
  };

  const goToNextMonth = () => {
    setCurrentMonth(nextMonth);
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(defaultMonth);
  };

  return {
    currentMonth,
    monthDisplay,
    previousMonth,
    nextMonth,
    isCurrentCalendarMonth,
    setMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth
  };
}