import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';
import { AddTransactionModal } from '../../components/transactions/AddTransactionModal';

export default function AddTransactionPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/');
  };

  return (
    <Layout showNavigation={false}>
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleClose}
      />
    </Layout>
  );
}
