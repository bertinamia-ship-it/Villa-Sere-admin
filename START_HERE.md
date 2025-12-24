# 🚀 QUICK START - Villa Sere Admin

## ⚡ 3 Simple Steps to Launch

### 1️⃣ Deploy Database Schema (2 min)

**Action:** Copy & paste SQL schema

1. Tab opened: **Supabase SQL Editor**
2. Run this command to see the schema:
   ```bash
   cat supabase-schema.sql
   ```
3. Copy ALL the SQL
4. Paste into SQL Editor
5. Click **RUN** button
6. Wait for "Success No rows returned"

---

### 2️⃣ Create Storage Bucket (1 min)

**Action:** Create attachments bucket

1. Tab opened: **Supabase Storage**
2. Click "**New bucket**"
3. Name: **attachments**
4. Public: **OFF**
5. Click "**Create bucket**"
6. Click bucket → "**Policies**" → "**New Policy**"
7. Choose "**Allow all operations for authenticated users**"
8. Click "**Review**" → "**Save policy**"

---

### 3️⃣ Test the App (2 min)

**Action:** Create first user and test

1. Tab opened: **http://localhost:3000**
2. Should redirect to **/login**
3. Click "**Sign up**"
4. Create account:
   - Email: `admin@villasere.com`
   - Password: `Password123!`
   - Full Name: `Villa Admin`
5. Login
6. Test creating:
   - ✅ An inventory item
   - ✅ A vendor
   - ✅ A maintenance ticket
   - ✅ An expense

---

## ✅ Verification

Run this to verify setup:
```bash
node setup-supabase.js
```

Expected:
```
✅ Database connection successful!
✅ Bucket "attachments" already exists
```

---

## 🚀 Deploy to Production

### Quick Deploy to Vercel:

```bash
# Test build first
npm run build

# Deploy
npx vercel

# Follow prompts, then add environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 📱 Install as PWA

After deployment:

- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Install app
- **Desktop**: Look for install icon in address bar

---

## 🎉 That's It!

Your villa management system is ready!

**Need help?** Check [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md) for detailed guide.
