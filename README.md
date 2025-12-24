# Villa Sere Management System

A comprehensive villa management PWA for tracking inventory, vendors, maintenance tickets, and expenses.

## Features

- 📦 **Inventory Management**: Track items with categories, locations, quantities, and low-stock alerts
- 🏢 **Vendor Directory**: Manage vendor contacts with WhatsApp integration
- 🔧 **Maintenance Tickets**: Create and track maintenance tasks with priorities and photo attachments
- 💰 **Expense Tracking**: Record expenses with monthly summaries and vendor breakdowns
- 📊 **CSV Export**: Export inventory and expenses data
- 📱 **PWA Support**: Install on mobile devices for offline access
- 🔐 **Authentication**: Secure login with role-based access (Admin/Staff)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase-schema.sql`
3. Go to **Storage** and create a bucket named `attachments` with **Public** access
   - This stores inventory photos, maintenance tickets, and expense receipts
4. Go to **Authentication** → **URL Configuration** and set:
   - **Site URL**: `http://localhost:3000` (for local development)
   - **Redirect URLs**: Add these URLs (one per line):
     - `http://localhost:3000/**`
     - `http://localhost:3000/auth/callback`
   - For production, add your Vercel URL (e.g., `https://your-app.vercel.app/**`)
5. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon public key

### 2. Local Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Create First Admin User

**Option 1: Sign Up Through the App (Recommended)**
1. Open http://localhost:3000
2. Click "Don't have an account? Sign up"
3. Enter your email and password (min. 6 characters)
4. Click "Create Account" - you'll be automatically signed in
5. Go to Supabase → **Table Editor** → **profiles**
6. Find your user and change `role` from `staff` to `admin`
7. Refresh the app to access admin features

**Option 2: Manual Creation in Supabase**
1. Go to Supabase → **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Enter email and password
4. After creation, go to **Table Editor** → **profiles**
5. Find your user and change `role` to `admin`

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or connect your repository in the Vercel dashboard for automatic deployments.

### 5. Install as PWA

**On iPhone:**
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"

**On Android:**
1. Open the app in Chrome
2. Tap the menu (3 dots)
3. Tap "Install app" or "Add to Home Screen"

## Default Categories & Rooms

**Inventory Categories:**
- Cleaning Supplies, Kitchen, Linens & Towels, Toiletries, Pool & Outdoor, Maintenance Tools, Office Supplies, Other

**Rooms:**
- Kitchen, Living Room, Dining Room, Bedrooms (1-4), Bathrooms (1-3), Laundry, Storage, Outdoor, Pool Area, Garage

**Expense Categories:**
- Maintenance, Utilities, Supplies, Cleaning, Pool Service, Landscaping, Repairs, Other

## Usage Tips

1. **Low Stock Alerts**: Set min_threshold for inventory items to get notifications
2. **Quick Adjust**: Use +/- buttons on inventory cards for fast quantity updates
3. **Link Expenses**: Connect expenses to maintenance tickets for better tracking
4. **Monthly Reviews**: Use the month selector in Expenses to review spending patterns
5. **Export Data**: Use CSV export for external reporting or backup

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Only authenticated users can access data
- File uploads are stored in Supabase Storage
- Consider setting up backups for production use

## License

Private use for Villa Sere management.
