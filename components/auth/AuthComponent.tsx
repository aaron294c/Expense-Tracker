'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';

interface AuthComponentProps {
  mode?: 'signin' | 'signup';
  onModeChange?: (mode: 'signin' | 'signup') => void;
  onSuccess?: () => void;
}

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function AuthComponent({ mode = 'signin', onModeChange, onSuccess }: AuthComponentProps) {
  const { signIn, signUp, resetPassword, loading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const schema = mode === 'signin' ? signInSchema : signUpSchema;
    try {
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof FormErrors;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (mode === 'signin') {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password);
      }
      onSuccess?.();
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }

    try {
      await resetPassword(formData.email);
      setResetSent(true);
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to send reset email' });
    }
  };

  if (isResetMode && resetSent) {
    return (
      <Card className="p-8 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to {formData.email}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setIsResetMode(false);
              setResetSent(false);
              setFormData({ email: '', password: '', confirmPassword: '' });
            }}
          >
            Back to Sign In
          </Button>
        </motion.div>
      </Card>
    );
  }

  return (
    <Card className="p-8 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          {isResetMode ? 'Reset Password' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>

        {errors.general && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-center"
          >
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{errors.general}</span>
          </motion.div>
        )}

        <form onSubmit={isResetMode ? handleResetPassword : handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="Enter your email"
              className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {!isResetMode && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                    className={errors.password ? 'border-red-500 focus:border-red-500 pr-10' : 'pr-10'}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword || ''}
                      onChange={handleInputChange('confirmPassword')}
                      placeholder="Confirm your password"
                      className={errors.confirmPassword ? 'border-red-500 focus:border-red-500 pr-10' : 'pr-10'}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loading}
          >
            {(isSubmitting || loading) ? (
              <LoadingSpinner className="mr-2" size="sm" />
            ) : null}
            {isResetMode ? 'Send Reset Email' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6">
          {!isResetMode && (
            <>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-sm text-blue-600 hover:text-blue-500 block text-center w-full mb-4"
                >
                  Forgot your password?
                </button>
              )}
              
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                </span>
                <button
                  type="button"
                  onClick={() => onModeChange?.(mode === 'signin' ? 'signup' : 'signin')}
                  className="ml-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </>
          )}
          
          {isResetMode && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </Card>
  );
}