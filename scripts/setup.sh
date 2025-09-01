#!/bin/bash

echo "🚢 Rekkferga Setup Script"
echo "========================="

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up environment files
echo "Setting up environment files..."
cp packages/api/.env.example packages/api/.env 2>/dev/null || echo "API .env already exists"
cp packages/app/env.example packages/app/.env 2>/dev/null || echo "App .env already exists"
cp packages/web/.env.example packages/web/.env 2>/dev/null || echo "Web .env already exists"

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit environment files with your configuration"
echo "2. Run 'npm run dev:all' to start development servers"
echo "3. Visit http://localhost:3000 for web app"
echo "4. Use Expo Go to test mobile app"
