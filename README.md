# Expense Tracker App

A modern expense tracking application built with Next.js, TypeScript, and Supabase.

## Features

- User authentication with Supabase Auth
- Household-based expense tracking
- Budget management
- Transaction categorization
- Automated categorization rules
- Real-time updates
- Responsive design

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase project URL and keys.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Set up Supabase (if using local development):**
   ```bash
   cd supabase
   npx supabase start
   ```

## Project Structure

```
├── components/
│   ├── auth/          # Authentication components
│   ├── common/        # Reusable UI components
│   └── layout/        # Layout components
├── lib/               # Utility functions and configs
├── pages/             # Next.js pages
│   └── api/           # API routes
├── src/types/         # TypeScript type definitions
├── styles/            # Global styles
└── supabase/          # Supabase configuration and migrations
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for API routes)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## API Routes

- `/api/transactions` - Transaction CRUD operations
- `/api/budgets` - Budget management
- `/api/rules` - Categorization rules
- `/api/setup/demo` - Demo data setup

## Authentication

The app uses Supabase Auth with email/password authentication. Users are automatically redirected to the dashboard after successful authentication.

## Database Schema

The app uses the following main tables:
- `households` - Household information
- `household_members` - User-household relationships
- `accounts` - Financial accounts
- `transactions` - Individual transactions
- `categories` - Expense/income categories
- `budgets` - Budget allocations
- `categorization_rules` - Auto-categorization rules

Views are used for complex queries:
- `v_recent_transactions` - Recent transactions with category info
- `v_account_balances` - Account balances and statistics
- `v_monthly_category_summary` - Monthly spending by category

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
