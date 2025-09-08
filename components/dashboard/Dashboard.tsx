import React, { useState, useEffect } from 'react';
import { 
  Home, 
  BarChart3, 
  Plus, 
  Wallet, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Search,
  DollarSign,
  ShoppingBag,
  Car,
  Coffee,
  Zap,
  Building,
  Film,
  MoreHorizontal,
  Bell,
  User,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  PieChart
} from 'lucide-react';

// Mock data - replace with actual API calls
const mockData = {
  user: {
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  budget: {
    total: 2000,
    spent: 1247,
    remaining: 753,
    percentage: 62.4
  },
  burnRate: {
    dailyAverage: 45,
    dailyBudget: 42,
    projectedSpend: 1950,
    remainingDays: 12
  },
  categories: [
    { id: 1, name: "Groceries", spent: 420, budget: 500, icon: ShoppingBag, color: "bg-blue-500" },
    { id: 2, name: "Dining Out", spent: 380, budget: 300, icon: Coffee, color: "bg-green-500" },
    { id: 3, name: "Transport", spent: 240, budget: 350, icon: Car, color: "bg-orange-500" },
    { id: 4, name: "Utilities", spent: 207, budget: 200, icon: Zap, color: "bg-purple-500" }
  ],
  transactions: [
    { id: 1, merchant: "Whole Foods", category: "Groceries", amount: -75.50, date: "2025-01-09", icon: ShoppingBag },
    { id: 2, merchant: "Starbucks", category: "Dining Out", amount: -12.50, date: "2025-01-09", icon: Coffee },
    { id: 3, merchant: "Uber", category: "Transport", amount: -18.75, date: "2025-01-08", icon: Car },
    { id: 4, merchant: "Netflix", category: "Entertainment", amount: -15.99, date: "2025-01-08", icon: Film }
  ]
};

const ExpenseTracker = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { id: 1, name: "Groceries", icon: ShoppingBag, color: "bg-blue-100 text-blue-600" },
    { id: 2, name: "Dining Out", icon: Coffee, color: "bg-green-100 text-green-600" },
    { id: 3, name: "Transport", icon: Car, color: "bg-orange-100 text-orange-600" },
    { id: 4, name: "Utilities", icon: Zap, color: "bg-purple-100 text-purple-600" },
    { id: 5, name: "Entertainment", icon: Film, color: "bg-pink-100 text-pink-600" },
    { id: 6, name: "Shopping", icon: ShoppingBag, color: "bg-indigo-100 text-indigo-600" }
  ];

  const quickAmounts = [5, 10, 25, 50];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const BudgetCircle = ({ percentage, spent, total }) => {
    const circumference = 2 * Math.PI * 40;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-light text-gray-900">${spent}</span>
          <span className="text-sm text-gray-500">of ${total}</span>
        </div>
      </div>
    );
  };

  const AddExpenseModal = () => {
    if (!showAddExpense) return null;

    return (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
          
          {/* Amount Input */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center">
              <span className="text-4xl text-gray-400 mr-2">$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="text-5xl font-light text-center border-none outline-none bg-transparent placeholder-gray-400 w-48"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex justify-center gap-2 mb-6">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* Description Input */}
          <div className="mb-6">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Note (e.g., Starbucks coffee)"
              className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none text-gray-700 placeholder-gray-500"
            />
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Categories</h3>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory?.id === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                      isSelected 
                        ? 'bg-blue-50 ring-2 ring-blue-500' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddExpense(false)}
              className="flex-1 py-4 text-gray-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle add expense
                setShowAddExpense(false);
                setAmount('');
                setDescription('');
                setSelectedCategory(null);
              }}
              className="flex-2 py-4 px-8 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Expense
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HomeTab = () => (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={mockData.user.avatar}
              alt="User avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm text-gray-500 font-medium">Hello,</p>
              <p className="font-bold text-gray-900 text-lg">{mockData.user.name}</p>
            </div>
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Budget Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-center mb-6">Budget Overview</h2>
          <BudgetCircle
            percentage={mockData.budget.percentage}
            spent={mockData.budget.spent}
            total={mockData.budget.total}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-500">Daily Average</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">${mockData.burnRate.dailyAverage}/day</p>
            <p className="text-xs text-gray-500">vs ${mockData.burnRate.dailyBudget}/day budget</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Projected Spend</h3>
            <p className="text-2xl font-bold text-gray-900">${mockData.burnRate.projectedSpend}</p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(mockData.burnRate.projectedSpend / mockData.budget.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Categories</h3>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {mockData.categories.map((category) => {
              const Icon = category.icon;
              const percentage = (category.spent / category.budget) * 100;
              const isOverBudget = percentage > 100;
              
              return (
                <div key={category.id} className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${category.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className="font-bold text-gray-900">${category.spent}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">${category.spent} / ${category.budget}</span>
                      {isOverBudget && (
                        <span className="text-xs text-red-500 font-medium">
                          Over by ${category.spent - category.budget}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Recent Transactions</h3>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {mockData.transactions.map((transaction) => {
              const Icon = transaction.icon;
              return (
                <div key={transaction.id} className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-xl">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{transaction.merchant}</p>
                    <p className="text-sm text-gray-500">{transaction.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(transaction.amount)}</p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );

  const InsightsTab = () => (
    <div className="flex-1 overflow-y-auto">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4">
        <h1 className="text-2xl font-bold text-center">Insights</h1>
      </header>
      
      <main className="p-4 space-y-6">
        {/* Spending Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Spending Breakdown</h3>
          <div className="flex items-center justify-center h-40">
            <PieChart className="w-24 h-24 text-gray-300" />
          </div>
          <div className="text-center mt-4">
            <p className="text-2xl font-bold">${mockData.budget.spent}</p>
            <p className="text-sm text-gray-500">This month</p>
          </div>
        </div>

        {/* Insights Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Spending Velocity</h4>
                <p className="text-sm text-gray-600 mt-1">
                  You're spending 15% faster this month. Consider reviewing your dining out expenses.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Smart Suggestion</h4>
                <p className="text-sm text-gray-600 mt-1">
                  You've saved $80 on groceries. Consider moving that to your emergency fund!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const Navigation = () => (
    <nav className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'home' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Home</span>
        </button>
        
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'insights' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs font-medium">Insights</span>
        </button>
        
        <button
          onClick={() => setShowAddExpense(true)}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors -mt-6"
        >
          <Plus className="w-7 h-7" />
        </button>
        
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'accounts' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-xs font-medium">Accounts</span>
        </button>
        
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      {activeTab === 'home' && <HomeTab />}
      {activeTab === 'insights' && <InsightsTab />}
      {activeTab === 'accounts' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Accounts tab coming soon...</p>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Settings tab coming soon...</p>
        </div>
      )}
      
      <Navigation />
      <AddExpenseModal />
      
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ExpenseTracker;