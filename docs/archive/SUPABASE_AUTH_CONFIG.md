# Supabase Authentication Configuration

## Required Setup for Email Confirmations

### Step 1: Configure Redirect URLs in Supabase
1. Go to your Supabase project dashboard
2. Navigate to: **Authentication** → **URL Configuration**
3. Set the following:

   **Site URL:**
   ```
   http://localhost:3000
   ```

   **Redirect URLs (add both):**
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

### Step 2: For Production Deployment
When deploying to Vercel or other hosting:

1. Add your production URL to **Redirect URLs**:
   ```
   https://your-domain.vercel.app/**
   https://your-domain.vercel.app/auth/callback
   ```

2. Update **Site URL** to your production domain:
   ```
   https://your-domain.vercel.app
   ```

## How It Works

1. **User signs up** → Supabase sends confirmation email
2. **User clicks link** → Opens `http://localhost:3000/auth/callback?code=...`
3. **Callback route** → Exchanges code for session
4. **Auto redirect** → User lands on `/dashboard` (authenticated)

## Email Confirmation Flow

- If email confirmation is **disabled** in Supabase:
  - User is auto-signed in after signup
  - Redirected immediately to dashboard

- If email confirmation is **enabled** in Supabase:
  - User sees: "Check your email to confirm your account"
  - After clicking link → authenticated and redirected to dashboard

## Testing

1. Sign up with a real email address
2. Check your email for confirmation link
3. Click the link - should redirect to dashboard
4. No blank page - proper session handling

## Troubleshooting

**Blank page after clicking email link?**
- Verify redirect URLs are configured in Supabase
- Check that `http://localhost:3000/auth/callback` is in the list
- Restart your dev server after making changes

**"Invalid redirect URL" error?**
- The callback URL must be in Supabase's allowed list
- Use wildcards: `http://localhost:3000/**`
