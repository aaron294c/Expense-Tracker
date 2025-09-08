import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  X,
  Check,
  Loader2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  Coffee,
  Car,
  Zap,
  Film,
  Home,
  CreditCard,
  Smartphone,
  MoreHorizontal
} from 'lucide-react';

const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    account: '',
    dateRange: 'all'
  });

  // New Transaction Form State
  const [newTransaction, setNewTransaction] = useState({
    account_id: '',
    description: '',
    merchant: '',
    amount: '',
    direction: 'outflow',
    occurred_at: new Date().toISOString().split('T')[0],
    categories: []
  });

  const categoryIcons = {
    'Groceries': ShoppingBag,
    'Dining Out': Coffee,
    'Transport': Car,
    'Utilities': Zap,
    'Entertainment': Film,
    'Rent': Home,
    'Shopping': ShoppingBag,
    'Bills': CreditCard,
    'Technology': Smartphone
  };

  const categoryColors = {
    'Groceries': 'bg-blue-500',
    'Dining Out': 'bg-green-500',
    'Transport': 'bg-orange-500',
    'Utilities': 'bg-purple-500',
    'Entertainment': 'bg-pink-500',
    'Rent': 'bg-red-500',
    'Shopping': 'bg-indigo-500',
    'Bills': 'bg-yellow-500',
    'Technology': 'bg-teal-500'
  };

  // Simulate API calls - replace with actual API integration
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data that would come from your API
        const mockTransactions = [
          {
            id: '1',
            description: 'Whole Foods Market',
            merchant: 'Whole Foods',
            amount: 87.34,
            direction: 'outflow',
            occurred_at: '2025-01-09T10:30:00Z',
            account_name: 'Checking',
            categories: [{ category_name: 'Groceries', weight: 1.0 }],
            primary_category_name: 'Groceries'
          },
          {
            id: '2',
            description: 'Starbucks Coffee',
            merchant: 'Starbucks',
            amount: 12.50,
            direction: 'outflow',
            occurred_at: '2025-01-09T08:15:00Z',
            account_name: 'Credit Card',
            categories: [{ category_name: 'Dining Out', weight: 1.0 }],
            primary_category_name: 'Dining Out'
          },
          {
            id: '3',
            description: 'Uber Ride',
            merchant: 'Uber',
            amount: 18.75,
            direction: 'outflow',
            occurred_at: '2025-01-08T19:45:00Z',
            account_name: 'Checking',
            categories: [{ category_name: 'Transport', weight: 1.0 }],
            primary_category_name: 'Transport'
          },
          {
            id: '4',
            description: 'Salary Deposit',
            merchant: 'ACME Corp',
            amount: 3500.00,
            direction: 'inflow',
            occurred_at: '2025-01-08T00:00:00Z',
            account_name: 'Checking',
            categories: [{ category_name: 'Income', weight: 1.0 }],
            primary_category_name: 'Income'
          }
        ];

        const mockCategories = [
          { id: '1', name: 'Groceries', kind: 'expense', icon: 'shopping_bag', color: '#3B82F6' },
          { id: '2', name: 'Dining Out', kind: 'expense', icon: 'coffee', color: '#10B981' },
          { id: '3', name: 'Transport', kind: 'expense', icon: 'car', color: '#F59E0B' },
          { id: '4', name: 'Utilities', kind: 'expense', icon: 'zap', color: '#8B5CF6' },
          { id: '5', name: 'Entertainment', kind: 'expense', icon: 'film', color: '#EC4899' },
          { id: '6', name: 'Income', kind: 'income', icon: 'trending_up', color: '#10B981' }
        ];

        const mockAccounts = [
          { id: '1', name: 'Checking', type: 'current', current_balance: 2345.67 },
          { id: '2', name: 'Savings', type: 'savings', current_balance: 15678.90 },
          { id: '3', name: 'Credit Card', type: 'credit', current_balance: -1234.56 }
        ];

        setTransactions(mockTransactions);
        setCategories(mockCategories);
        setAccounts(mockAccounts);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.account_id || !newTransaction.description || !newTransaction.amount) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const transaction = {
        id: Date.now().toString(),
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        occurred_at: new Date().toISOString(),
        account_name: accounts.find(a => a.id === newTransaction.account_id)?.name || 'Unknown',
        categories: newTransaction.categories.length > 0 ? newTransaction.categories : [],
        primary_category_name: newTransaction.categories[0]?.category_name || 'Uncategorized'
      };

      setTransactions(prev => [transaction, ...prev]);
      setShowAddTransaction(false);
      setNewTransaction({
        account_id: '',
        description: '',
        merchant: '',
        amount: '',
        direction: 'outflow',
        occurred_at: new Date().toISOString().split('T')[0],
        categories: []
      });
      setError('');
    } catch (err) {
      setError('Failed to add transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !filters.search || 
      transaction.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      (transaction.merchant && transaction.merchant.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesCategory = !filters.category || 
      transaction.primary_category_name === filters.category;
    
    const matchesAccount = !filters.account || 
      transaction.account_name === filters.account;

    return matchesSearch && matchesCategory && matchesAccount;
  });

  const AddTransactionModal = () => {
    if (!showAddTransaction) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Add Transaction</h2>
            <button
              onClick={() => setShowAddTransaction(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account *
              </label>
              <select
                value={newTransaction.account_id}
                onChange={(e) => setNewTransaction(prev => ({...prev, account_id: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTransaction(prev => ({...prev, direction: 'outflow'}))}
                  className={`flex-1 p-3 rounded-lg font-medium transition-colors ${
                    newTransaction.direction === 'outflow'
                      ? 'bg-red-100 text-red-700 border-2 border-red-200'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                  Expense
                </button>
                <button
                  onClick={() => setNewTransaction(prev => ({...prev, direction: 'inflow'}))}
                  className={`flex-1 p-3 rounded-lg font-medium transition-colors ${
                    newTransaction.direction === 'inflow'
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                  Income
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({...prev, amount: e.target.value}))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction(prev => ({...prev, description: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What was this for?"
              />
            </div>

            {/* Merchant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merchant
              </label>
              <input
                type="text"
                value={newTransaction.merchant}
                onChange={(e) => setNewTransaction(prev => ({...prev, merchant: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Store or company name"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories
                  .filter(cat => newTransaction.direction === 'outflow' ? cat.kind === 'expense' : cat.kind === 'income')
                  .map(category => {
                    const Icon = categoryIcons[category.name] || MoreHorizontal;
                    const isSelected = newTransaction.categories.some(c => c.category_id === category.id);
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewTransaction(prev => ({
                              ...prev,
                              categories: prev.categories.filter(c => c.category_id !== category.id)
                            }));
                          } else {
                            setNewTransaction(prev => ({
                              ...prev,
                              categories: [{
                                category_id: category.id,
                                category_name: category.name,
                                weight: 1.0
                              }]
                            }));
                          }
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-blue-50 ring-2 ring-blue-500 text-blue-700'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">{category.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={newTransaction.occurred_at}
                onChange={(e) => setNewTransaction(prev => ({...prev, occurred_at: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowAddTransaction(false)}
              className="flex-1 py-3 text-gray-600 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTransaction}
              disabled={isLoading}
              className="flex-2 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Transaction'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={filters.account}
              onChange={(e) => setFilters(prev => ({...prev, account: e.target.value}))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.category || filters.account
                ? 'Try adjusting your filters'
                : 'Start by adding your first transaction'
              }
            </p>
            <button
              onClick={() => setShowAddTransaction(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map(transaction => {
              const Icon = categoryIcons[transaction.primary_category_name] || MoreHorizontal;
              const color = categoryColors[transaction.primary_category_name] || 'bg-gray-500';
              
              return (
                <div key={transaction.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-semibold text-gray-900">{transaction.description}</p>
                          {transaction.merchant && (
                            <p className="text-sm text-gray-500">{transaction.merchant}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.direction === 'inflow' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.direction === 'inflow' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.account_name}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {transaction.primary_category_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(transaction.occurred_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddTransactionModal />
    </div>
  );
};

export default TransactionManager;