# Local Development Setup

## Prerequisites

### Node.js Version
- **Required:** Node.js v20 or higher (tested with v24.11.1)
- Check your version: `node --version`
- Download from: https://nodejs.org/

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bertinamia-ship-it/Villa-Sere-admin.git
   cd Villa-Sere-admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   
   **Where to find these values:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" and "anon/public" key

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will start at: **http://localhost:3000**

### Production Build
```bash
npm run build
npm start
```

## Project Structure

- `/app` - Next.js App Router pages and components
- `/lib` - Utility functions and Supabase client configuration
- `/public` - Static assets
- `supabase-schema.sql` - Database schema for Supabase

## Supabase Setup

If you need to set up the database schema:

1. Log in to your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of `supabase-schema.sql`
4. Run the SQL commands to create tables and storage buckets

Refer to `SUPABASE_SETUP.md` for detailed instructions.

## Troubleshooting

### Port already in use
If port 3000 is busy, specify a different port:
```bash
npm run dev -- -p 3001
```

### Environment variables not loading
- Ensure `.env.local` is in the root directory
- Restart the development server after changing environment variables
- Verify the file is not named `.env.local.txt` or similar

### Dependencies issues
```bash
rm -rf node_modules package-lock.json
npm install
```

## VS Code Recommended Extensions

- ESLint
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features (built-in)

## Additional Documentation

- `README.md` - Project overview
- `SUPABASE_SETUP.md` - Database setup guide
- `CREATE_ADMIN_INSTRUCTIONS.md` - Admin user creation
