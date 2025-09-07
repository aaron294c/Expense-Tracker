// pages/insights.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useCategorySummary } from '@/hooks/useCategorySummary';
import { useBudgets } from '@/hooks/useBudgets';
import { useMonth } from '@/hooks/useMonth';

export default function InsightsPage() {
  const router = useRouter();
  const { user, currentHousehold, isLoading: authLoading } = useAuth();
  const { currentMonth, monthDisplay, goToPreviousMonth, goToNextMonth } = useMonth();
  const [viewType, setViewType] = useState<'personal' | 'household'>('household');
  
  const {
    summaries,
    isLoading: summariesLoading,
    getTotalSpent,
    getTotalBudget,
    getBudgetUtilization,
    getTopCategories
  } = useCategorySummary(currentHousehold?.id || null, currentMonth);

  const { data: budgetData } = useBudgets(currentHousehold?.id || null, currentMonth);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || !currentHousehold) {
    return <InsightsSkeleton />;
  }

  const totalSpent = getTotalSpent();
  const totalBudget = getTotalBudget();
  const budgetUtilization = getBudgetUtilization();
  const topExpenseCategories = getTopCategories('expense', 5);
  const burnRate = budgetData?.burn_rate;

  // Calculate month-over-month change (placeholder)
  const monthlyChange = 5.2; // This would come from comparing with previous month data

  const donutSegments = topExpenseCategories.slice(0, 5).map((category, index) => {
    const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF453A'];
    const percentage = totalSpent > 0 ? (category.spent / totalSpent) * 100 : 0;
    
    return {
      category: category.category_name,
      amount: category.spent,
      percentage,
      color: colors[index] || '#8E8E93',
      budget: category.budget || 0,
      remaining: category.remaining || 0
    };
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button 
            onClick={() => router.back()}
            className="text-gray-800 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <span className="text-2xl">←</span>
          </button>
          <h1 className="text-gray-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
            Insights
          </h1>
        </div>

        {/* View Toggle */}
        <div className="flex px-4 py-3">
          <div className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setViewType('personal')}
              className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-3 text-sm font-semibold transition-all ${
                viewType === 'personal'
                  ? 'bg-white shadow-sm text-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              You
            </button>
            <button
              onClick={() => setViewType('household')}
              className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-3 text-sm font-semibold transition-all ${
                viewType === 'household'
                  ? 'bg-white shadow-sm text-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Household
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 pb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <span className="text-xl">‹</span>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{monthDisplay}</h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <span className="text-xl">›</span>
          </button>
        </div>
      </header>

      <main className="px-4 pb-24">
        {summariesLoading ? (
          <InsightsContentSkeleton />
        ) : (
          <>
            {/* Category Breakdown */}
            <section className="mb-6">
              <h2 className="text-black text-[22px] font-bold tracking-[-0.4px] px-2 pb-3">
                Category Breakdown
              </h2>
              
              <div className="rounded-[20px] bg-white shadow-sm border border-gray-100">
                {/* Donut Chart */}
                <div className="relative h-56 flex items-center justify-center p-6">
                  <DonutChart segments={donutSegments} />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-black tracking-tight text-[36px] font-bold">
                        ${totalSpent.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-sm font-medium">This Month</p>
                      <div className={`flex gap-1 items-center justify-center text-sm font-medium mt-1 ${
                        monthlyChange > 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        <span className="text-base">
                          {monthlyChange > 0 ? '↑' : '↓'}
                        </span>
                        <span>{Math.abs(monthlyChange)}% vs last month</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category List */}
                <div className="p-6 pt-0 space-y-4">
                  {donutSegments.map((segment, index) => (
                    <CategoryInsightRow 
                      key={segment.category}
                      category={segment}
                      color={segment.color}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Insights */}
            <section className="mb-8">
              <h2 className="text-black text-[22px] font-bold tracking-[-0.4px] px-2 pb-3">
                Quick Insights
              </h2>
              
              <div className="space-y-4">
                {/* Spending Velocity */}
                <div className="rounded-[20px] bg-white p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-500 shrink-0">
                      <span className="text-xl">⚡</span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">Spending Velocity</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {burnRate?.daily_average ? (
                          `You're spending $${burnRate.daily_average.toFixed(0)}/day. ${
                            burnRate.daily_average > (burnRate.suggested_daily_spend || 0)
                              ? `That's ${((burnRate.daily_average / (burnRate.suggested_daily_spend || 1) - 1) * 100).toFixed(0)}% above your target.`
                              : 'You\'re on track with your budget.'
                          }`
                        ) : (
                          'Add more transactions to see spending insights.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Smart Suggestion */}
                <div className="rounded-[20px] bg-white p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-500 shrink-0">
                      <span className="text-xl">💡</span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">Smart Suggestion</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(() => {
                          const topCategory = topExpenseCategories[0];
                          if (!topCategory) return 'Start tracking expenses to get personalized suggestions.';
                          
                          if (topCategory.remaining && topCategory.remaining < 0) {
                            return `You're over budget in ${topCategory.category_name}. Consider reducing spending or adjusting your budget.`;
                          } else if (topCategory.remaining && topCategory.remaining > topCategory.budget * 0.3) {
                            return `You have $${topCategory.remaining.toFixed(0)} left in ${topCategory.category_name}. Great job staying under budget!`;
                          } else {
                            return `Monitor your ${topCategory.category_name} spending - you're at ${((topCategory.spent / topCategory.budget) * 100).toFixed(0)}% of budget.`;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Budget Health */}
                <div className="rounded-[20px] bg-white p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className={`flex size-10 items-center justify-center rounded-full shrink-0 ${
                      budgetUtilization > 100 ? 'bg-red-100 text-red-500' :
                      budgetUtilization > 80 ? 'bg-yellow-100 text-yellow-500' :
                      'bg-green-100 text-green-500'
                    }`}>
                      <span className="text-xl">
                        {budgetUtilization > 100 ? '⚠️' : budgetUtilization > 80 ? '⚡' : '✅'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">Budget Health</p>
                      <p className="text-sm text-gray-500 mt-1">
                        You've used {budgetUtilization.toFixed(0)}% of your monthly budget.{' '}
                        {budgetUtilization > 100 ? 'You\'re over budget!' :
                         budgetUtilization > 80 ? 'Almost at your limit.' :
                         'You\'re doing great!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Achievements */}
            <section>
              <h2 className="text-black text-[22px] font-bold tracking-[-0.4px] px-2 pb-3">
                Achievements
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
                <AchievementCard
                  icon="🏆"
                  title="Budget Master"
                  description="3 months in a row!"
                  unlocked={budgetUtilization < 100}
                />
                <AchievementCard
                  icon="💰"
                  title="Saving Streak"
                  description="Save $500 to unlock"
                  unlocked={false}
                  progress={75}
                />
                <AchievementCard
                  icon="📊"
                  title="Data Driven"
                  description="Track 50 transactions"
                  unlocked={false}
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="insights" />
    </div>
  );
}

// Donut Chart Component
function DonutChart({ segments }: { segments: any[] }) {
  let cumulativePercentage = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg className="size-full" viewBox="0 0 100 100">
      {/* Background circle */}
      <circle
        className="stroke-gray-100"
        cx="50"
        cy="50"
        fill="none"
        r={radius}
        strokeWidth="10"
      />
      
      {/* Segments */}
      {segments.map((segment, index) => {
        const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
        const strokeDashoffset = circumference - (cumulativePercentage / 100) * circumference;
        const rotation = -90 + (cumulativePercentage / 100) * 360;
        
        cumulativePercentage += segment.percentage;
        
        return (
          <circle
            key={index}
            cx="50"
            cy="50"
            fill="none"
            r={radius}
            stroke={segment.color}
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              transformOrigin: '50% 50%',
              transform: `rotate(${rotation}deg)`
            }}
          />
        );
      })}
    </svg>
  );
}

// Category Insight Row
function CategoryInsightRow({ category, color }: { category: any; color: string }) {
  const overBudget = category.remaining < 0;
  const budgetPercentage = category.budget > 0 ? (category.amount / category.budget) * 100 : 0;

  return (
    <div className="flex items-center gap-4 p-2 -m-2 rounded-lg hover:bg-gray-50 cursor-pointer">
      <div 
        className="flex size-10 items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <span className="text-xl">🛍️</span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <p className="text-black font-semibold">{category.category}</p>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${
              overBudget ? 'text-red-600' : budgetPercentage > 80 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {budgetPercentage.toFixed(0)}%
            </p>
            <span className={`text-base ${
              overBudget ? 'text-red-500' : budgetPercentage > 80 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              {overBudget ? '⚠️' : budgetPercentage > 80 ? '⚡' : '✅'}
            </span>
            <p className="text-black font-semibold">${category.amount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="h-2 rounded-full bg-gray-200 w-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000"
            style={{ 
              width: `${Math.min(budgetPercentage, 100)}%`,
              backgroundColor: color 
            }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className={`text-xs ${overBudget ? 'text-red-500' : 'text-gray-500'}`}>
            ${category.amount.toLocaleString()} / ${category.budget.toLocaleString()}
            {overBudget && ` (Over by $${Math.abs(category.remaining).toLocaleString()})`}
          </p>
        </div>
      </div>
    </div>
  );
}

// Achievement Card
function AchievementCard({ 
  icon, 
  title, 
  description, 
  unlocked, 
  progress 
}: {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
}) {
  return (
    <div className={`flex flex-col items-center text-center p-3 rounded-[20px] shadow-sm border border-gray-100 transition-transform ${
      unlocked ? 'bg-white hover:scale-105' : 'bg-gray-100'
    }`}>
      <div className="relative mb-2">
        {progress !== undefined && !unlocked ? (
          <div className="size-10 relative">
            <svg className="size-full" viewBox="0 0 36 36">
              <circle
                className="stroke-gray-200"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeWidth="3.5"
              />
              <circle
                className="stroke-blue-500 transition-all duration-1000"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeWidth="3.5"
                strokeDasharray="100"
                strokeDashoffset={100 - progress}
                style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
              />
            </svg>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl opacity-50">
              {icon}
            </span>
          </div>
        ) : (
          <span className={`text-4xl ${unlocked ? '' : 'opacity-50'}`}>{icon}</span>
        )}
      </div>
      
      <p className={`font-bold text-sm leading-tight ${unlocked ? 'text-black' : 'text-gray-500'}`}>
        {title}
      </p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
      
      {progress !== undefined && !unlocked && (
        <div className="w-full bg-gray-200 rounded-full h-1 mt-2 overflow-hidden">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Bottom Navigation
function BottomNavigation({ currentPage }: { currentPage: string }) {
  const router = useRouter();

  const navItems = [
    { icon: '🏠', label: 'Home', page: 'home', href: '/dashboard' },
    { icon: '📊', label: 'Insights', page: 'insights', href: '/insights' },
    { icon: '+', label: 'Add', page: 'add', href: '/transactions/new', isButton: true },
    { icon: '💳', label: 'Accounts', page: 'accounts', href: '/accounts' },
    { icon: '⚙️', label: 'Settings', page: 'settings', href: '/settings' },
  ];

  return (
    <footer className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80">
      <nav className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => (
          item.isButton ? (
            <div key={item.page} className="w-16 h-16 flex items-center justify-center">
              <button
                onClick={() => router.push(item.href)}
                className="flex items-center justify-center size-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 transition-transform hover:scale-105 active:scale-95"
              >
                <span className="text-3xl">{item.icon}</span>
              </button>
            </div>
          ) : (
            <button
              key={item.page}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-16 transition-colors ${
                currentPage === item.page ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <p className={`text-xs ${currentPage === item.page ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </p>
            </button>
          )
        ))}
      </nav>
    </footer>
  );
}

// Loading Skeletons
function InsightsSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-4">
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-[20px] animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-[20px] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightsContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 bg-gray-200 rounded-[20px] animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-[20px] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-[20px] animate-pulse" />
        ))}
      </div>
    </div>
  );
}