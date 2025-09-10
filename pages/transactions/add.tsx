// pages/transactions/add.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthWrapper } from '../../components/auth/AuthWrapper';
import { AppLayout } from '../../components/layout/AppLayout';
import { AddTransactionModal } from '../../components/transactions/AddTransactionModal';
import { useHousehold } from '../../hooks/useHousehold';

function AddTransactionPage() {
  const router = useRouter();
  const { currentHousehold } = useHousehold();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    router.replace('/dashboard');
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    router.replace('/dashboard');
  };

  if (!currentHousehold) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p className="text-gray-500">Please setup a household first</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNavigation={false}>
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={handleClose}
        householdId={currentHousehold.id}
        onSuccess={handleSuccess}
      />
    </AppLayout>
  );
}

export default function AddTransactionPageWrapper() {
  return (
    <AuthWrapper>
      <AddTransactionPage />
    </AuthWrapper>
  );
}
