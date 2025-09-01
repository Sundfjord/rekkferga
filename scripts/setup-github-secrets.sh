#!/bin/bash

echo "🔐 Rekkferga GitHub Secrets Setup"
echo "================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed"
    echo "Please install it first: https://cli.github.com/"
    exit 1
fi

# Check if user is logged in
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub CLI"
    echo "Please run: gh auth login"
    exit 1
fi

echo "📋 This script will help you set up all required GitHub secrets for Rekkferga"
echo ""

# Function to get secret value
get_secret() {
    local secret_name=$1
    local description=$2
    local default_value=$3
    
    echo ""
    echo "🔑 $secret_name"
    echo "   $description"
    if [ ! -z "$default_value" ]; then
        echo "   Default: $default_value"
    fi
    echo ""
    read -p "Enter value for $secret_name: " secret_value
    
    if [ -z "$secret_value" ] && [ ! -z "$default_value" ]; then
        secret_value=$default_value
    fi
    
    if [ ! -z "$secret_value" ]; then
        gh secret set "$secret_name" --body "$secret_value"
        echo "✅ $secret_name set successfully"
    else
        echo "⚠️  Skipping $secret_name (empty value)"
    fi
}

echo "🚂 Railway Secrets"
echo "------------------"
get_secret "RAILWAY_TOKEN" "Railway authentication token (get from railway.app/dashboard → Settings → Tokens)"
get_secret "RAILWAY_PROJECT_ID" "Railway project ID (get from your Railway project → Settings → General)"

echo ""
echo "🌐 Vercel Secrets"
echo "----------------"
get_secret "VERCEL_TOKEN" "Vercel authentication token (get from vercel.com/account/tokens)"
get_secret "VERCEL_ORG_ID" "Vercel organization ID (get from Vercel Dashboard → Settings → General)"
get_secret "VERCEL_PROJECT_ID" "Vercel project ID (get from your Vercel project → Settings → General)"

echo ""
echo "⚡ Azure Functions Secrets"
echo "-------------------------"
get_secret "AZURE_FUNCTIONAPP_PUBLISH_PROFILE" "Azure Functions publish profile (get from Azure Portal → Function App → Get publish profile)"

echo ""
echo "📱 Expo Secrets"
echo "---------------"
get_secret "EXPO_TOKEN" "Expo authentication token (get from expo.dev/accounts/[username]/settings/access-tokens)"

echo ""
echo "🔗 API URLs"
echo "-----------"
get_secret "NEXT_PUBLIC_API_URL" "Public API URL for web app" "https://api.rekkferga.com"
get_secret "EXPO_PUBLIC_API_URL" "Public API URL for mobile app" "https://api.rekkferga.com"

echo ""
echo "💾 Database Secrets"
echo "-------------------"
get_secret "COSMOS_CONNECTION_STRING" "Azure Cosmos DB connection string (get from Azure Portal → Cosmos DB → Keys)"

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test the workflows by pushing to main branch"
echo "2. Check the Actions tab in your GitHub repository"
echo "3. Verify all deployments are successful"
echo ""
echo "📚 For troubleshooting, see .github/SETUP_GITHUB_SECRETS.md"
