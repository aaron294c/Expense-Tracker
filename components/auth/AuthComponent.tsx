import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, Star, ArrowLeft, AlertCircle } from 'lucide-react';

const AuthComponent = () => {
  const [mode, setMode] = useState('welcome'); // 'welcome', 'login', 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'signup' && formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would integrate with your auth system
      console.log('Auth attempt:', { mode, email: formData.email });
      
      // On success, redirect or update app state
      alert(`${mode === 'login' ? 'Login' : 'Signup'} successful!`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const WelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* App Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Star className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Stitch</h1>
          <p className="text-gray-600">Take control of your finances with smart budgeting</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => setMode('signup')}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-blue-700 transition-all duration-200 transform active:scale-95 shadow-lg"
          >
            Get Started
          </button>
          
          <button
            onClick={() => setMode('login')}
            className="w-full bg-white text-gray-700 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 transform active:scale-95 border border-gray-200"
          >
            I have an account
          </button>
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-8 max-w-xs mx-auto">
          By continuing, you agree to our{' '}
          <a href="#" className="text-blue-600 underline">Terms of Service</a> and{' '}
          <a href="#" className="text-blue-600 underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );

  const AuthForm = () => (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4">
        <button
          onClick={() => setMode('welcome')}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-gray-900">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="text-gray-600">
              {mode === 'login' 
                ? 'Enter your credentials to access your budget' 
                : 'Start your journey to better financial health'
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Link (Login only) */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === 'welcome') {
    return <WelcomeScreen />;
  }

  return <AuthForm />;
};

export default AuthComponent;