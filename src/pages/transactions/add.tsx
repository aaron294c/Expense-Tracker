import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { BasicTransactionForm } from '../../components/forms/BasicTransactionForm';

export default function AddTransactionPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/transactions');
  };

  return (
    <Layout showNavigation={false}>
      <BasicTransactionForm 
        isOpen={isModalOpen} 
        onClose={handleClose}
      />
    </Layout>
  );
}
