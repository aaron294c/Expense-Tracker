'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AuthComponentProps {
  mode?: 'signin' | 'signup';
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

type ValidationErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function AuthComponent({ mode = 'signin', onModeChange }: AuthComponentProps) {
  const { signIn, signUp, loading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    // Confirm password validation (only for signup)
    if (mode === 'signup') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatAuthError = (error: string): string => {
    if (error.includes('Invalid login credentials')) {
      return 'The email or password you entered is incorrect. Please try again.';
    }
    if (error.includes('User already registered')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (error.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    if (error.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    return error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setShowSuccess(true);
      }
    } catch (error) {
      // Error is already handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ValidationErrors, value: string) => {
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    switch (field) {
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }
  };

  if (showSuccess && mode === 'signup') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <Card className="p-8 text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email!
          </h2>
          <p className="text-gray-600 mb-6">
            We've sent you a confirmation link at <strong>{email}</strong>.
            Click the link to activate your account.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setShowSuccess(false);
              onModeChange?.('signin');
            }}
          >
            Back to Sign In
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'signin'
              ? 'Sign in to your expense tracker'
              : 'Start tracking your expenses today'
            }
          </p>
        </div>

        {authError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{formatAuthError(authError)}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              className={`w-full ${validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isSubmitting}
            />
            {validationErrors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600"
              >
                {validationErrors.email}
              </motion.p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password'}
              className={`w-full ${validationErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isSubmitting}
            />
            {validationErrors.password && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600"
              >
                {validationErrors.password}
              </motion.p>
            )}
            {mode === 'signup' && !validationErrors.password && password && (
              <p className="mt-2 text-xs text-gray-500">
                Use 8+ characters with uppercase, lowercase, and numbers
              </p>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className={`w-full ${validationErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {validationErrors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600"
                >
                  {validationErrors.confirmPassword}
                </motion.p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              mode === 'signin' ? 'Sign in' : 'Create account'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => onModeChange?.(mode === 'signin' ? 'signup' : 'signin')}
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              disabled={isSubmitting}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
