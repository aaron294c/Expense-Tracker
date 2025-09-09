// components/auth/AuthWrapper.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  redirectTo?: string;
}

export function AuthWrapper({ 
  children, 
  requireAuth = true, 
  requireSubscription = false,
  redirectTo = '/login'
}: AuthWrapperProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // Check subscription status if required
  useEffect(() => {
    const checkSubscription = async () => {
      if (!requireSubscription || !user) {
        setSubscriptionStatus(true); // Not required or no user
        return;
      }

      setCheckingSubscription(true);
      try {
        const response = await fetch('/api/subscription-status');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data.isActive || false);
        } else {
          setSubscriptionStatus(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    if (!isLoading) {
      checkSubscription();
    }
  }, [user, isLoading, requireSubscription]);

  // Show loading while checking auth or subscription
  if (isLoading || (requireSubscription && checkingSubscription)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect if authentication is required but user is not logged in
  if (requireAuth && !user) {
    router.push(redirectTo);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect if subscription is required but user doesn't have one
  if (requireSubscription && subscriptionStatus === false) {
    router.push('/subscribe');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}