#!/bin/bash

# Villa Sere Admin - Quick Setup Script

echo "🏡 Villa Sere Management System - Setup"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your Supabase credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    read -p "Press Enter when you've updated .env.local..."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up Supabase (see SUPABASE_SETUP.md)"
echo "2. Run 'npm run dev' to start development server"
echo "3. Open http://localhost:3000"
echo "4. Create your first admin user"
echo ""
echo "📱 For PWA icons:"
echo "   Open public/create-icons.html in a browser"
echo "   Right-click each canvas and save as icon-192.png and icon-512.png"
echo ""
echo "🚀 Ready to deploy? See DEPLOYMENT.md"
