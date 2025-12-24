# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Name it "villa-sere-admin" or similar
3. Set a strong database password (save it securely)
4. Choose a region close to Cabo San Lucas (US West recommended)

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste and click **Run**
5. Verify all tables were created in **Table Editor**

## Step 3: Configure Storage

1. Go to **Storage** in the Supabase dashboard
2. Click **New Bucket**
3. Name it: `photos`
4. Set it to **Public** bucket
5. Click **Create**

## Step 4: Get API Keys

1. Go to **Settings** > **API**
2. Copy your **Project URL**
3. Copy your **anon/public** key
4. Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5: Create First Admin User

1. Deploy your app or run locally
2. Go to the login page and sign up
3. In Supabase, go to **Table Editor** > **profiles**
4. Find your user and change `role` from `staff` to `admin`
5. Log out and log back in

## Row Level Security (RLS)

The schema includes RLS policies that:
- Allow authenticated users to read all data
- Allow authenticated users to create/update/delete data
- Protect user profiles (users can only see/edit their own)

## Storage Policies

You'll need to add these policies manually in Storage > Policies:

### For the "photos" bucket:

**SELECT (Read) Policy:**
```sql
true
```

**INSERT (Upload) Policy:**
```sql
auth.role() = 'authenticated'
```

**UPDATE Policy:**
```sql
auth.role() = 'authenticated'
```

**DELETE Policy:**
```sql
auth.role() = 'authenticated'
```

This allows:
- Anyone to view photos (public bucket)
- Only authenticated users to upload/modify/delete

## Backup

Enable automatic backups:
1. Go to **Settings** > **Database**
2. Enable **Point-in-Time Recovery** (PITR) for production
3. Consider daily backups for critical data

## Done!

Your Supabase backend is now fully configured and ready to use with the Villa Sere management app.
