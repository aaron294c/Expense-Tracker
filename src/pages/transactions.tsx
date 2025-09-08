import React from 'react';
import { Layout } from '../components/Layout';
import { TransactionList } from '../components/transactions/TransactionList';

export default function TransactionsPage() {
  return (
    <Layout>
      <div className="p-4">
        <TransactionList />
      </div>
    </Layout>
  );
}
