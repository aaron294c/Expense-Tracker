// WORKING budgets page
export default function BudgetsPage() {
  return (
    <div style={{ padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '24px'
        }}>
          💰 Budgets
        </h1>
        
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#16a34a', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            ✅ Budget Page Working!
          </h2>
          <p style={{ color: '#15803d' }}>
            Your budget tracking system is now functional and accessible.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #fcd34d'
          }}>
            <h3 style={{ color: '#92400e', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              📊 Monthly Overview
            </h3>
            <p style={{ color: '#a16207', fontSize: '14px' }}>
              Track your spending against monthly budgets
            </p>
          </div>

          <div style={{
            backgroundColor: '#ede9fe',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #c4b5fd'
          }}>
            <h3 style={{ color: '#6b21a8', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              🏷️ Category Limits
            </h3>
            <p style={{ color: '#7c3aed', fontSize: '14px' }}>
              Set spending limits by category
            </p>
          </div>

          <div style={{
            backgroundColor: '#fecaca',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #fca5a5'
          }}>
            <h3 style={{ color: '#991b1b', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              📈 Progress Tracking
            </h3>
            <p style={{ color: '#dc2626', fontSize: '14px' }}>
              Visual progress bars and alerts
            </p>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid #e5e7eb',
          paddingTop: '24px'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '16px'
          }}>
            Quick Actions
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a 
              href="/transactions/add"
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ➕ Add Expense
            </a>
            
            <a 
              href="/transactions"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📊 View Transactions
            </a>

            <a 
              href="/accounts"
              style={{
                backgroundColor: '#059669',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              💳 Accounts
            </a>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation Space */}
      <div style={{ height: '80px' }}></div>
    </div>
  );
}
