# 🔐 Create Admin Account - Instructions

## Step 1: Get Service Role Key

I've opened the Supabase API Settings page in your browser.

**On that page:**
1. Scroll to **"Project API keys"** section
2. Find **"service_role" key** (marked as "secret")
3. Click to reveal it
4. Copy the full key

## Step 2: Add Service Role Key to .env.local

Run this command in the terminal (replace `YOUR_KEY_HERE` with the actual key):

```bash
echo "" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY_HERE" >> .env.local
```

**Or manually:**
1. Open `.env.local` file
2. Add this line at the end:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```
3. Save the file

## Step 3: Create Admin Account

Once you've added the service role key, run:

```bash
node create-admin.js
```

This will:
- ✅ Create user in Supabase Auth
- ✅ Create profile with admin role
- ✅ Generate a secure one-time login link
- ✅ No passwords sent in plain text

## Step 4: Log In

The script will output:
- 📧 Your admin email
- 🔑 A one-time magic login link (valid for 1 hour)

Click the link to log in automatically, then set your own password in the app.

---

## Quick Command Sequence

```bash
# 1. Add service role key (replace YOUR_KEY with actual key)
echo "SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY" >> .env.local

# 2. Create admin account
node create-admin.js

# 3. Click the magic link that appears
# 4. Set your password in the app
```

---

## ⚠️ Security Note

The service_role key has admin privileges. Keep it secret:
- Never commit it to git (it's in .gitignore)
- Never share it publicly
- Use it only for backend admin operations
