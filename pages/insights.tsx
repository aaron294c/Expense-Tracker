// pages/insights.tsx - Enhanced with interactive charts and analytics
import React, { useState, useMemo, useEffect } from 'react';
import { Screen } from '../components/_layout/Screen';
import { BottomDock } from '../components/navigation/BottomDock';
import { StatGrid } from '../components/layout/StatGrid';
import { StatCard } from '../components/mobile/StatCard';
import { MonthPickerPill } from '../components/ui/MonthPickerPill';
import { Card } from '../components/ui/Card';
import { useHousehold } from '../hooks/useHousehold';
import { useCategorySummary } from '../hooks/useCategorySummary';
import { useMonth } from '../hooks/useMonth';
import { formatCurrency, getCurrencyFromHousehold } from '../lib/utils';
import { authenticatedFetch } from '../lib/api';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Zap,
  Target,
  ShoppingBag,
  Settings
} from 'lucide-react';
import Link from 'next/link';

const CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

function InsightsContent() {
  const { currentHousehold } = useHousehold();
  const currency = getCurrencyFromHousehold(currentHousehold || {}, 'USD');
  const { currentMonth, monthDisplay, goToPreviousMonth, goToNextMonth } = useMonth();

  const [activeChart, setActiveChart] = useState<'category' | 'trends' | 'merchant' | 'comparison'>('category');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { summaries, getTotalSpent, getTotalBudget } = useCategorySummary(
    currentHousehold?.id || null,
    currentMonth
  );

  // Fetch transaction data for advanced analytics
  useEffect(() => {
    if (currentHousehold?.id) {
      setLoading(true);
      // Add a small delay to ensure session is available
      setTimeout(() => {
        authenticatedFetch(`/api/transactions?household_id=${currentHousehold.id}&limit=1000`)
          .then(data => {
            setTransactions(data.data || []);
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching transactions:', err);
            setLoading(false);
          });
      }, 100);
    }
  }, [currentHousehold?.id, currentMonth]);

  const totalSpent = getTotalSpent();
  const totalBudget = getTotalBudget();
  const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Prepare category data for pie chart
  const categoryData = useMemo(() => {
    return summaries
      .filter(s => s.category_kind === 'expense' && s.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 8)
      .map((category, index) => ({
        name: category.category_name,
        value: category.spent,
        color: CHART_COLORS[index % CHART_COLORS.length],
        budget: category.budget,
        icon: category.icon
      }));
  }, [summaries]);

  // Prepare spending trends data
  const trendsData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTransactions = transactions.filter(t => 
        t.direction === 'outflow' && t.occurred_at.startsWith(monthKey)
      );
      
      const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = transactions
        .filter(t => t.direction === 'inflow' && t.occurred_at.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0);

      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        spending: totalSpent,
        income: totalIncome,
        net: totalIncome - totalSpent
      });
    }
    return last6Months;
  }, [transactions]);

  // Prepare merchant data
  const merchantData = useMemo(() => {
    const merchantTotals = new Map();
    
    transactions
      .filter(t => t.direction === 'outflow' && t.merchant)
      .forEach(t => {
        const current = merchantTotals.get(t.merchant) || 0;
        merchantTotals.set(t.merchant, current + t.amount);
      });

    return Array.from(merchantTotals.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([merchant, amount]) => ({ merchant, amount }));
  }, [transactions]);

  // Daily spending comparison
  const dailySpending = useMemo(() => {
    const dailyData = new Map();
    const currentMonthTransactions = transactions.filter(t => 
      t.direction === 'outflow' && t.occurred_at.startsWith(currentMonth)
    );

    currentMonthTransactions.forEach(t => {
      const day = new Date(t.occurred_at).getDate();
      const current = dailyData.get(day) || 0;
      dailyData.set(day, current + t.amount);
    });

    const result = [];
    for (let day = 1; day <= 31; day++) {
      if (dailyData.has(day)) {
        result.push({ day, amount: dailyData.get(day) });
      }
    }
    return result.sort((a, b) => a.day - b.day);
  }, [transactions, currentMonth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-lg">{data.icon}</div>
            <p className="font-medium">{data.name}</p>
          </div>
          <p className="text-sm">Amount: {formatCurrency(data.value, currency)}</p>
          {data.budget > 0 && (
            <p className="text-xs text-gray-500">
              {Math.round((data.value / data.budget) * 100)}% of budget
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Financial Insights</h1>
          <p className="text-base text-gray-600 mt-1">Understand your spending patterns and trends</p>
        </div>
        <Link href="/settings" className="p-3 hover:bg-gray-100/80 rounded-full transition-all">
          <Settings className="w-6 h-6 text-gray-600" />
        </Link>
      </div>

      {/* Month Navigation */}
      <MonthPickerPill
        label={monthDisplay}
        onPrev={goToPreviousMonth}
        onNext={goToNextMonth}
      />

      {/* Enhanced Insights Overview */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
          <div className="size-12 rounded-full grid place-items-center bg-blue-50 text-blue-600 mb-4">
            <DollarSign size={24} />
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Total Spent</div>
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{formatCurrency(totalSpent, currency)}</div>
          <div className="text-sm text-gray-500 mt-1">This month</div>
        </div>
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
          <div className={`size-12 rounded-full grid place-items-center mb-4 ${
            budgetUsed > 100 ? 'bg-red-50 text-red-600' :
            budgetUsed > 80 ? 'bg-orange-50 text-orange-600' :
            'bg-green-50 text-green-600'
          }`}>
            <Target size={24} />
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Budget Used</div>
          <div className={`text-2xl font-semibold tabular-nums ${
            budgetUsed > 100 ? 'text-red-600' :
            budgetUsed > 80 ? 'text-orange-600' :
            'text-green-600'
          }`}>{Math.round(budgetUsed)}%</div>
          <div className="text-sm text-gray-500 mt-1">
            {budgetUsed > 100 ? 'Over budget' : 'On track'}
          </div>
        </div>
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
          <div className="size-12 rounded-full grid place-items-center bg-purple-50 text-purple-600 mb-4">
            <Activity size={24} />
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Transactions</div>
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{transactions.filter(t => t.occurred_at.startsWith(currentMonth)).length}</div>
          <div className="text-sm text-gray-500 mt-1">This month</div>
        </div>
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
          <div className="size-12 rounded-full grid place-items-center bg-emerald-50 text-emerald-600 mb-4">
            <Zap size={24} />
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Daily Average</div>
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{formatCurrency(totalSpent / new Date().getDate(), currency)}</div>
          <div className="text-sm text-gray-500 mt-1">Per day</div>
        </div>
      </div>

      {/* Enhanced Segmented Control */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
        <div className="inline-flex rounded-2xl bg-gray-100/80 p-1.5 border border-gray-200/50">
          {[
            { key: 'category', label: 'Categories', icon: PieChartIcon },
            { key: 'trends', label: 'Trends', icon: TrendingUp },
            { key: 'merchant', label: 'Merchants', icon: ShoppingBag },
            { key: 'comparison', label: 'Daily', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveChart(key as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                activeChart === key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Chart Section */}
      <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
        {activeChart === 'category' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Spending by Category</h3>
              {categoryData.length > 0 && (
                <div className="text-sm text-gray-500">
                  {categoryData.length} categories
                </div>
              )}
            </div>
            {categoryData.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category Legend */}
                <div className="grid grid-cols-2 gap-3">
                  {categoryData.map((category, index) => (
                    <div key={category.name} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-lg">{category.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(category.value, currency)} • {((category.value / totalSpent) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="size-16 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4">
                  <PieChartIcon size={32} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Category Data</h4>
                <p className="text-gray-600">Start adding transactions to see your spending breakdown</p>
              </div>
            )}
          </>
        )}

        {activeChart === 'trends' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">6-Month Financial Trends</h3>
              <div className="text-sm text-gray-500">
                Last 6 months
              </div>
            </div>
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value}`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fill="url(#spendingGradient)"
                    name="Spending"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Trend Analysis */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={20} className="text-green-600" />
                    <span className="text-sm font-medium text-green-900">Average Income</span>
                  </div>
                  <div className="text-lg font-semibold text-green-800">
                    {formatCurrency(trendsData.reduce((sum, month) => sum + month.income, 0) / trendsData.length, currency)}
                  </div>
                </div>
                <div className="p-4 bg-red-50/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={20} className="text-red-600" />
                    <span className="text-sm font-medium text-red-900">Average Spending</span>
                  </div>
                  <div className="text-lg font-semibold text-red-800">
                    {formatCurrency(trendsData.reduce((sum, month) => sum + month.spending, 0) / trendsData.length, currency)}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeChart === 'merchant' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Top Merchants</h3>
              {merchantData.length > 0 && (
                <div className="text-sm text-gray-500">
                  Top {merchantData.length} merchants
                </div>
              )}
            </div>
            {merchantData.length > 0 ? (
              <div className="space-y-6">
                {/* Merchant List with Visual Bars */}
                <div className="space-y-3">
                  {merchantData.map((merchant, index) => {
                    const percentage = (merchant.amount / merchantData[0].amount) * 100;
                    return (
                      <div key={merchant.merchant} className="p-4 bg-gray-50/50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-blue-100 grid place-items-center text-blue-600 text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900 truncate">{merchant.merchant}</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(merchant.amount, currency)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {((merchant.amount / totalSpent) * 100).toFixed(1)}% of total spending
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Merchant Insights */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-full bg-blue-500 grid place-items-center text-white text-lg flex-shrink-0">
                      💡
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Spending Insight</h4>
                      <p className="text-sm text-blue-700">
                        Your top 3 merchants account for {formatCurrency(merchantData.slice(0, 3).reduce((sum, m) => sum + m.amount, 0), currency)}
                        ({((merchantData.slice(0, 3).reduce((sum, m) => sum + m.amount, 0) / totalSpent) * 100).toFixed(0)}%) of your total spending.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="size-16 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4">
                  <ShoppingBag size={32} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Merchant Data</h4>
                <p className="text-gray-600">Add merchant names to your transactions to see where you spend most</p>
              </div>
            )}
          </>
        )}

        {activeChart === 'comparison' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Daily Spending Pattern</h3>
              <div className="text-sm text-gray-500">
                {monthDisplay}
              </div>
            </div>
            {dailySpending.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySpending} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value}`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Daily Insights */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-6 rounded-full bg-purple-500 grid place-items-center text-white text-xs">📊</div>
                      <span className="text-sm font-medium text-purple-900">Highest Day</span>
                    </div>
                    <div className="text-lg font-semibold text-purple-800">
                      Day {dailySpending.reduce((max, day) => day.amount > max.amount ? day : max).day}: {formatCurrency(dailySpending.reduce((max, day) => day.amount > max.amount ? day : max).amount, currency)}
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-6 rounded-full bg-indigo-500 grid place-items-center text-white text-xs">📈</div>
                      <span className="text-sm font-medium text-indigo-900">Days Active</span>
                    </div>
                    <div className="text-lg font-semibold text-indigo-800">
                      {dailySpending.length} of {new Date().getDate()} days
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="size-16 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4">
                  <BarChart3 size={32} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Daily Data</h4>
                <p className="text-gray-600">Add some transactions to see your daily spending patterns</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Smart Financial Insights */}
      {transactions.length > 0 && (
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Financial Insights</h3>
          <div className="space-y-4">
            {/* Budget Performance */}
            {totalBudget > 0 && (
              <div className={`p-4 rounded-xl border ${
                budgetUsed > 100 ? 'bg-red-50/50 border-red-200/50' :
                budgetUsed > 80 ? 'bg-orange-50/50 border-orange-200/50' :
                'bg-green-50/50 border-green-200/50'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`size-8 rounded-full grid place-items-center text-lg flex-shrink-0 ${
                    budgetUsed > 100 ? 'bg-red-100 text-red-600' :
                    budgetUsed > 80 ? 'bg-orange-100 text-orange-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {budgetUsed > 100 ? '⚠️' : budgetUsed > 80 ? '⚡' : '✅'}
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium mb-1 ${
                      budgetUsed > 100 ? 'text-red-900' :
                      budgetUsed > 80 ? 'text-orange-900' :
                      'text-green-900'
                    }`}>
                      {budgetUsed > 100 ? 'Over Budget Alert' :
                       budgetUsed > 80 ? 'Approaching Budget Limit' :
                       'Budget on Track'}
                    </h4>
                    <p className={`text-sm ${
                      budgetUsed > 100 ? 'text-red-700' :
                      budgetUsed > 80 ? 'text-orange-700' :
                      'text-green-700'
                    }`}>
                      {budgetUsed > 100
                        ? `You've exceeded your budget by ${formatCurrency(totalSpent - totalBudget, currency)}. Consider reviewing your spending.`
                        : budgetUsed > 80
                        ? `You've used ${Math.round(budgetUsed)}% of your budget. You have ${formatCurrency(totalBudget - totalSpent, currency)} remaining.`
                        : `Great job! You're using ${Math.round(budgetUsed)}% of your budget with ${formatCurrency(totalBudget - totalSpent, currency)} remaining.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Spending Pattern Insight */}
            {categoryData.length > 0 && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-blue-500 grid place-items-center text-white text-lg flex-shrink-0">
                    📊
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Spending Pattern</h4>
                    <p className="text-sm text-blue-700">
                      Your largest expense category is <strong>{categoryData[0].name}</strong> at {formatCurrency(categoryData[0].value, currency)}
                      ({((categoryData[0].value / totalSpent) * 100).toFixed(0)}% of total spending).
                      {categoryData.length > 1 && (
                        <> Your top 3 categories account for {((categoryData.slice(0, 3).reduce((sum, cat) => sum + cat.value, 0) / totalSpent) * 100).toFixed(0)}% of your spending.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Frequency */}
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/50">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-purple-500 grid place-items-center text-white text-lg flex-shrink-0">
                  📈
                </div>
                <div>
                  <h4 className="text-sm font-medium text-purple-900 mb-1">Activity Level</h4>
                  <p className="text-sm text-purple-700">
                    You've made {transactions.filter(t => t.occurred_at.startsWith(currentMonth)).length} transactions this month
                    (avg {(transactions.filter(t => t.occurred_at.startsWith(currentMonth)).length / new Date().getDate()).toFixed(1)} per day).
                    Your average transaction amount is {formatCurrency(totalSpent / transactions.filter(t => t.occurred_at.startsWith(currentMonth) && t.direction === 'outflow').length || 0, currency)}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      {transactions.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Smart Recommendations</h3>
          <div className="space-y-4">
            {/* Budget recommendation */}
            {budgetUsed > 90 && (
              <div className="flex items-start gap-3 p-4 bg-white/70 rounded-xl">
                <div className="size-8 rounded-full bg-orange-500 grid place-items-center text-white text-lg flex-shrink-0">
                  🎯
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Budget Alert</h4>
                  <p className="text-sm text-gray-700">
                    Consider reducing spending in your top categories for the rest of the month.
                  </p>
                </div>
              </div>
            )}

            {/* Savings opportunity */}
            {categoryData.length > 0 && categoryData[0].value > totalSpent * 0.4 && (
              <div className="flex items-start gap-3 p-4 bg-white/70 rounded-xl">
                <div className="size-8 rounded-full bg-green-500 grid place-items-center text-white text-lg flex-shrink-0">
                  💡
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Savings Opportunity</h4>
                  <p className="text-sm text-gray-700">
                    {categoryData[0].name} represents a large portion of your spending. Consider setting a specific budget for this category.
                  </p>
                </div>
              </div>
            )}

            {/* Transaction frequency insight */}
            {transactions.filter(t => t.occurred_at.startsWith(currentMonth)).length > 50 && (
              <div className="flex items-start gap-3 p-4 bg-white/70 rounded-xl">
                <div className="size-8 rounded-full bg-blue-500 grid place-items-center text-white text-lg flex-shrink-0">
                  📱
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">High Activity</h4>
                  <p className="text-sm text-gray-700">
                    You have many small transactions. Consider consolidating purchases to reduce fees and improve tracking.
                  </p>
                </div>
              </div>
            )}

            {/* General tip */}
            <div className="flex items-start gap-3 p-4 bg-white/70 rounded-xl">
              <div className="size-8 rounded-full bg-purple-500 grid place-items-center text-white text-lg flex-shrink-0">
                ⭐
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Pro Tip</h4>
                <p className="text-sm text-gray-700">
                  Review your insights weekly to spot trends early and make informed financial decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const { currentHousehold } = useHousehold();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  const handleAddTransaction = () => {
    setShowAddTransaction(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Screen>
        <InsightsContent />
      </Screen>

      <BottomDock onAdd={handleAddTransaction} />

      {currentHousehold && (
        <AddTransactionModal
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          householdId={currentHousehold.id}
          onSuccess={() => setShowAddTransaction(false)}
        />
      )}
    </div>
  );
}
