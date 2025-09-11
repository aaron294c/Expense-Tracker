import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ExpensesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/transactions?type=expense');
  }, [router]);

  return (
    <div className="p-6 text-center">
      <p className="text-gray-600">Redirecting to transactions...</p>
    </div>
  );
}