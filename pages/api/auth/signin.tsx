// pages/auth/signin.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, user, isLoading: authLoading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsSubmitting(true);
    const success = await signIn(formData.email, formData.password);
    setIsSubmitting(false);

    if (success) {
      router.push('/dashboard');
    }
  };

  if (authLoading) {
    return <AuthSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">💰</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your expense tracker</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Sign In Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.email || !formData.password}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Account */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">Demo Account:</p>
            <p className="text-xs text-gray-500">Email: demo@example.com</p>
            <p className="text-xs text-gray-500">Password: demo123</p>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-500 hover:text-blue-600 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// pages/auth/signup.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

export default function SignUpPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    householdName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (authData.user) {
        // Create household for new user
        const { data: household, error: householdError } = await supabase
          .from('households')
          .insert({
            name: formData.householdName || `${formData.email.split('@')[0]}'s Household`,
            base_currency: 'USD'
          })
          .select()
          .single();

        if (householdError) {
          console.error('Error creating household:', householdError);
        }

        if (household) {
          // Add user as household owner
          const { error: memberError } = await supabase
            .from('household_members')
            .insert({
              household_id: household.id,
              user_id: authData.user.id,
              role: 'owner'
            });

          if (memberError) {
            console.error('Error adding household member:', memberError);
          }
        }

        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin?message=account-created');
        }, 2000);
      }

    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <AuthSkeleton />;
  }

  if (success) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🚀</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get started</h1>
          <p className="text-gray-600">Create your expense tracker account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Household Name (Optional)
              </label>
              <input
                type="text"
                value={formData.householdName}
                onChange={(e) => setFormData(prev => ({ ...prev, householdName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Smith Family Budget"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Create a password"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.email || !formData.password || !formData.confirmPassword}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-green-500 hover:text-green-600">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-green-500 hover:text-green-600">Privacy Policy</a>
          </p>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-green-500 hover:text-green-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared Components
function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-4xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
        <p className="text-gray-600 mb-4">
          Check your email to verify your account, then sign in to get started.
        </p>
        <p className="text-sm text-gray-500">Redirecting to sign in...</p>
      </div>
    </div>
  );
}