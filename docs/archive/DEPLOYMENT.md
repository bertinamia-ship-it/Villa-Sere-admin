# Deployment Guide

## Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase project configured

### Steps

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial Villa Sere admin app"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Framework Preset: Next.js (auto-detected)

3. **Add Environment Variables**
   In Vercel project settings, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at: `https://your-project.vercel.app`

5. **Custom Domain (Optional)**
   - Go to Settings > Domains
   - Add your custom domain (e.g., villa-sere.com)
   - Follow DNS configuration instructions

### PWA Installation

Once deployed:
- **On iPhone**: Open in Safari, tap Share → Add to Home Screen
- **On Android**: Open in Chrome, tap Menu → Install app
- The app will work offline and feel like a native app!

## Alternative: Deploy to Netlify

1. Push to GitHub (same as above)
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Select your GitHub repo
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Add environment variables in Site settings > Environment variables

## Environment Variables Checklist

Make sure these are set in your deployment platform:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Post-Deployment

1. Test the login flow
2. Create your admin account
3. Update role to 'admin' in Supabase
4. Test all features on mobile device
5. Install PWA on your phone for daily use

## Continuous Deployment

Vercel automatically redeploys when you push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```

Changes will be live in ~2 minutes!

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all dependencies in package.json
- Check build logs for specific errors

### Images Not Loading
- Verify storage bucket is public
- Check storage policies in Supabase
- Ensure image URLs are correct

### Login Issues
- Verify Supabase URL and keys
- Check redirect URLs in Supabase Auth settings
- Add your deployment URL to allowed redirect URLs

## Security Notes

- Never commit `.env.local` to Git
- Keep your Supabase anon key in environment variables only
- Use service role key only in secure server functions (not included in this app)
- Enable 2FA on your Supabase and Vercel accounts

## Support

For issues, check:
1. Vercel deployment logs
2. Supabase logs
3. Browser console for errors
4. Network tab for API failures
