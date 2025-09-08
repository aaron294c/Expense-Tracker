import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Home, 
  BarChart3, 
  Plus, 
  Wallet, 
  Settings, 
  Bell,
  User,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Menu,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Search
} from 'lucide-react';

// Mock authentication and data management
const AppContext = createContext();

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentHousehold, setCurrentHousehold] = useState(null);
  const [households, setHouseholds] = useState([]);

  // Simulate authentication check
  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      setUser({
        id: '1',
        email: 'user@example.com',
        name: 'Alex Johnson',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      });
      
      // Mock household data
      const mockHouseholds = [
        { id: '1', name: 'Personal Budget', role: 'owner' },
        { id: '2', name: 'Family Budget', role: 'editor' }
      ];
      setHouseholds(mockHouseholds);
      setCurrentHousehold(mockHouseholds[0]);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setCurrentHousehold(null);
    setHouseholds([]);
    setIsLoading(false);
  };

  const value = {
    user,
    currentHousehold,
    households,
    isLoading,
    signOut,
    setCurrentHousehold
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Notification system
const NotificationContext = createContext();

const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      type: 'info',
      duration: 4000,
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border max-w-sm animate-slide-in ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {notification.type === 'warning' && <AlertCircle className="w-5 h-5" />}
              {notification.type === 'info' && <Bell className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              {notification.title && (
                <h4 className="font-semibold text-sm">{notification.title}</h4>
              )}
              <p className="text-sm">{notification.message}</p>
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Header component
const AppHeader = ({ title, showMenu = false, onMenuClick }) => {
  const { user, currentHousehold, households, setCurrentHousehold } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHouseholdSelector, setShowHouseholdSelector] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showMenu && (
              <button
                onClick={onMenuClick}
                className="p-2 text-gray-600 hover:text-gray-900 lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {currentHousehold && (
                <button
                  onClick={() => setShowHouseholdSelector(true)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {currentHousehold.name}
                  <span className="text-xs">▼</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100"
              >
                <img
                  src={user?.avatar}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <hr className="my-2" />
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      // Add sign out logic
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Household Selector Modal */}
      {showHouseholdSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Switch Household</h3>
              <button
                onClick={() => setShowHouseholdSelector(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {households.map(household => (
                <button
                  key={household.id}
                  onClick={() => {
                    setCurrentHousehold(household);
                    setShowHouseholdSelector(false);
                  }}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    currentHousehold?.id === household.id
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                      : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-semibold">{household.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{household.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Navigation component
const Navigation = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'add', label: 'Add', icon: Plus, isButton: true },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="bg-white border-t border-gray-200 px-4 py-2 sticky bottom-0">
      <div className="flex justify-around items-center">
        {navItems.map(item => {
          const Icon = item.icon;
          
          if (item.isButton) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors -mt-6"
              >
                <Icon className="w-7 h-7" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Quick stats component
const QuickStats = () => {
  const stats = [
    {
      label: 'Monthly Budget',
      value: '$2,000',
      change: '+$200',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Spent This Month',
      value: '$1,247',
      change: '+15%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-red-600'
    },
    {
      label: 'Remaining',
      value: '$753',
      change: '-$85',
      trend: 'down',
      icon: TrendingDown,
      color: 'text-orange-600'
    },
    {
      label: 'Accounts',
      value: '3',
      change: 'Active',
      trend: 'neutral',
      icon: CreditCard,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-6 h-6 ${stat.color}`} />
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.trend === 'up' ? 'bg-green-100 text-green-700' :
                stat.trend === 'down' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading your financial data...</p>
    </div>
  </div>
);

// Main app content based on active tab
const AppContent = ({ activeTab, onTabChange }) => {
  const { addNotification } = useNotifications();

  const handleAddExpense = () => {
    addNotification({
      type: 'success',
      title: 'Expense Added',
      message: 'Your expense has been successfully recorded.'
    });
  };

  switch (activeTab) {
    case 'home':
      return (
        <div className="flex-1 overflow-y-auto">
          <QuickStats />
          
          {/* Recent Activity */}
          <div className="p-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Starbucks', amount: -12.50, category: 'Dining', time: '2 hours ago' },
                  { name: 'Grocery Store', amount: -85.34, category: 'Groceries', time: 'Yesterday' },
                  { name: 'Salary', amount: 3500.00, category: 'Income', time: '2 days ago' }
                ].map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{transaction.name}</p>
                      <p className="text-sm text-gray-500">{transaction.category} • {transaction.time}</p>
                    </div>
                    <p className={`font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="p-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Budget Overview</h3>
              <div className="space-y-4">
                {[
                  { category: 'Groceries', spent: 420, budget: 500, color: 'bg-blue-500' },
                  { category: 'Dining Out', spent: 380, budget: 300, color: 'bg-red-500' },
                  { category: 'Transport', spent: 180, budget: 250, color: 'bg-green-500' }
                ].map((item, index) => {
                  const percentage = (item.spent / item.budget) * 100;
                  const isOverBudget = percentage > 100;
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.category}</span>
                        <span className="text-sm text-gray-500">
                          ${item.spent} / ${item.budget}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            isOverBudget ? 'bg-red-500' : item.color
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      {isOverBudget && (
                        <p className="text-xs text-red-600 mt-1">
                          Over budget by ${item.spent - item.budget}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );

    case 'insights':
      return (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Insights Coming Soon</h3>
            <p className="text-gray-600">
              We're building powerful analytics to help you understand your spending patterns.
            </p>
          </div>
        </div>
      );

    case 'add':
      return (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Quick Add</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleAddExpense}
                className="p-6 bg-red-50 rounded-xl border-2 border-red-200 hover:bg-red-100 transition-colors"
              >
                <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="font-semibold text-red-700">Add Expense</p>
              </button>
              <button className="p-6 bg-green-50 rounded-xl border-2 border-green-200 hover:bg-green-100 transition-colors">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-700">Add Income</p>
              </button>
            </div>
            
            {/* Quick expense buttons */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-700 mb-3">Quick Expenses</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Coffee', amount: '$5' },
                  { label: 'Lunch', amount: '$15' },
                  { label: 'Gas', amount: '$40' },
                  { label: 'Groceries', amount: '$80' }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={handleAddExpense}
                    className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left"
                  >
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.amount}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'accounts':
      return (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {[
              { name: 'Checking Account', balance: 2345.67, type: 'checking' },
              { name: 'Savings Account', balance: 15678.90, type: 'savings' },
              { name: 'Credit Card', balance: -1234.56, type: 'credit' }
            ].map((account, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      account.balance >= 0 ? 'text-gray-900' : 'text-red-600'
                    }`}>
                      ${Math.abs(account.balance).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    {account.balance < 0 && (
                      <p className="text-xs text-red-500">Outstanding</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'settings':
      return (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold p-4 border-b border-gray-100">Preferences</h3>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Currency</span>
                  <span className="text-gray-500">USD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold p-4 border-b border-gray-100">Account</h3>
              <div className="p-4 space-y-4">
                <button className="w-full text-left text-gray-700 hover:text-gray-900">
                  Export Data
                </button>
                <button className="w-full text-left text-gray-700 hover:text-gray-900">
                  Privacy Policy
                </button>
                <button className="w-full text-left text-red-600 hover:text-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// Main app component
const ExpenseTrackerApp = () => {
  const { user, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('home');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Stitch</h1>
            <p className="text-gray-600">Your personal finance companion</p>
          </div>
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <AppHeader 
        title={
          activeTab === 'home' ? 'Dashboard' :
          activeTab === 'insights' ? 'Insights' :
          activeTab === 'add' ? 'Add Transaction' :
          activeTab === 'accounts' ? 'Accounts' :
          activeTab === 'settings' ? 'Settings' : 'Stitch'
        }
      />
      
      <AppContent activeTab={activeTab} onTabChange={setActiveTab} />
      
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

// Root component with providers
const App = () => {
  return (
    <AppProvider>
      <NotificationProvider>
        <ExpenseTrackerApp />
      </NotificationProvider>
    </AppProvider>
  );
};

export default App;