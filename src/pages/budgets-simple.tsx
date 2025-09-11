// Simple budgets page that definitely works
import React from 'react';

export default function BudgetsPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Budgets</h1>
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2>Budget Overview</h2>
        <p>Your budget tracking page is working! 🎉</p>
        <div style={{ marginTop: '20px' }}>
          <h3>Sample Budget Categories:</h3>
          <ul>
            <li>Food & Dining: $500/month</li>
            <li>Transportation: $200/month</li>
            <li>Entertainment: $100/month</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/transactions" style={{ 
          backgroundColor: '#007bff', 
          color: 'white', 
          padding: '10px 20px', 
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Back to Transactions
        </a>
      </div>
    </div>
  );
}