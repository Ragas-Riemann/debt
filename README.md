# Debt Tracker

A full-stack debt tracking application built with Next.js, Supabase, and ShadCN UI.

## Features

- **Authentication**: User signup and login with email/password
- **Multi-user System**: Each user can only access their own data
- **Debtor Management**: Add and manage debtors with contact information
- **Debt Tracking**: Track multiple debts per debtor with descriptions
- **Payment Recording**: Record partial payments with automatic balance calculation
- **Dashboard**: Overview of all debtors with total debt and remaining balance
- **Security**: Row Level Security (RLS) ensures data isolation between users

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: ShadCN UI
- **Backend**: Supabase (Authentication + Database)
- **Database**: PostgreSQL with RLS policies

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Copy your Supabase URL and anon key

### 3. Environment Variables

Create a `.env.local` file in the root directory (copy from `env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **profiles**: User profiles linked to Supabase auth
- **debtors**: Debtor information with contact details
- **debts**: Individual debts owed by debtors
- **payments**: Payment records for each debt

### Views

- **debtor_summary**: Aggregated view showing total debt, remaining balance, and total paid per debtor

## Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own data using `auth.uid()`
- **Protected Routes**: Middleware ensures only authenticated users can access dashboard
- **Secure API**: All database operations go through Supabase with proper authentication

## Pages

- `/` - Redirects to login or dashboard based on auth status
- `/login` - User login page
- `/signup` - User registration page
- `/dashboard` - Main dashboard with debtor overview
- `/debtors/[id]` - Detailed debtor page with debt and payment management

## Usage

1. **Sign up** for a new account or **log in** to an existing one
2. **Add debtors** from the dashboard
3. **View debtor details** to add debts and record payments
4. **Track progress** with automatic balance calculations

## Contributing

This is a demo application. Feel free to extend it with additional features like:
- Debt reminders
- Payment scheduling
- Export functionality
- Advanced reporting
