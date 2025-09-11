// pages/insights.tsx - Enhanced with interactive charts and analytics
import React, { useState, useMemo, useEffect } from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { useHousehold } from '../hooks/useHousehold';
import { useCategorySummary } from '../hooks/useCategorySummary';
import { useMonth } from '../hooks/useMonth';
import { formatCurrency, getCurrencyFromHousehold } from '../lib/utils';
import { authenticatedFetch } from '../lib/api';
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
  ShoppingBag
} from 'lucide-react';

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
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-sm text-gray-600 mt-1">Financial analytics and trends</p>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-gray-900 min-w-[120px] text-center">{monthDisplay}</span>
          <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpent, currency)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget Used</p>
              <p className={`text-xl font-bold ${budgetUsed > 100 ? 'text-red-600' : budgetUsed > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                {Math.round(budgetUsed)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-xl font-bold text-gray-900">
                {transactions.filter(t => t.occurred_at.startsWith(currentMonth)).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Daily</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalSpent / new Date().getDate(), currency)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart Selection Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'category', label: 'Categories', icon: PieChartIcon },
          { key: 'trends', label: 'Trends', icon: Activity },
          { key: 'merchant', label: 'Merchants', icon: ShoppingBag },
          { key: 'comparison', label: 'Daily', icon: BarChart3 }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveChart(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeChart === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Dynamic Chart Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-6">
          {activeChart === 'category' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No spending data available
                </div>
              )}
            </>
          )}

          {activeChart === 'trends' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="spending" stackId="1" stroke="#EF4444" fill="#FEE2E2" name="Spending" />
                  <Area type="monotone" dataKey="income" stackId="2" stroke="#10B981" fill="#DCFCE7" name="Income" />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}

          {activeChart === 'merchant' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Merchants</h3>
              {merchantData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={merchantData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                    <YAxis dataKey="merchant" type="category" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No merchant data available
                </div>
              )}
            </>
          )}

          {activeChart === 'comparison' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Spending Pattern</h3>
              {dailySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No daily spending data available
                </div>
              )}
            </>
          )}
        </Card>

        {/* Side Panel - Category Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Details</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{category.icon}</span>
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                      {category.budget > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min((category.value / category.budget) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(category.value, currency)}</p>
                    {category.budget > 0 && (
                      <p className="text-xs text-gray-500">
                        {Math.round((category.value / category.budget) * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No category data available</p>
          )}
        </Card>
      </div>

      {/* Budget Progress */}
      {totalBudget > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Monthly Budget</span>
              <span className="font-semibold">{formatCurrency(totalBudget, currency)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  budgetUsed > 100 ? 'bg-red-500' : budgetUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Spent: {formatCurrency(totalSpent, currency)}
              </span>
              <span className={`font-medium ${budgetUsed > 100 ? 'text-red-600' : 'text-green-600'}`}>
                {budgetUsed > 100 
                  ? `${formatCurrency(totalSpent - totalBudget, currency)} over budget`
                  : `${formatCurrency(totalBudget - totalSpent, currency)} remaining`
                }
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function InsightsPage() {
  return (
    <AuthWrapper>
      <AppLayout title="Insights">
        <InsightsContent />
      </AppLayout>
    </AuthWrapper>
  );
}
