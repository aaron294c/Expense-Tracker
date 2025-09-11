import React from 'react';
import Layout from '../../components/Layout';
import { AccountList } from '../components/accounts/AccountList';

export default function AccountsPage() {
  return (
    <Layout title="Accounts">
      <div className="p-4">
        <AccountList />
      </div>
    </Layout>
  );
}
