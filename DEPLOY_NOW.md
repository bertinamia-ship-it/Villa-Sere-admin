# 🚀 Villa Sere - Deploy Now

## Step 1: Deploy Database Schema (2 minutes)

The SQL schema has been displayed above. Now:

1. **Browser window opened**: Supabase SQL Editor should be open
2. **Copy the SQL**: The complete schema is shown in your terminal
3. **Paste & Run**: 
   - Paste into the SQL Editor
   - Click "RUN" button
   - Wait for "Success" message

**Direct link**: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql/new

## Step 2: Create Storage Bucket (1 minute)

1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/storage/buckets
2. Click "New bucket"
3. Name: **attachments**
4. Public: **OFF** (private)
5. Click "Create bucket"
6. Click on "attachments" bucket → "Policies" → "New Policy"
7. Select "Allow all operations" for authenticated users
8. Click "Review" → "Save policy"

## Step 3: Verify Setup

After completing Steps 1 & 2, run:

```bash
node setup-supabase.js
```

You should see:
- ✅ Database: Ready
- ✅ Storage: Ready

## Step 4: Start Dev Server

```bash
npm run dev
```

Open: http://localhost:3000

## Step 5: Create First User

1. Go to /signup
2. Create admin account with your email
3. Login and start using the app!

## Step 6: Deploy to Vercel

```bash
npm run build        # Test build first
npx vercel           # Deploy
```

Add environment variables in Vercel dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Done! Your villa management app is live! 🎉
