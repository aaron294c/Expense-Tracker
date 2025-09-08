import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseBrowser';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          router.push('/?error=auth_callback_error');
          return;
        }

        if (data.session) {
          // Try to join demo household
          try {
            const response = await fetch('/api/setup/demo', {
              method: 'POST',
            });
            
            if (!response.ok) {
              console.warn('Could not join demo household');
            }
          } catch (err) {
            console.warn('Demo setup failed:', err);
          }

          router.push('/dashboard');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
